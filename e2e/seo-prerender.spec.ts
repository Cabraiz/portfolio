import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import type seoPages from "../src/features/seo/seo-pages.json";

const seo: typeof seoPages = JSON.parse(
	readFileSync(new URL("../src/features/seo/seo-pages.json", import.meta.url), "utf8")
);

// HTML entregue antes do JavaScript: é o que buscadores e assistentes de IA
// (GPTBot, ClaudeBot, PerplexityBot...) leem. Gerado por scripts/prerender-seo.mjs.
const PROJECTS = ["NEXOVARE", "APP BANCO", "BIDEIRAS", "APP BARBEARIA", "Entre Paginas", "Wagner Adv", "Fran Studio"];
const visibleText = (html: string) =>
	html
		.replace(/<head[\s\S]*?<\/head>/, " ")
		.replace(/<script[\s\S]*?<\/script>/g, " ")
		.replace(/<style[\s\S]*?<\/style>/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ");
const decode = (value: string | undefined) => (value ?? "").replace(/&amp;/g, "&");

for (const pageId of ["home", "portfolio"] as const) {
	for (const language of ["pt", "en"] as const) {
		const page = seo.pages[pageId][language];

		test(`HTML sem JavaScript de ${page.path} tem cabeçalho e conteúdo`, async ({ request }) => {
			const response = await request.get(page.path);
			expect(response.status()).toBe(200);
			const html = await response.text();

			expect(html).toContain(`<html lang="${language === "en" ? "en" : "pt-BR"}">`);
			expect(decode(html.match(/<title>([^<]*)<\/title>/)?.[1])).toBe(page.title);
			expect(html).toContain(`<link rel="canonical" href="${seo.siteUrl}${page.path}" />`);
			expect(html).toContain(`hreflang="pt-BR" href="${seo.siteUrl}${seo.pages[pageId].pt.path}"`);
			expect(html).toContain(`hreflang="en" href="${seo.siteUrl}${seo.pages[pageId].en.path}"`);

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
			expect(text).toMatch(language === "en" ? /Software Engineer/ : /Engenheiro de Software/);
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

	for (const language of ["pt", "en"] as const) {
		const html = await (await request.get(seo.pages.home[language].path)).text();
		expect(html).toContain(`<meta property="og:image" content="${seo.shareImage.url}" />`);
		expect(html).toContain(`<link rel="image_src" href="${seo.portrait.url}" />`);
		const body = html.slice(html.indexOf("<body"));
		expect(body).toMatch(
			language === "pt"
				? /<img alt="Retrato de Mateus Cardoso Cabral"/
				: /<img alt="Portrait of Mateus Cardoso Cabral"/
		);
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
	expect(locations).toHaveLength(5);
	for (const location of locations) {
		expect((await request.get(location.replace(seo.siteUrl, ""))).status()).toBe(200);
	}

	const robots = await (await request.get("/robots.txt")).text();
	expect(robots).toContain("Sitemap: https://cabraiz.com/sitemap.xml");
	expect(robots).toMatch(/GPTBot[\s\S]*ClaudeBot[\s\S]*PerplexityBot/);

	const llms = await (await request.get("/llms.txt")).text();
	for (const project of PROJECTS) expect(llms).toContain(project);

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
