// Dados e constantes compartilhados do prerender-seo.mjs (lê o seo-pages.json e o dist/index.html).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = path.join(projectRoot, "dist");
const seo = JSON.parse(
	await readFile(path.join(projectRoot, "src/features/seo/seo-pages.json"), "utf8")
);
const shellHtml = await readFile(path.join(distDirectory, "index.html"), "utf8");
if (shellHtml.includes('data-prerendered="true"')) {
	throw new Error("dist já foi pré-renderizado: rode o build (vite build) de novo antes.");
}
const buildDate = new Date().toISOString().slice(0, 10);
// Inglês primeiro: é o idioma principal (x-default e raiz do site).
const LANGUAGES = ["en", "pt", "es"];
const DEFAULT_LANGUAGE = seo.defaultLanguage;
const PAGE_IDS = ["home", "portfolio"];
const HTML_LANG = { en: "en", pt: "pt-BR", es: "es" };
const OG_LOCALE = { en: "en_US", pt: "pt_BR", es: "es_LA" };
// Valores aceitos pelo Google (es-419 não é aceito).
const HREFLANG = { en: "en", pt: "pt-BR", es: "es" };
const BROWSER_LOCALE = { en: "en-US", pt: "pt-BR", es: "es-MX" };
const LANGUAGE_NAMES = { en: "English", pt: "Português (Brasil)", es: "Español (Latinoamérica)" };
const WHATSAPP_URL = "https://wa.me/5585998575707";
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

export {
	projectRoot,
	distDirectory,
	seo,
	shellHtml,
	buildDate,
	LANGUAGES,
	DEFAULT_LANGUAGE,
	PAGE_IDS,
	HTML_LANG,
	OG_LOCALE,
	HREFLANG,
	BROWSER_LOCALE,
	LANGUAGE_NAMES,
	WHATSAPP_URL,
	DESKTOP_CARD,
	MIME_TYPES,
	escapeHtml,
	absolute,
};
