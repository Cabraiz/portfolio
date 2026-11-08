import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import type seoPages from "../src/features/seo/seo-pages.json";

const seo: typeof seoPages = JSON.parse(
	readFileSync(new URL("../src/features/seo/seo-pages.json", import.meta.url), "utf8")
);

// HTML entregue antes do JavaScript: é o que buscadores e assistentes de IA
// (GPTBot, ClaudeBot, PerplexityBot...) leem. Gerado por scripts/prerender-seo.mjs.
const PROJECTS = ["NEXOVARE", "APP BANCO", "BIDEIRAS", "ClockRight", "Entre Paginas", "Gemarium", "Fran Studio"];
const visibleText = (html: string) =>
	html
		.replace(/<head[\s\S]*?<\/head>/, " ")
		.replace(/<script[\s\S]*?<\/script>/g, " ")
		.replace(/<style[\s\S]*?<\/style>/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ");
const decode = (value: string | undefined) => (value ?? "").replace(/&amp;/g, "&");

const LANGUAGES = ["en", "pt", "es"] as const;
const HTML_LANG = { en: "en", pt: "pt-BR", es: "es" } as const;
const HREFLANG = { en: "en", pt: "pt-BR", es: "es" } as const;
const TITLE_TEXT = { en: /Senior AI Engineer/, pt: /Senior AI Engineer/, es: /Ingeniero de IA Senior/ } as const;
const PORTRAIT_ALT = {
	en: "Portrait of Mateus Cabral",
	pt: "Retrato de Mateus Cabral",
	es: "Retrato de Mateus Cabral",
} as const;

for (const pageId of ["home", "portfolio"] as const) {
	for (const language of LANGUAGES) {
		const page = seo.pages[pageId][language];

		test(`HTML sem JavaScript de ${page.path} tem cabeçalho e conteúdo`, async ({ request }) => {
			const response = await request.get(page.path);
			expect(response.status()).toBe(200);
			const html = await response.text();

			expect(html).toContain(`<html lang="${HTML_LANG[language]}">`);
			expect(decode(html.match(/<title>([^<]*)<\/title>/)?.[1])).toBe(page.title);
			expect(html).toContain(`<link rel="canonical" href="${seo.siteUrl}${page.path}" />`);
			for (const alternate of LANGUAGES) {
				expect(html).toContain(
					`hreflang="${HREFLANG[alternate]}" href="${seo.siteUrl}${seo.pages[pageId][alternate].path}"`
				);
			}
			expect(html).toContain(`hreflang="x-default" href="${seo.siteUrl}${seo.pages[pageId].en.path}"`);

			const jsonLd = JSON.parse(
				html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]
			);
			const person = jsonLd["@graph"].find((node: { "@type": string }) => node["@type"] === "Person");
			expect(person.jobTitle).toBe(seo.person.jobTitle[language]);

			const body = html.slice(html.indexOf("<body"));
			expect(body.match(/<h1[\s>]/g)).toHaveLength(1);
			const text = visibleText(html);
			expect(text.split(" ").length).toBeGreaterThan(120);
			for (const project of PROJECTS) expect(text.toLowerCase()).toContain(project.toLowerCase());
			expect(text).toMatch(TITLE_TEXT[language]);
			// Links visíveis para as outras versões (seletor de idioma).
			for (const alternate of LANGUAGES) {
				expect(body).toContain(`href="${seo.pages[pageId][alternate].path}"`);
			}
		});
	}
}

// A foto oficial precisa existir e estar ligada ao nome em todo lugar que
// buscadores e assistentes leem: <img alt>, og:image, JSON-LD, sitemap e llms.txt.
test("foto oficial é publicada e ligada ao nome", async ({ request }) => {
	const local = (url: string) => url.replace(seo.siteUrl, "");
	for (const image of [seo.portrait, seo.shareImage]) {
		const response = await request.get(local(image.url));
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("image/jpeg");
	}

	for (const language of LANGUAGES) {
		const html = await (await request.get(seo.pages.home[language].path)).text();
		expect(html).toContain(`<meta property="og:image" content="${seo.shareImage.url}" />`);
		expect(html).toContain(`<link rel="image_src" href="${seo.portrait.url}" />`);
		const body = html.slice(html.indexOf("<body"));
		expect(body).toContain(`<img alt="${PORTRAIT_ALT[language]}"`);
		const graph = JSON.parse(
			html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]
		)["@graph"];
		const portrait = graph.find((node: { "@type": string }) => node["@type"] === "ImageObject");
		expect(portrait.contentUrl).toBe(seo.portrait.url);
		expect(portrait.creditText).toBe(seo.person.name);
		const person = graph.find((node: { "@type": string }) => node["@type"] === "Person");
		expect(person.image["@id"]).toBe(portrait["@id"]);
	}

	const sitemap = await (await request.get("/sitemap.xml")).text();
	expect(sitemap).toContain(`<image:loc>${seo.portrait.url}</image:loc>`);
	const llms = await (await request.get("/llms.txt")).text();
	expect(llms).toContain(seo.portrait.url);
});

test("sitemap, robots, llms.txt e rotas antigas", async ({ request }) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
	// 2 páginas × 3 idiomas + 3 currículos.
	expect(locations).toHaveLength(9);
	for (const location of locations) {
		expect((await request.get(location.replace(seo.siteUrl, ""))).status()).toBe(200);
	}

	const robots = await (await request.get("/robots.txt")).text();
	expect(robots).toContain("Sitemap: https://cabraiz.com/sitemap.xml");
	expect(robots).toMatch(/GPTBot[\s\S]*ClaudeBot[\s\S]*PerplexityBot/);

	const llms = await (await request.get("/llms.txt")).text();
	for (const project of PROJECTS) expect(llms).toContain(project);
	for (const language of LANGUAGES) {
		expect(llms).toContain(seo.person.jobTitle[language]);
		expect(llms).toContain(`${seo.siteUrl}${seo.resume[language]}`);
	}

	// A raiz entrega o inglês (x-default) para quem não executa JavaScript.
	const root = await (await request.get("/")).text();
	expect(root).toContain('<html lang="en">');
	expect(root).toContain(`<link rel="canonical" href="${seo.siteUrl}/en/home/" />`);

	for (const retired of seo.retiredPaths) {
		const html = await (await request.get(`/${retired}/`)).text();
		expect(html).toContain('content="0; url=https://cabraiz.com/home/"');
		expect(html).toContain("noindex");
	}
});

test("versão em inglês com JavaScript mantém idioma, URL e cabeçalho", async ({ page }) => {
	await page.setViewportSize({ width: 1366, height: 768 });
	await page.goto("/en/home/");
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page).toHaveTitle(seo.pages.home.en.title);
	await expect(page.locator("#root")).not.toHaveAttribute("data-prerendered", /.*/);
	await page.locator('button[data-nav-link="portfolio"]').click();
	await expect(page).toHaveURL(/\/en\/portfolio/);
	await expect(page).toHaveTitle(seo.pages.portfolio.en.title);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		`${seo.siteUrl}/en/portfolio/`
	);
});

test("português continua em português com navegador automatizado em inglês", async ({ browser }) => {
	const context = await browser.newContext({ locale: "en-US" });
	const page = await context.newPage();
	await page.goto("/home/");
	await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
	await expect(page).toHaveURL(/\/home\/?$/);
	await expect(page).toHaveTitle(seo.pages.home.pt.title);
	await context.close();
});

for (const [locale, path] of [
	["en-US", "/en/home/"],
	["es-MX", "/es/home/"],
	["pt-BR", "/home/"],
	["de-DE", "/en/home/"],
] as const) {
	test(`raiz leva o navegador ${locale} para ${path}`, async ({ browser }) => {
		const context = await browser.newContext({ locale });
		// Registra se o aviso de erro global chegou a aparecer, mesmo por um
		// instante, em qualquer documento aberto durante o redirecionamento.
		await context.addInitScript(() => {
			new MutationObserver(() => {
				if (document.getElementById("global-runtime-fallback")) {
					sessionStorage.setItem("saw-runtime-fallback", location.pathname);
				}
			}).observe(document, { childList: true, subtree: true });
		});
		const page = await context.newPage();
		await page.goto("/");
		await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}$`));
		expect(await page.evaluate(() => sessionStorage.getItem("saw-runtime-fallback"))).toBeNull();
		await expect(page.locator("#global-runtime-fallback")).toHaveCount(0);
		await context.close();
	});
}

test("seletor de idioma troca para o espanhol e lembra a escolha", async ({ page }) => {
	await page.setViewportSize({ width: 1366, height: 768 });
	await page.goto("/en/portfolio/");
	const switcher = page.locator("nav[data-language-switcher]").filter({ visible: true });
	await expect(switcher.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "page");
	await switcher.getByRole("link", { name: "Español (Latinoamérica)" }).click();
	await expect(page).toHaveURL(/\/es\/portfolio\/$/);
	await expect(page.locator("html")).toHaveAttribute("lang", "es");
	await expect(page).toHaveTitle(seo.pages.portfolio.es.title);
	await page.goto("/");
	await expect(page).toHaveURL(/\/es\/home\/$/);
});
