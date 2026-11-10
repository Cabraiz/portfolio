import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { PRIVACY_LINKS, PRIVACY_PATHS, PRIVACY_TEXT, type PrivacyLanguage } from "./privacyNotice.text";
import styles from "./PrivacyNotice.module.css";

const LANGUAGE_LABELS: Record<PrivacyLanguage, string> = { pt: "PT", en: "EN", es: "ES" };

function languageFromPath(pathname: string): PrivacyLanguage {
	if (pathname.startsWith("/en/")) return "en";
	if (pathname.startsWith("/es/")) return "es";
	return "pt";
}

/** Aviso de privacidade (LGPD e GDPR), com endereço próprio em cada idioma. */
export default function PrivacyNotice() {
	const { pathname } = useLocation();
	const language = languageFromPath(pathname);
	const text = PRIVACY_TEXT[language];

	useEffect(() => {
		const previousTitle = document.title;
		const previousLang = document.documentElement.lang;
		document.title = text.documentTitle;
		document.documentElement.lang = text.htmlLang;
		// Canonical próprio: a página não pode apontar para o Início.
		const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
		const previousCanonical = canonical?.href;
		canonical?.setAttribute("href", `https://cabraiz.com${PRIVACY_PATHS[language]}`);
		window.scrollTo(0, 0);
		return () => {
			document.title = previousTitle;
			document.documentElement.lang = previousLang;
			if (canonical && previousCanonical) canonical.setAttribute("href", previousCanonical);
		};
	}, [language, text]);

	return (
		<main className={styles.page} lang={text.htmlLang}>
			<article className={styles.document}>
				<nav className={styles.top} aria-label="Idioma / Language">
					<Link className={styles.back} to={text.backHref}>
						← {text.back}
					</Link>
					<span className={styles.languages}>
						{(Object.keys(PRIVACY_PATHS) as PrivacyLanguage[]).map((code) => (
							<Link
								key={code}
								to={PRIVACY_PATHS[code]}
								className={code === language ? styles.languageActive : styles.language}
								aria-current={code === language ? "page" : undefined}
								hrefLang={PRIVACY_TEXT[code].htmlLang}
							>
								{LANGUAGE_LABELS[code]}
							</Link>
						))}
					</span>
				</nav>

				<header className={styles.header}>
					<h1>{text.title}</h1>
					<p className={styles.updated}>{text.updated}</p>
					<p className={styles.intro}>{text.intro}</p>
				</header>

				{text.sections.map((section) => (
					<section key={section.title} className={styles.section}>
						<h2>{section.title}</h2>
						{section.paragraphs.map((paragraph) => (
							<p key={paragraph}>{withLinks(paragraph)}</p>
						))}
						{section.items ? (
							<ul>
								{section.items.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						) : null}
					</section>
				))}
			</article>
		</main>
	);
}

/** Troca o e-mail de contato e o endereço da política geral por links clicáveis. */
function withLinks(paragraph: string) {
	const pattern = new RegExp(`(${PRIVACY_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
	return paragraph.split(pattern).map((part) => {
		const link = PRIVACY_LINKS.find((item) => item.text === part);
		// Cada link aparece no máximo uma vez por parágrafo.
		return link ? (
			<a key={link.href} href={link.href}>
				{part}
			</a>
		) : (
			part
		);
	});
}
