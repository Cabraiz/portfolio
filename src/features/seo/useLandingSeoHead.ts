import { useEffect } from "react";

import {
	getLanguageFromPath,
	type LandingLanguage,
} from "@/features/navigation/landingSections";

import seo from "./seo-pages.json";

export type LandingSeoPageId = keyof typeof seo.pages;

const OG_LOCALE: Record<LandingLanguage, string> = { pt: "pt_BR", en: "en_US" };
const HTML_LANG: Record<LandingLanguage, string> = { pt: "pt-BR", en: "en" };

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
	let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
	if (!element) {
		element = document.createElement("meta");
		element.setAttribute(attribute, key);
		document.head.appendChild(element);
	}
	element.setAttribute("content", content);
}

function upsertLink(selector: string, attributes: Record<string, string>): void {
	let element = document.head.querySelector<HTMLLinkElement>(selector);
	if (!element) {
		element = document.createElement("link");
		document.head.appendChild(element);
	}
	Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

/**
 * Cabeçalho da página por seção e idioma (fonte única em seo-pages.json, a
 * mesma usada pelo HTML pré-renderizado): título, descrição, canonical,
 * Open Graph, hreflang e lang. Com a aba escondida o título vira o curto.
 */
export default function useLandingSeoHead(
	pageId: LandingSeoPageId,
	enabled = true
): void {
	useEffect(() => {
		if (!enabled) return undefined;
		const language = getLanguageFromPath(globalThis.window?.location.pathname);
		const page = seo.pages[pageId][language];
		const url = `${seo.siteUrl}${page.path}`;
		const hiddenTitle = seo.hiddenTabTitle[language];

		const applyTitle = () => {
			document.title = document.hidden ? hiddenTitle : page.title;
		};
		applyTitle();

		document.documentElement.lang = HTML_LANG[language];
		upsertMeta("name", "description", page.description);
		upsertMeta("property", "og:title", page.title);
		upsertMeta("property", "og:description", page.description);
		upsertMeta("property", "og:url", url);
		upsertMeta("property", "og:locale", OG_LOCALE[language]);
		upsertMeta("name", "twitter:title", page.title);
		upsertMeta("name", "twitter:description", page.description);
		upsertLink('link[rel="canonical"]', { rel: "canonical", href: url });
		upsertLink('link[rel="alternate"][hreflang="pt-BR"]', {
			rel: "alternate",
			hreflang: "pt-BR",
			href: `${seo.siteUrl}${seo.pages[pageId].pt.path}`,
		});
		upsertLink('link[rel="alternate"][hreflang="en"]', {
			rel: "alternate",
			hreflang: "en",
			href: `${seo.siteUrl}${seo.pages[pageId].en.path}`,
		});
		upsertLink('link[rel="alternate"][hreflang="x-default"]', {
			rel: "alternate",
			hreflang: "x-default",
			href: `${seo.siteUrl}${seo.pages[pageId].pt.path}`,
		});

		document.addEventListener("visibilitychange", applyTitle);
		return () => document.removeEventListener("visibilitychange", applyTitle);
	}, [enabled, pageId]);
}
