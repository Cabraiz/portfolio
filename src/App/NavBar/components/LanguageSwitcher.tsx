import { localizeLabel, useLabelLanguage } from "@/i18n/labels";
import { type CSSProperties } from "react";
import { useLocation } from "react-router-dom";

import {
	getLanguageFromPath,
	getLanguagePath,
	LANDING_LANGUAGES,
	type LandingLanguage,
} from "../../../features/navigation/landingSections";
import { rememberPreferredLanguage } from "../../../i18n/languageRedirect";

// Cada idioma com o próprio nome (padrão para seletores de idioma).
const LANGUAGE_OPTIONS: Readonly<
	Record<LandingLanguage, { short: string; name: string; hrefLang: string }>
> = {
	en: { short: "EN", name: "English", hrefLang: "en" },
	pt: { short: "PT", name: "Português (Brasil)", hrefLang: "pt-BR" },
	es: { short: "ES", name: "Español (Latinoamérica)", hrefLang: "es" },
};

export type LanguageSwitcherProps = Readonly<{
	tone?: "dark" | "light";
	size?: "compact" | "default";
	style?: CSSProperties;
}>;

/**
 * Links visíveis para a mesma página nos três idiomas. São links comuns
 * (carregam a página pré-renderizada do idioma), então buscadores e IAs
 * também enxergam as versões. A escolha fica salva para a próxima visita.
 */
export default function LanguageSwitcher({
	tone = "dark",
	size = "default",
	style,
}: LanguageSwitcherProps) {
	useLabelLanguage();
	const { pathname } = useLocation();
	const current = getLanguageFromPath(pathname);
	const ink = tone === "light" ? "7, 62, 58" : "255, 255, 255";

	const listStyle: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: size === "compact" ? "2px" : "4px",
		margin: 0,
		padding: "3px",
		listStyle: "none",
		borderRadius: "999px",
		border: `1px solid rgba(${ink}, 0.22)`,
		background: tone === "light" ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.28)",
	};

	return (
		<nav aria-label={localizeLabel("Idioma")} data-language-switcher="" data-agent-piece="" style={style}>
			<ul style={listStyle}>
				{LANDING_LANGUAGES.map((language) => {
					const option = LANGUAGE_OPTIONS[language];
					const isCurrent = language === current;
					return (
						<li key={language}>
							<a
								href={getLanguagePath(language, pathname)}
								hrefLang={option.hrefLang}
								lang={option.hrefLang}
								aria-label={option.name}
								aria-current={isCurrent ? "page" : undefined}
								title={option.name}
								onClick={() => rememberPreferredLanguage(language)}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									minWidth: size === "compact" ? "30px" : "34px",
									height: size === "compact" ? "24px" : "28px",
									padding: "0 8px",
									borderRadius: "999px",
									fontSize: size === "compact" ? "11px" : "12px",
									fontWeight: 700,
									letterSpacing: "0.08em",
									textDecoration: "none",
									color: isCurrent
										? tone === "light"
											? "#ffffff"
											: "#050505"
										: `rgba(${ink}, 0.78)`,
									background: isCurrent
										? tone === "light"
											? "#0b665f"
											: "rgba(255, 255, 255, 0.92)"
										: "transparent",
									transition: "background-color 160ms ease, color 160ms ease",
								}}
							>
								{option.short}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
