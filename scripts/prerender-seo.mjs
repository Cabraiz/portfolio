/**
 * Pré-renderização para buscadores e assistentes de IA.
 *
 * O site é um SPA: sem isto, o HTML entregue é uma casca vazia e robôs que não
 * executam JavaScript (GPTBot, ClaudeBot, PerplexityBot...) não leem nada.
 * Depois do build (e de prepare-github-pages), este script abre cada página
 * num Chromium, captura o conteúdo renderizado e grava em dist/:
 * - /home/, /portfolio/, /en/home/, /en/portfolio/ (e / e /en/) com título,
 *   descrição, canonical, hreflang, Open Graph e JSON-LD próprios, e o
 *   conteúdo real dentro de #root (escondido até o React montar);
 * - páginas estáticas de redirecionamento para as rotas que saíram do site;
 * - sitemap.xml com as versões de idioma e llms.txt com o resumo do site.
 * Os textos de SEO vêm de src/features/seo/seo-pages.json (o mesmo arquivo
 * que o app usa em tempo de execução).
 */
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = path.join(projectRoot, "dist");
const seo = JSON.parse(
	await readFile(path.join(projectRoot, "src/features/seo/seo-pages.json"), "utf8")
);
const shellHtml = await readFile(path.join(distDirectory, "index.html"), "utf8");
const buildDate = new Date().toISOString().slice(0, 10);
const LANGUAGES = ["pt", "en"];
const PAGE_IDS = ["home", "portfolio"];
const HTML_LANG = { pt: "pt-BR", en: "en" };
const OG_LOCALE = { pt: "pt_BR", en: "en_US" };
const WHATSAPP_URL = "https://wa.me/5585998575707";
const RESUME_PATH = "/files/mateus-cabral-resume.pdf";
// Card do projeto no desktop (o do celular é outro elemento, escondido aqui).
const DESKTOP_CARD = "[data-portfolio-root] article[class*='_detailCard_']";

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".webp": "image/webp",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".ico": "image/x-icon",
	".glb": "model/gltf-binary",
	".mp3": "audio/mpeg",
};

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

const absolute = (pathname) => `${seo.siteUrl}${pathname}`;

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
		locale: language === "en" ? "en-US" : "pt-BR",
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
	await page.waitForSelector("main[data-landing-viewport] h1", { timeout: 30_000 });
	await page.waitForSelector(`${DESKTOP_CARD} h2`, { timeout: 30_000 });
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

function personNode(language) {
	const { person } = seo;
	return {
		"@type": "Person",
		"@id": `${seo.siteUrl}/#person`,
		name: person.name,
		alternateName: person.alternateName,
		givenName: person.givenName,
		familyName: person.familyName,
		jobTitle: person.jobTitle[language],
		description: person.description[language],
		url: absolute(seo.pages.home[language].path),
		image: seo.image,
		email: `mailto:${person.email}`,
		address: {
			"@type": "PostalAddress",
			addressLocality: person.address.locality,
			addressRegion: person.address.region,
			addressCountry: person.address.country,
		},
		knowsAbout: person.knowsAbout,
		sameAs: person.sameAs,
	};
}

function structuredData(pageId, language, projects) {
	const page = seo.pages[pageId][language];
	const url = absolute(page.path);
	const graph = [
		{
			"@type": "WebSite",
			"@id": `${seo.siteUrl}/#website`,
			url: absolute(seo.pages.home.pt.path),
			name: seo.siteName,
			alternateName: `${seo.person.name} — ${seo.person.jobTitle[language]}`,
			inLanguage: ["pt-BR", "en"],
			publisher: { "@id": `${seo.siteUrl}/#person` },
		},
		personNode(language),
	];

	if (pageId === "home") {
		graph.push({
			"@type": "ProfilePage",
			"@id": `${url}#webpage`,
			url,
			name: page.title,
			description: page.description,
			inLanguage: HTML_LANG[language],
			dateModified: buildDate,
			isPartOf: { "@id": `${seo.siteUrl}/#website` },
			mainEntity: { "@id": `${seo.siteUrl}/#person` },
		});
	} else {
		graph.push({
			"@type": "CollectionPage",
			"@id": `${url}#webpage`,
			url,
			name: page.title,
			description: page.description,
			inLanguage: HTML_LANG[language],
			dateModified: buildDate,
			isPartOf: { "@id": `${seo.siteUrl}/#website` },
			about: { "@id": `${seo.siteUrl}/#person` },
			mainEntity: {
				"@type": "ItemList",
				numberOfItems: projects.length,
				itemListElement: projects.map((project, index) => ({
					"@type": "ListItem",
					position: index + 1,
					item: {
						"@type": "CreativeWork",
						"@id": `${url}#${project.id}`,
						name: project.name,
						description: project.description,
						genre: project.category,
						dateCreated: project.year,
						keywords: project.technologies.join(", "),
						locationCreated: { "@type": "Place", name: `${project.place}, ${project.country}` },
						image: project.image ? absolute(project.image) : undefined,
						creator: { "@id": `${seo.siteUrl}/#person` },
						inLanguage: HTML_LANG[language],
					},
				})),
			},
		});
	}

	return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replaceAll(
		"</",
		"<\\/"
	);
}

function headBlock(pageId, language, projects, preloads) {
	const page = seo.pages[pageId][language];
	const url = absolute(page.path);
	const other = language === "pt" ? "en" : "pt";
	const title = escapeHtml(page.title);
	const description = escapeHtml(page.description);
	const imageAlt = escapeHtml(language === "pt" ? `Retrato de ${seo.person.name}` : `Portrait of ${seo.person.name}`);
	return `<!-- seo:start (gerado por scripts/prerender-seo.mjs) -->
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="author" content="${escapeHtml(seo.person.name)}" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="pt-BR" href="${absolute(seo.pages[pageId].pt.path)}" />
    <link rel="alternate" hreflang="en" href="${absolute(seo.pages[pageId].en.path)}" />
    <link rel="alternate" hreflang="x-default" href="${absolute(seo.pages[pageId].pt.path)}" />
    <link rel="alternate" type="text/plain" href="${seo.siteUrl}/llms.txt" title="llms.txt" />
    <meta property="og:type" content="${pageId === "home" ? "profile" : "website"}" />
    <meta property="og:site_name" content="${escapeHtml(seo.siteName)}" />
    <meta property="og:locale" content="${OG_LOCALE[language]}" />
    <meta property="og:locale:alternate" content="${OG_LOCALE[other]}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${seo.image}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta property="profile:first_name" content="${escapeHtml(seo.person.givenName)}" />
    <meta property="profile:last_name" content="${escapeHtml(seo.person.familyName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${seo.image}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
${preloads
	.map(
		({ href, media }) =>
			`    <link rel="preload" as="image" href="${href}" media="${media}" fetchpriority="high" />`
	)
	.join("\n")}
    <script type="application/ld+json">
${structuredData(pageId, language, projects)}
    </script>
    <!-- seo:end -->`;
}

function renderPage(pageId, language, rootHtml, projects, preloads) {
	let html = shellHtml.replace(
		/<!-- seo:start[\s\S]*?<!-- seo:end -->/,
		headBlock(pageId, language, projects, preloads)
	);
	html = html.replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[language]}">`);
	html = html.replace(/<noscript>\s*Mateus[\s\S]*?<\/noscript>\s*/, "");
	html = html.replace(
		'<div id="root"></div>',
		`<div id="root" data-prerendered="true">${rootHtml}</div>`
	);
	if (!html.includes('data-prerendered="true"')) {
		throw new Error("Não achei o <div id=\"root\"></div> no index.html do build.");
	}
	return html;
}

function retiredPage(target) {
	return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${target}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>${escapeHtml(seo.pages.home.pt.title)}</title>
  </head>
  <body>
    <p>Esta página mudou para <a href="${target}">${target}</a>.</p>
  </body>
</html>
`;
}

function sitemapXml() {
	const entries = PAGE_IDS.flatMap((pageId) =>
		LANGUAGES.map(
			(language) => `  <url>
    <loc>${absolute(seo.pages[pageId][language].path)}</loc>
    <lastmod>${buildDate}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${absolute(seo.pages[pageId].pt.path)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${absolute(seo.pages[pageId].en.path)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(seo.pages[pageId].pt.path)}" />
  </url>`
		)
	);
	entries.push(`  <url>
    <loc>${absolute(RESUME_PATH)}</loc>
    <lastmod>${buildDate}</lastmod>
  </url>`);
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

function llmsTxt(projectsByLanguage) {
	const { person } = seo;
	const projectLines = (language) =>
		projectsByLanguage[language]
			.map(
				(project) =>
					`### ${project.name} — ${project.category} (${project.year})\n` +
					`${language === "pt" ? "Local" : "Location"}: ${project.place}, ${project.country}\n` +
					`${project.description}\n` +
					`${language === "pt" ? "Tecnologias" : "Technologies"}: ${project.technologies.join(", ")}\n`
			)
			.join("\n");
	return `# ${person.name} — ${person.jobTitle.pt} / ${person.jobTitle.en}

> ${person.description.pt}
>
> ${person.description.en}

Site: ${seo.siteUrl} (português em /home/, inglês em /en/home/).

## Páginas / Pages

- [Início](${absolute(seo.pages.home.pt.path)}): ${seo.pages.home.pt.description}
- [Portfólio](${absolute(seo.pages.portfolio.pt.path)}): ${seo.pages.portfolio.pt.description}
- [Home (English)](${absolute(seo.pages.home.en.path)}): ${seo.pages.home.en.description}
- [Portfolio (English)](${absolute(seo.pages.portfolio.en.path)}): ${seo.pages.portfolio.en.description}
- [Currículo / Résumé (PDF)](${absolute(RESUME_PATH)})

## Contato / Contact

- E-mail: ${person.email}
- WhatsApp: ${WHATSAPP_URL}
${person.sameAs.map((url) => `- ${url}`).join("\n")}

## Áreas / Expertise

${person.knowsAbout.map((item) => `- ${item}`).join("\n")}

## Projetos (português)

${projectLines("pt")}
## Projects (English)

${projectLines("en")}`;
}

async function findAsset(prefix) {
	const assets = await readdir(path.join(distDirectory, "assets"));
	const file = assets.find((name) => name.startsWith(prefix) && name.endsWith(".webp"));
	return file ? `/assets/${file}` : null;
}

async function writeDist(relativePath, content) {
	const target = path.join(distDirectory, relativePath);
	await mkdir(path.dirname(target), { recursive: true });
	await writeFile(target, content);
}

const server = await startStaticServer();
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
	process.env.PRERENDER_CHROMIUM_PATH
		? { executablePath: process.env.PRERENDER_CHROMIUM_PATH }
		: {}
);

try {
	const mobilePortrait = await findAsset("hero-mobile-portrait-");
	const captures = {};
	const projectsByLanguage = {};

	for (const language of LANGUAGES) {
		for (const pageId of PAGE_IDS) {
			const { context, page } = await openPage(
				browser,
				baseUrl,
				seo.pages[pageId][language].path,
				language
			);
			captures[`${pageId}:${language}`] = await captureRoot(page);
			if (pageId === "portfolio") projectsByLanguage[language] = await collectProjects(page);
			await context.close();
		}
	}

	for (const language of LANGUAGES) {
		const projects = projectsByLanguage[language];
		if (!projects || projects.length === 0) {
			throw new Error(`Nenhum projeto lido do portfólio (${language}).`);
		}
		for (const pageId of PAGE_IDS) {
			const capture = captures[`${pageId}:${language}`];
			const preloads = [
				capture.heroImage && { href: capture.heroImage, media: "(min-width: 992px)" },
				mobilePortrait && { href: mobilePortrait, media: "(max-width: 991.98px)" },
			].filter(Boolean);
			const html = renderPage(pageId, language, capture.html, projects, preloads);
			const pagePath = seo.pages[pageId][language].path;
			await writeDist(path.join(pagePath, "index.html"), html);
			// / e /en/ entregam o Início (canonical aponta para /home/ e /en/home/).
			if (pageId === "home") {
				await writeDist(language === "pt" ? "index.html" : "en/index.html", html);
			}
		}
	}

	for (const retired of seo.retiredPaths) {
		await writeDist(path.join(retired, "index.html"), retiredPage(absolute(seo.pages.home.pt.path)));
	}

	await writeDist("sitemap.xml", sitemapXml());
	await writeDist("llms.txt", llmsTxt(projectsByLanguage));

	console.log(
		`Pré-renderização SEO: ${PAGE_IDS.length * LANGUAGES.length} páginas, ` +
			`${seo.retiredPaths.length} redirecionamentos, sitemap.xml e llms.txt ` +
			`(${projectsByLanguage.pt.length} projetos).`
	);
} finally {
	await browser.close();
	server.close();
}
