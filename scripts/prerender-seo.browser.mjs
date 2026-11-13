// Servidor estático do dist e captura das páginas no Chromium (prerender-seo.mjs).
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import {
	distDirectory,
	BROWSER_LOCALE,
	DESKTOP_CARD,
	MIME_TYPES,
} from "./prerender-seo.context.mjs";

/** Servidor estático do dist com fallback de SPA (como o GitHub Pages + 404). */
async function startStaticServer() {
	const server = createServer(async (request, response) => {
		const url = new URL(request.url ?? "/", "http://localhost");
		const decoded = decodeURIComponent(url.pathname);
		let filePath = path.join(distDirectory, decoded);
		try {
			const info = await stat(filePath);
			if (info.isDirectory()) filePath = path.join(filePath, "index.html");
			await stat(filePath);
		} catch {
			filePath = path.extname(decoded) ? "" : path.join(distDirectory, "index.html");
		}
		if (!filePath) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, {
			"content-type": MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream",
		});
		createReadStream(filePath).pipe(response);
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	return server;
}

async function openPage(browser, baseUrl, pathname, language) {
	const context = await browser.newContext({
		viewport: { width: 1366, height: 768 },
		locale: BROWSER_LOCALE[language],
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
	await page.waitForSelector("main[data-landing-viewport] h1", { timeout: 30_000 });
	// No desktop o card fica escondido atrás do painel em camadas, mas segue no DOM
	// com os dados de cada projeto: basta estar montado.
	await page.waitForSelector(`${DESKTOP_CARD} h2`, { state: "attached", timeout: 30_000 });
	await page.waitForTimeout(800);
	if (errors.length > 0) {
		throw new Error(`Erros ao renderizar ${pathname}: ${errors.join(" | ")}`);
	}
	return { context, page };
}

/** Conteúdo da raiz já renderizado, sem estado de animação. */
async function captureRoot(page) {
	return page.evaluate(() => {
		const root = document.getElementById("root");
		const clone = root.cloneNode(true);
		clone.querySelectorAll("[data-motion-idle]").forEach((element) => {
			element.removeAttribute("data-motion-idle");
		});
		return {
			html: clone.innerHTML,
			heroImage: document.querySelector("img[data-hero-option]")?.getAttribute("src") ?? null,
		};
	});
}

/** Dados de cada projeto, lidos do próprio card do portfólio (sempre em dia). */
async function collectProjects(page) {
	const buttons = page.locator("[data-portfolio-root] aside button[data-project-id]");
	const count = await buttons.count();
	const projects = [];
	for (let index = 0; index < count; index += 1) {
		await buttons.nth(index).click();
		await page.waitForTimeout(250);
		projects.push(
			await page.evaluate(({ projectIndex, cardSelector }) => {
				const card = document.querySelector(cardSelector);
				const text = (selector) =>
					card.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
				const meta = Array.from(card.querySelectorAll("[class*='detailMeta'] span")).map(
					(span) => span.textContent.trim()
				);
				return {
					id: document
						.querySelectorAll("[data-portfolio-root] aside button[data-project-id]")
						[projectIndex].getAttribute("data-project-id"),
					name: text("h2"),
					description: text("h2 + p"),
					country: text("header strong"),
					place: text("header span"),
					year: meta[0] ?? "",
					category: meta[1] ?? "",
					technologies: Array.from(card.querySelectorAll("[class*='technologyList'] span"))
						.map((span) => span.textContent.trim())
						.filter(Boolean),
					image: card.querySelector("img")?.getAttribute("src") ?? "",
				};
			}, { projectIndex: index, cardSelector: DESKTOP_CARD })
		);
	}
	return projects;
}

export {
	startStaticServer,
	openPage,
	captureRoot,
	collectProjects,
};
