import { localizeLabel } from "@/i18n/labels";
import { FiArrowUpRight } from "react-icons/fi";
import styles from "./Portfolio.module.css";

/** Domínio exibido no selo (sem protocolo, "www." nem barra final). */
export const toSiteHost = (url: string) =>
	new URL(url).host.replace(/^www\./, "");

export const toSiteLinkLabel = (projectName: string, url: string) =>
	`${localizeLabel("Abrir site")}: ${projectName} — ${toSiteHost(url)} (${localizeLabel("abre em nova aba")})`;

type ProjectSiteBadgeProps = Readonly<{ variant: "desktop" | "mobile" }>;

/** Selo "Abrir site ↗" (o link fica no elemento pai ou no próprio selo). */
export function ProjectSiteBadge({ variant }: ProjectSiteBadgeProps) {
	return (
		<span
			className={`${styles.projectSiteBadge} ${
				variant === "mobile" ? styles.projectSiteBadgeMobile : ""
			}`}
			aria-hidden="true"
		>
			{localizeLabel("Abrir site")}
			<FiArrowUpRight />
		</span>
	);
}
