/**
 * Pré-renderização para buscadores e assistentes de IA.
 *
 * O site é um SPA: sem isto, o HTML entregue é uma casca vazia e robôs que não
 * executam JavaScript (GPTBot, ClaudeBot, PerplexityBot...) não leem nada.
 * Depois do build (e de prepare-github-pages), este script abre cada página
 * num Chromium, captura o conteúdo renderizado e grava em dist/:
 * - Início e Portfólio em inglês (/en/, idioma principal e x-default),
 *   português (/home/, /portfolio/) e espanhol (/es/), mais / , /en/ e /es/,
 *   com título, descrição, canonical, hreflang, Open Graph e JSON-LD
 *   próprios, e o conteúdo real dentro de #root (escondido até o React montar);
 * - páginas estáticas de redirecionamento para as rotas que saíram do site;
 * - sitemap.xml com as versões de idioma e llms.txt com o resumo do site.
 * Os textos de SEO vêm de src/features/seo/seo-pages.json (o mesmo arquivo
 * que o app usa em tempo de execução).
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

import {
	distDirectory,
	seo,
	shellHtml,
	LANGUAGES,
	DEFAULT_LANGUAGE,
	PAGE_IDS,
	absolute,
} from "./prerender-seo.context.mjs";
import {
	startStaticServer,
	openPage,
	captureRoot,
	collectProjects,
} from "./prerender-seo.browser.mjs";
import {
	renderPage,
	retiredPage,
} from "./prerender-seo.html.mjs";
import {
	sitemapXml,
	llmsTxt,
} from "./prerender-seo.sitemap.mjs";

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
			// /en/ e /es/ entregam o Início do idioma; a raiz / entrega o inglês
			// (x-default) para robôs, e quem tem JavaScript vai para o idioma do
			// navegador (languageRedirect). O canonical aponta para /…/home/.
			if (pageId === "home" && language !== "pt") {
				await writeDist(`${language}/index.html`, html);
			}
			if (pageId === "home" && language === DEFAULT_LANGUAGE) {
				await writeDist("index.html", html);
			}
		}
	}

	for (const retired of seo.retiredPaths) {
		await writeDist(path.join(retired, "index.html"), retiredPage(absolute(seo.pages.home.pt.path)));
	}

	// Aviso de privacidade do portfólio: documento direto (HTTP 200, sem passar
	// pelo 404 do GitHub Pages); o app monta a página. Mesmos caminhos de
	// src/pages/Privacy/privacyNotice.text.ts.
	for (const privacyPath of ["/aviso-de-privacidade/", "/en/privacy-notice/", "/es/aviso-de-privacidad/"]) {
		await writeDist(path.join(privacyPath, "index.html"), shellHtml);
	}

	await writeDist("sitemap.xml", sitemapXml());
	await writeDist("llms.txt", llmsTxt(projectsByLanguage));

	console.log(
		`Pré-renderização SEO: ${PAGE_IDS.length * LANGUAGES.length} páginas, ` +
			`${seo.retiredPaths.length} redirecionamentos, sitemap.xml e llms.txt ` +
			`(${projectsByLanguage.en.length} projetos, ${LANGUAGES.length} idiomas).`
	);
} finally {
	await browser.close();
	server.close();
}
