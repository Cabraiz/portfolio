import { localizeLabel } from "@/i18n/labels";
import type { CSSProperties } from "react";

import nexovarePessoa from "../../../assets/Mateus/portfolio/stage/nexovare-pessoa.webp";
import nexovareCena from "../../../assets/Mateus/portfolio/stage/nexovare-cena.webp";
import nexovareTela1 from "../../../assets/Mateus/portfolio/stage/nexovare-tela1.webp";
import bancoPessoa from "../../../assets/Mateus/portfolio/stage/banco-pessoa.webp";
import bancoCena from "../../../assets/Mateus/portfolio/stage/banco-cena.webp";
import bancoTela1 from "../../../assets/Mateus/portfolio/stage/banco-tela1.webp";
import bideirasPessoa from "../../../assets/Mateus/portfolio/stage/bideiras-pessoa.webp";
import bideirasCena from "../../../assets/Mateus/portfolio/stage/bideiras-cena.webp";
import bideirasTela1 from "../../../assets/Mateus/portfolio/stage/bideiras-tela1.webp";
import clockrightPessoa from "../../../assets/Mateus/portfolio/stage/clockright-pessoa.webp";
import clockrightCena from "../../../assets/Mateus/portfolio/stage/clockright-cena.webp";
import clockrightTela1 from "../../../assets/Mateus/portfolio/stage/clockright-tela1.webp";
import entrePessoa from "../../../assets/Mateus/portfolio/stage/entrepaginas-pessoa.webp";
import entreCena from "../../../assets/Mateus/portfolio/stage/entrepaginas-cena.webp";
import entreTela1 from "../../../assets/Mateus/portfolio/stage/entrepaginas-tela1.webp";
import entreTela2 from "../../../assets/Mateus/portfolio/stage/entrepaginas-tela2.webp";
import gemariumPessoa from "../../../assets/Mateus/portfolio/stage/gemarium-pessoa.webp";
import gemariumCena from "../../../assets/Mateus/portfolio/stage/gemarium-cena.webp";
import gemariumTela1 from "../../../assets/Mateus/portfolio/stage/gemarium-tela1.webp";
import franPessoa from "../../../assets/Mateus/portfolio/stage/fran-pessoa.webp";
import franCena from "../../../assets/Mateus/portfolio/stage/fran-cena.webp";
import franTela1 from "../../../assets/Mateus/portfolio/stage/fran-tela1.webp";

import { ProjectSiteBadge, toSiteLinkLabel } from "./ProjectSiteLink";
import styles from "./ProjectStage.module.css";
import type { PortfolioProject, PortfolioProjectId } from "./types";

/*
 * Painel da direita no desktop: cada projeto tem uma cena em camadas, desenhada
 * num quadro de 500×600 que o CSS escala para a altura da tela.
 *   - círculo com uma paisagem do lugar passando devagar (pan + zoom leve);
 *   - pessoa recortada, ligada ao tema do projeto, saindo do círculo;
 *   - prints reais do site como peças soltas;
 *   - texto em HTML (nome, área, local, ano e tecnologias).
 * Tudo em coordenadas do quadro (px de desenho).
 */

type Box = Readonly<{ x: number; y: number }>;
type Screen = Box &
	Readonly<{
		src: string;
		w: number;
		rot?: number;
		alt: string;
		/** Raio da moldura, igual ao da peça gerada. */
		radius?: number;
		/** Peça recortada (fundo transparente): sem moldura nem fundo. */
		bare?: boolean;
	}>;
type Person = Readonly<{
	src: string;
	h: number;
	right: number;
	top?: number;
	bottom?: number;
	/** Corpo inteiro: sem o degradê que some com as pernas. */
	full?: boolean;
}>;

type StageConfig = Readonly<{
	circle: Box & Readonly<{ d: number }>;
	scene: string;
	person: Person;
	screens: readonly Screen[];
	caption: Box & Readonly<{ w: number }>;
	/** false: o nome já é a marca, então o logo não aparece em cima. */
	logo?: boolean;
}>;

const STAGES: Partial<Record<PortfolioProjectId, StageConfig>> = {
	"erp-varejo": {
		circle: { x: 196, y: 70, d: 290 },
		scene: nexovareCena,
		person: { src: nexovarePessoa, right: 20, top: 96, h: 560 },
		screens: [{ src: nexovareTela1, x: 120, y: 336, w: 302, alt: "Painel do Nexovare" }],
		caption: { x: 22, y: 100, w: 160 },
	},
	"app-bank": {
		circle: { x: 204, y: 150, d: 286 },
		scene: bancoCena,
		person: { src: bancoPessoa, right: -8, bottom: 112, h: 330 },
		screens: [{ src: bancoTela1, x: 16, y: 84, w: 300, rot: -3, radius: 18, alt: "Saldo no App Banco" }],
		caption: { x: 22, y: 300, w: 170 },
	},
	"guine-bissau-commerce": {
		circle: { x: 186, y: 84, d: 300 },
		scene: bideirasCena,
		person: { src: bideirasPessoa, right: -6, bottom: 150, h: 380 },
		screens: [{ src: bideirasTela1, x: 16, y: 350, w: 380, alt: "Página inicial da Bideiras" }],
		caption: { x: 22, y: 96, w: 152 },
	},
	clockright: {
		circle: { x: 236, y: 80, d: 250 },
		scene: clockrightCena,
		person: { src: clockrightPessoa, right: 34, top: 96, h: 392, full: true },
		screens: [{ src: clockrightTela1, x: 20, y: 300, w: 212, radius: 14, alt: "Menu do ClockRight" }],
		caption: { x: 22, y: 96, w: 210 },
	},
	"central-clube-livro": {
		circle: { x: 246, y: 250, d: 222 },
		scene: entreCena,
		person: { src: entrePessoa, right: 28, top: 320, h: 190, full: true },
		screens: [
			{ src: entreTela1, x: 14, y: 80, w: 472, alt: "Página inicial do Entre Paginas" },
			{ src: entreTela2, x: 4, y: 418, w: 271, bare: true, alt: "Planos do Entre Paginas" },
		],
		caption: { x: 22, y: 262, w: 200 },
		logo: false,
	},
	"site-adv": {
		circle: { x: 216, y: 80, d: 268 },
		scene: gemariumCena,
		person: { src: gemariumPessoa, right: 44, top: 92, h: 452, full: true },
		screens: [{ src: gemariumTela1, x: 34, y: 286, w: 146, bare: true, alt: "Aplicativo do Gemarium" }],
		caption: { x: 22, y: 96, w: 190 },
	},
	"site-cabeleireira": {
		circle: { x: 226, y: 96, d: 262 },
		scene: franCena,
		person: { src: franPessoa, right: 30, top: 104, h: 384, full: true },
		screens: [
			{ src: franTela1, x: 18, y: 304, w: 206, rot: -3, alt: "Página inicial do Fran Studio" },
		],
		caption: { x: 22, y: 96, w: 200 },
	},
};

export const hasProjectStage = (projectId: PortfolioProjectId) =>
	Boolean(STAGES[projectId]);

type StageStyle = CSSProperties & Record<`--${string}`, string>;

const px = (value: number) => `${value}px`;

export default function ProjectStage({ project }: Readonly<{ project: PortfolioProject }>) {
	const stage = STAGES[project.id];
	if (!stage) return null;

	const { circle, person, caption } = stage;
	const location = project.worldLocation;
	const stageStyle: StageStyle = {
		"--circle-x": px(circle.x),
		"--circle-y": px(circle.y),
		"--circle-d": px(circle.d),
	};
	const personStyle: CSSProperties = {
		right: px(person.right),
		top: person.top === undefined ? undefined : px(person.top),
		bottom: person.bottom === undefined ? undefined : px(person.bottom),
		height: px(person.h),
	};

	return (
		<div className={styles.dock}>
			<div className={styles.backdrop} aria-hidden="true" />
		<div
			key={project.id}
			className={styles.stage}
			style={stageStyle}
			data-project-stage={project.id}
		>
			<div className={styles.ring} aria-hidden="true" />
			<div className={styles.circle} aria-hidden="true">
				<img className={styles.scene} src={stage.scene} alt="" draggable={false} decoding="async" />
			</div>
			<img
				className={`${styles.person} ${person.full ? "" : styles.personFade}`}
				style={personStyle}
				src={person.src}
				alt=""
				aria-hidden="true"
				draggable={false}
				decoding="async"
			/>

			{stage.screens.map((screen, index) => (
				<div
					key={screen.src}
					className={`${styles.screen} ${screen.bare ? styles.screenBare : ""}`}
					style={{
						borderRadius: screen.radius ? px(screen.radius) : undefined,
						left: px(screen.x),
						top: px(screen.y),
						width: px(screen.w),
						rotate: screen.rot ? `${screen.rot}deg` : undefined,
						animationDelay: `${120 + index * 90}ms`,
					}}
				>
					<img src={screen.src} alt={localizeLabel(screen.alt)} draggable={false} decoding="async" />
					{/* O primeiro print abre o site do projeto, quando ele está no ar. */}
					{index === 0 && project.siteUrl ? (
						<a
							className={styles.siteLink}
							href={project.siteUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={toSiteLinkLabel(localizeLabel(project.name), project.siteUrl)}
							data-project-site-link={project.id}
						>
							<ProjectSiteBadge variant="mobile" />
						</a>
					) : null}
				</div>
			))}

			<div
				className={styles.caption}
				style={{ left: px(caption.x), top: px(caption.y), width: px(caption.w) }}
			>
				{stage.logo === false ? null : (
						<img className={styles.captionLogo} src={project.logoSrc} alt={localizeLabel(project.logoAlt)} />
					)}
				<h2>{localizeLabel(project.name)}</h2>
				<i aria-hidden="true" />
				<p>{localizeLabel(project.subtitle)}</p>
				<ul>
					<li>
						{localizeLabel(location?.city ?? "Fortaleza")} · {localizeLabel(location?.country ?? "Brasil")}
					</li>
					<li>{localizeLabel(project.year)}</li>
					<li>{project.technologies.map((technology) => localizeLabel(technology)).join(" · ")}</li>
				</ul>
			</div>
		</div>
		</div>
	);
}
