import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "react-router-dom";

import { getSectionIdByPath } from "@/features/navigation/landingSections";
import useLandingSectionNavigation from "@/features/navigation/useLandingSectionNavigation";

import flagHongKong from "../../../assets/Mateus/portfolio/flags/hong-kong-semicircle-realistic-v1.webp";
import flagBrazil from "../../../assets/Mateus/portfolio/flags/brasil-semicircle-realistic-v4.webp";
import flagUnitedStates from "../../../assets/Mateus/portfolio/flags/estados-unidos-semicircle-realistic-v3.webp";
import flagGuineaBissau from "../../../assets/Mateus/portfolio/flags/guine-bissau-semicircle-realistic-v3.webp";
import flagMexico from "../../../assets/Mateus/portfolio/flags/mexico-semicircle-realistic-v3.webp";
import flagPortugal from "../../../assets/Mateus/portfolio/flags/portugal-semicircle-realistic-v3.webp";
// Avião da rota: "Jet Airplane" (CC0, https://opengameart.org/content/jet-airplane),
// pintado nas cores do site e renderizado de cima no Blender.
import journeyPlane from "../../../assets/Mateus/portfolio/journey-plane-v2.webp";

import usePortfolioActiveItem from "./hooks/usePortfolioActiveItem";
import useMobilePortfolioBrandPush from "./hooks/useMobilePortfolioBrandPush";
import useDesktopDetailCardFit from "./hooks/useDesktopDetailCardFit";
import usePortfolioMotion from "./hooks/usePortfolioMotion";
import { defaultPortfolioProjectId, portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import MobileProjectMeta from "./MobileProjectMeta";
import ProjectStage, { hasProjectStage, preloadProjectStages } from "./ProjectStage";
import ProjectImageLightbox from "./ProjectImageLightbox";
import { ProjectSiteBadge, toSiteLinkLabel } from "./ProjectSiteLink";
import type { PortfolioProjectId } from "./types";
import { worldAtlasTiles } from "./worldAtlasTiles";

const PORTFOLIO_AUTOPLAY_INTERVAL_MS = 6200;
const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
	Brasil: flagBrazil,
	// O único projeto na China é em Hong Kong, que tem bandeira própria.
	"Hong Kong": flagHongKong,
	México: flagMexico,
	"Guiné-Bissau": flagGuineaBissau,
	"Estados Unidos": flagUnitedStates,
	Portugal: flagPortugal,
};

const PROJECT_DESCRIPTIONS: Record<PortfolioProjectId, string> = {
	"erp-varejo":
		"Gestão completa de cotações, produtos e fornecedores para operações comerciais com visão clara do negócio.",
	"app-bank":
		"Experiência bancária mobile desenhada para tornar consultas, movimentações e decisões financeiras mais simples.",
	"guine-bissau-commerce":
		"Loja virtual com catálogo, carrinho e checkout para conectar produtos locais a clientes em Guiné-Bissau.",
	"clockright":
		"Ponto eletrônico por reconhecimento facial em quiosque, com gestão de equipe e jornada, ausências e correções, em conformidade com a LGPD.",
	"central-clube-livro":
		"Experiência editorial para um clube de leitura, com narrativas imersivas, encontros e descoberta de livros.",
	"site-adv":
		"Aplicativo de leilão ao vivo de gemas e plantas ultrarraras, com lances em tempo real e a abertura da pedra na transmissão.",
	"site-cabeleireira":
		"Vitrine digital para serviços, identidade de marca e captação de clientes em uma experiência local acolhedora.",
};

const WORLD_MAP_POINTS: ReadonlyArray<
	Readonly<{
		id: PortfolioProjectId;
		x: number;
		y: number;
	}>
> = [
	{ id: "erp-varejo", x: 35.9326, y: 61.8116 },
	{ id: "site-cabeleireira", x: 39.2981, y: 52.0733 },
];

const FORTALEZA_MAP_POSITION = { x: 39.2981, y: 52.0733 } as const;
const BRAZIL_ROUTE_HUB = FORTALEZA_MAP_POSITION;
const WORLD_JOURNEY_ORIGIN = FORTALEZA_MAP_POSITION;
const WORLD_JOURNEY_DESTINATIONS: Partial<
	Record<PortfolioProjectId, Readonly<{ x: number; y: number }>>
> = {
	"app-bank": { x: 20.7708, y: 38.5259 },
	// Bissau, na costa oeste da Guiné-Bissau.
	"guine-bissau-commerce": { x: 45.6673, y: 43.4091 },
	// Ajuste visual do atlas ilustrado: Salt Lake fica ao sudeste do Great Salt Lake.
	"clockright": { x: 19.05, y: 25.15 },
	// Coimbra (Região Centro): projeção direta de 40,2033°N 8,4103°O. A costa
	// do atlas bate com a real (~0,1°), então não precisa de ajuste.
	"central-clube-livro": { x: 47.6638, y: 27.6648 },
	// Hong Kong: a costa do atlas é simplificada e a projeção direta cai na água; ajuste visual para a ponta de Kowloon.
	"site-adv": { x: 81.7, y: 37.47 },
};
const WORLD_ASPECT_RATIO = 2;

/** Onde o projeto fica no mapa (destino no exterior ou ponto no Brasil). */
function getProjectMapPosition(
	projectId: PortfolioProjectId
): Readonly<{ x: number; y: number }> {
	return (
		WORLD_JOURNEY_DESTINATIONS[projectId] ??
		WORLD_MAP_POINTS.find((point) => point.id === projectId) ??
		FORTALEZA_MAP_POSITION
	);
}

function isSameMapPosition(
	a: Readonly<{ x: number; y: number }>,
	b: Readonly<{ x: number; y: number }>
): boolean {
	return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}

type LogoStyle = CSSProperties & { "--logo-aspect": number };

const toLogoStyle = (aspect: number): LogoStyle => ({ "--logo-aspect": aspect });

type MapPointStyle = CSSProperties & {
	"--point-x": string;
	"--point-y": string;
};

type RouteStyle = CSSProperties & {
	"--route-angle": string;
	"--route-length": string;
	"--route-x": string;
	"--route-y": string;
};

type GeographicPositionStyle = CSSProperties & {
	"--geo-x": string;
	"--geo-y": string;
};

type PortfolioRootStyle = CSSProperties & {
	"--mobile-map-zoom": string;
	"--mobile-detail-card-height": string;
	"--mobile-map-center-y": string;
	"--mobile-world-height": string;
};

function toGeographicPositionStyle(
	point: Readonly<{ x: number; y: number }>
): GeographicPositionStyle {
	return {
		"--geo-x": `${point.x}%`,
		"--geo-y": `${point.y}%`,
	};
}

function toRouteStyle(
	from: Readonly<{ x: number; y: number }>,
	to: Readonly<{ x: number; y: number }>
): RouteStyle {
	const deltaX = (to.x - from.x) / 100;
	const deltaY = (to.y - from.y) / 100;
	const normalizedVerticalDelta = deltaY / WORLD_ASPECT_RATIO;

	return {
		"--route-x": `${from.x}%`,
		"--route-y": `${from.y}%`,
		"--route-angle": `${Math.atan2(normalizedVerticalDelta, deltaX) * (180 / Math.PI)}deg`,
		"--route-length": `${Math.hypot(deltaX, normalizedVerticalDelta) * 100}%`,
	};
}

function formatCounter(index: number): string {
	return String(index + 1).padStart(2, "0");
}

export default function Portfolio() {
  useLabelLanguage();
	const location = useLocation();
	const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
	const [mobileMapZoom, setMobileMapZoom] = useState(1);
	const [mobileDetailCardHeight, setMobileDetailCardHeight] = useState(182);
	const [mobileMapAreaHeight, setMobileMapAreaHeight] = useState(320);
	const rootRef = useRef<HTMLElement>(null);
        const mobileDetailCardRef = useRef<HTMLElement>(null);
        useMobilePortfolioBrandPush(rootRef, mobileDetailCardRef);
	const projectListRef = useRef<HTMLDivElement>(null);
	const indexPanelRef = useRef<HTMLElement>(null);
	const detailCardRef = useRef<HTMLElement>(null);
	useDesktopDetailCardFit(detailCardRef, indexPanelRef);
	const mobileProjectListRef = useRef<HTMLDivElement>(null);
	const projectPointerStartRef = useRef<{
		index: number;
		x: number;
		y: number;
	} | null>(null);
	const { activeIndex, activeProject, setActiveIndex, goToPrevious, goToNext } =
		usePortfolioActiveItem({
			projects: portfolioProjects,
			defaultProjectId: defaultPortfolioProjectId,
		});
	const { activeSectionId } = useLandingSectionNavigation();
	const isPortfolioRoute = getSectionIdByPath(location.pathname) === "portfolio";
	const isPortfolioActive = activeSectionId === "portfolio" || isPortfolioRoute;
	const wasPortfolioActiveRef = useRef(false);

	// Ao chegar no Portfólio, já baixa as cenas de todos os projetos: trocar de
	// projeto não pode esperar o carregamento das imagens.
	useEffect(() => {
		if (isPortfolioActive) preloadProjectStages();
	}, [isPortfolioActive]);

	useEffect(() => {
		const card = mobileDetailCardRef.current;
		const root = rootRef.current;
		if (!card || !root) return undefined;

		const updateMobileGeometry = () => {
			const cardBox = card.getBoundingClientRect();
			const rootBox = root.getBoundingClientRect();
			if (cardBox.height > 0) {
				setMobileDetailCardHeight(Math.round(cardBox.height * 100) / 100);
			}
			if (cardBox.top > rootBox.top) {
				setMobileMapAreaHeight(
					Math.round((cardBox.top - rootBox.top) * 100) / 100
				);
			}
		};

		updateMobileGeometry();
		const observer = new ResizeObserver(updateMobileGeometry);
		observer.observe(card);
		observer.observe(root);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const hasJustEnteredPortfolio =
			isPortfolioActive && !wasPortfolioActiveRef.current;

		if (hasJustEnteredPortfolio) {
			setActiveIndex(0);
			setIsAutoplayPaused(false);
		}

		wasPortfolioActiveRef.current = isPortfolioActive;
	}, [isPortfolioActive, setActiveIndex]);

	useEffect(() => {
		if (!isPortfolioActive || isAutoplayPaused) return undefined;

		const intervalId = globalThis.setInterval(
			goToNext,
			PORTFOLIO_AUTOPLAY_INTERVAL_MS
		);

		return () => globalThis.clearInterval(intervalId);
	}, [goToNext, isAutoplayPaused, isPortfolioActive]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isPortfolioActive) return;
			// Com o print ampliado aberto, as setas não trocam de projeto.
			if (document.querySelector("[data-project-lightbox]")) return;

			const target = event.target;
			if (
				target instanceof HTMLElement &&
				(target.matches("input, textarea, select") || target.isContentEditable)
			) {
				return;
			}

			if (event.key === "ArrowLeft") {
				event.preventDefault();
				setIsAutoplayPaused(true);
				goToPrevious();
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				setIsAutoplayPaused(true);
				goToNext();
			}
		}

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [goToNext, goToPrevious, isPortfolioActive]);

	useEffect(() => {
		const projectList = mobileProjectListRef.current ?? projectListRef.current;
                if (!projectList || globalThis.innerWidth >= 992) return;

		const activeButton = projectList.querySelector<HTMLElement>(
                        '[data-mobile-project-id][aria-pressed="true"]'
		);
		if (!activeButton) return;

		const nextScrollLeft = Math.max(
			0,
                        projectList.scrollLeft + activeButton.getBoundingClientRect().left - projectList.getBoundingClientRect().left -
				(projectList.clientWidth - activeButton.offsetWidth) / 2
		);

		projectList.scrollTo({
			left: nextScrollLeft,
			behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
				.matches
				? "auto"
				: "smooth",
		});
	}, [activeIndex]);

	usePortfolioMotion(rootRef, activeProject.id);

	const activeLocation = activeProject.worldLocation;
	const worldJourneyDestination = WORLD_JOURNEY_DESTINATIONS[activeProject.id];
	// Voo de conexão: ao trocar de projeto, o avião sai de onde estava (destino
	// anterior ou ponto no Brasil), sem linha própria; a única rota desenhada é
	// Fortaleza → destino. Ajuste de estado durante o render (padrão do
	// React para estado derivado da troca de projeto).
	const [flight, setFlight] = useState<
		Readonly<{
			projectId: PortfolioProjectId;
			origin: Readonly<{ x: number; y: number }> | null;
			landed: boolean;
		}>
	>({ projectId: activeProject.id, origin: null, landed: false });
	if (flight.projectId !== activeProject.id) {
		setFlight({
			projectId: activeProject.id,
			origin: getProjectMapPosition(flight.projectId),
			landed: false,
		});
	}
	const connectionOrigin =
		flight.projectId === activeProject.id &&
		flight.origin &&
		worldJourneyDestination &&
		!isSameMapPosition(flight.origin, WORLD_JOURNEY_ORIGIN) &&
		!isSameMapPosition(flight.origin, worldJourneyDestination)
			? flight.origin
			: null;
	const transferOrigin = flight.landed ? null : connectionOrigin;
	const travelerOrigin = transferOrigin ?? WORLD_JOURNEY_ORIGIN;
	const selectProject = useCallback(
		(index: number) => {
			setActiveIndex(index);
			setIsAutoplayPaused(true);
		},
		[setActiveIndex]
	);

	// Print do projeto ampliado (celular): abre ao tocar na imagem do resumo.
	const [previewProjectId, setPreviewProjectId] =
		useState<PortfolioProjectId | null>(null);
	const previewProject = previewProjectId
		? portfolioProjects.find((project) => project.id === previewProjectId)
		: undefined;
	const openPreview = useCallback((projectId: PortfolioProjectId) => {
		setIsAutoplayPaused(true);
		setPreviewProjectId(projectId);
	}, []);
	const closePreview = useCallback(() => setPreviewProjectId(null), []);

	const handleProjectPointerDown = useCallback(
		(index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
			if (event.pointerType !== "touch") return;

			projectPointerStartRef.current = {
				index,
				x: event.clientX,
				y: event.clientY,
			};
		},
		[]
	);

	const handleProjectPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLButtonElement>) => {
			const start = projectPointerStartRef.current;
			if (!start || event.pointerType !== "touch") return;

			const moved =
				Math.abs(event.clientX - start.x) > 10 ||
				Math.abs(event.clientY - start.y) > 10;

			if (moved) {
				projectPointerStartRef.current = null;
			}
		},
		[]
	);

	const handleProjectPointerUp = useCallback(
		(index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
			const start = projectPointerStartRef.current;
			projectPointerStartRef.current = null;

			if (
				event.pointerType === "touch" &&
				start?.index === index &&
				Math.abs(event.clientX - start.x) <= 10 &&
				Math.abs(event.clientY - start.y) <= 10
			) {
				selectProject(index);
			}
		},
		[selectProject]
	);

	const previousProject = useCallback(() => {
		setIsAutoplayPaused(true);
		goToPrevious();
	}, [goToPrevious]);

	const nextProject = useCallback(() => {
		setIsAutoplayPaused(true);
		goToNext();
	}, [goToNext]);

	const portfolioRootStyle = {
		"--mobile-map-zoom": mobileMapZoom.toFixed(2),
		"--mobile-detail-card-height": `${mobileDetailCardHeight}px`,
		"--mobile-map-center-y": `${mobileMapAreaHeight / 2}px`,
		"--mobile-world-height": `${mobileMapAreaHeight * 6}px`,
	} as PortfolioRootStyle;

	return (
		<section
			ref={rootRef}
			className={styles.portfolioRoot}
			style={portfolioRootStyle}
			aria-label={localizeLabel("Portfólio")}
			data-portfolio-root="true"
			data-portfolio-active={isPortfolioActive ? "true" : "false"}
			data-portfolio-autoplay={isAutoplayPaused ? "paused" : "running"}
			data-map-view={worldJourneyDestination ? activeProject.id : "brazil"}
			onMouseEnter={() => setIsAutoplayPaused(true)}
			onMouseLeave={() => {
				if (isPortfolioActive) setIsAutoplayPaused(false);
			}}
		>
			<div className={styles.backdropViewport} aria-hidden="true">
				<div
					className={`${styles.worldSurface} ${styles.worldMapSurface}`}
					data-world-map-surface="true"
				>
					{worldAtlasTiles.map((tile, index) => (
						<img
							key={tile}
							src={tile}
							alt={localizeLabel("")}
							draggable={false}
							data-world-tile={index}
							// Os ladrilhos do mapa são o maior peso do site: não competem com a
							// foto do Início (LCP) e só baixam perto do Portfólio.
							loading="lazy"
							decoding="async"
							fetchPriority="low"
						/>
					))}
				</div>
			</div>

			<div className={styles.paperTexture} aria-hidden="true" />

			<div className={styles.geoViewport}>
				<div
					className={`${styles.worldSurface} ${styles.worldGeoSurface}`}
					data-world-geo-surface="true"
				>
					<div
						className={styles.routeNetwork}
						aria-hidden="true"
						data-mobile-route-network="true"
					>
						{WORLD_MAP_POINTS.filter(
							(point) => point.id !== "site-cabeleireira"
						).map((point) => (
							<span
								key={point.id}
								className={`${styles.routeLine} ${
									point.id === activeProject.id ? styles.routeLineActive : ""
								}`}
								style={toRouteStyle(BRAZIL_ROUTE_HUB, point)}
								data-mobile-route-base={point.id}
								data-mobile-route-active={
									point.id === activeProject.id ? point.id : undefined
								}
							/>
						))}
					</div>

					<div
						className={styles.routeHub}
						style={toGeographicPositionStyle(BRAZIL_ROUTE_HUB)}
						aria-hidden="true"
						data-mobile-route-hub="site-cabeleireira"
					>
						<span />
					</div>

					{WORLD_MAP_POINTS.map((point) => {
						const projectIndex = portfolioProjects.findIndex(
							(candidate) => candidate.id === point.id
						);
						const project = portfolioProjects[projectIndex];
						if (!project) return null;

						const isActive = point.id === activeProject.id;
						const pointStyle = {
							"--point-x": `${point.x}%`,
							"--point-y": `${point.y}%`,
						} as MapPointStyle;

						return (
							<button
								key={point.id}
								type="button"
								className={`${styles.mapPoint} ${
									isActive ? styles.mapPointActive : ""
								}`}
								style={pointStyle}
								aria-label={localizeLabel(`Selecionar ${project.name}`)}
								aria-pressed={isActive}
								onClick={() => selectProject(projectIndex)}
								data-mobile-route-node={point.id}
								data-mobile-map-marker={isActive ? "true" : undefined}
							>
								<span className={styles.mapPointDot} />
								{isActive ? (
									<span className={styles.mapPointLabel}>
										<strong>
											{localizeLabel(project.worldLocation?.city ?? project.name)}
										</strong>
										<small>{localizeLabel(project.name)}</small>
									</span>
								) : null}
							</button>
						);
					})}
					{worldJourneyDestination ? (
						<div
							className={styles.worldJourney}
							key={`fortaleza-${activeProject.id}`}
							data-world-journey={activeProject.id}
						>
							<span
								className={styles.journeyRoute}
								style={toRouteStyle(
									WORLD_JOURNEY_ORIGIN,
									worldJourneyDestination
								)}
								aria-hidden="true"
								data-world-journey-route={activeProject.id}
								// Em voo de conexão a rota de Fortaleza desenha mais devagar,
								// esperando o avião. Fica fixo até a próxima troca para não
								// mudar a duração no meio da animação.
								data-world-journey-route-pace={
									connectionOrigin ? "connection" : "direct"
								}
							/>
							<span
								className={styles.journeyTraveler}
								style={toRouteStyle(travelerOrigin, worldJourneyDestination)}
								aria-hidden="true"
								data-world-journey-traveler={activeProject.id}
								data-world-journey-from={transferOrigin ? "previous" : "fortaleza"}
							>
								<span
									data-world-journey-traveler-dot="true"
									onAnimationEnd={(event) => {
										// Pousou: o avião some (sem voltas em loop) e o voo
										// de conexão termina.
										if (
											event.target === event.currentTarget &&
											event.animationName.includes("journeyTravelerMove")
										) {
											setFlight((current) =>
												current.landed ? current : { ...current, landed: true }
											);
										}
									}}
								>
									<span className={styles.journeyPlane}>
										<img
											className={styles.journeyPlaneShadow}
											src={journeyPlane}
											alt=""
											draggable={false}
										/>
										<img
											className={styles.journeyPlaneBody}
											src={journeyPlane}
											alt=""
											draggable={false}
											data-world-journey-plane="true"
										/>
									</span>
								</span>
							</span>

							<span
								className={`${styles.journeyMarker} ${styles.journeyOrigin}`}
								style={toGeographicPositionStyle(WORLD_JOURNEY_ORIGIN)}
								aria-label={localizeLabel("Origem: Fortaleza, Brasil")}
								data-world-journey-origin="fortaleza"
							>
								<span className={styles.journeyMarkerDot} />
								<span className={styles.journeyMarkerLabel}>
									<strong>{localizeLabel("Fortaleza")}</strong>
									<small>{localizeLabel("BRASIL · ORIGEM")}</small>
								</span>
							</span>

							<button
								type="button"
								className={`${styles.journeyMarker} ${styles.journeyDestination}`}
								style={toGeographicPositionStyle(worldJourneyDestination)}
								aria-label={localizeLabel(`Destino atual: ${activeLocation?.city === activeLocation?.country ? activeLocation?.city : `${activeLocation?.city}, ${activeLocation?.country}`}`)}
								aria-pressed="true"
								onClick={() => setIsAutoplayPaused(true)}
								data-world-journey-destination={activeProject.id}
							>
								<span className={styles.journeyMarkerDot} />
								<span className={styles.journeyMarkerLabel}>
									<strong>{localizeLabel(activeLocation?.city)}</strong>
									<small>{localizeLabel(activeProject.name)} {localizeLabel(" · DESTINO")}</small>
								</span>
							</button>
						</div>
					) : null}
				</div>
			</div>

			<div className={styles.mobilePortfolio} data-mobile-portfolio="true">
				<div className={styles.mobileLocation} data-mobile-location="true">
					<strong>{localizeLabel(activeLocation?.country ?? "Brasil")}</strong>
					{activeLocation?.city === activeLocation?.country ? null : <span>{localizeLabel(activeLocation?.city ?? "Fortaleza")}</span>}
					<small>{localizeLabel(activeLocation?.region)}</small>
				</div>

				<div
					className={styles.mobileMapControls}
					data-mobile-map-controls="true"
					aria-label={localizeLabel("Controles do mapa")}
				>
					<button
						type="button"
						aria-label={localizeLabel("Centralizar mapa")}
						onClick={() => setMobileMapZoom(1)}
					>
						◆
					</button>
					<button
						type="button"
						aria-label={localizeLabel("Aumentar mapa")}
						onClick={() =>
							setMobileMapZoom((current) => Math.min(1.16, current + 0.08))
						}
					>
						+
					</button>
					<button
						type="button"
						aria-label={localizeLabel("Diminuir mapa")}
						onClick={() =>
							setMobileMapZoom((current) => Math.max(0.92, current - 0.08))
						}
					>
						−
					</button>
				</div>

				<article
					ref={mobileDetailCardRef}
					className={styles.mobileDetailCard}
					data-mobile-detail-card="true"
					aria-live="polite"
				>
					<span className={styles.mobileCardHandle} aria-hidden="true" />

					<div
						className={styles.mobileFeatureDetails}
						data-mobile-feature-details="true"
					>
						<div
							className={styles.mobileFeatureCopy}
							data-mobile-feature-copy="true"
						>
                                                        <h2>{localizeLabel(activeProject.name)}</h2>
							<p>{localizeLabel(activeProject.subtitle)}</p>
						</div>

						<MobileProjectMeta year={activeProject.year} technologies={activeProject.technologies} />
						<button
							type="button"
							className={styles.mobileNextProject}
							aria-label={localizeLabel("Próximo projeto")}
							onClick={nextProject}
						>
							›
						</button>

                                        </div>

					<div
						className={styles.mobileProjectPreview}
						data-mobile-project-preview="true"
					>
						<button
							type="button"
							className={styles.mobileProjectPreviewButton}
							aria-label={localizeLabel("Ampliar imagem do projeto")}
							aria-haspopup="dialog"
							data-mobile-project-preview-open="true"
							onClick={() => openPreview(activeProject.id)}
						>
							<img
								key={activeProject.id}
								// Peça marcada: fica escondida até o agente trazê-la, sem piscar no lugar antes.
								data-agent-piece=""
								src={activeProject.mobileImageSrc ?? activeProject.imageSrc}
								alt={localizeLabel(activeProject.imageAlt)}
								draggable={false}
							/>
						</button>
						{activeProject.siteUrl ? (
							<a
								className={styles.mobileProjectSiteLink}
								href={activeProject.siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={toSiteLinkLabel(
									localizeLabel(activeProject.name),
									activeProject.siteUrl
								)}
								data-project-site-link={activeProject.id}
							>
								<ProjectSiteBadge variant="mobile" />
							</a>
						) : null}
					</div>
					{previewProject ? (
						<ProjectImageLightbox
							projectName={localizeLabel(previewProject.name)}
							imageSrc={previewProject.imageSrc}
							imageAlt={localizeLabel(previewProject.imageAlt)}
							onClose={closePreview}
						/>
					) : null}

                                        <h3 className={styles.mobileProjectsHeading}>{localizeLabel("Todos os projetos")}</h3>
                                        <div className={styles.mobileProjectsRow}>
						<div
							ref={mobileProjectListRef}
							className={styles.mobileProjectList}
							data-mobile-project-list="true"
						>
							{portfolioProjects.map((project, index) => {
								const isActive = index === activeIndex;
								return (
									<button
										key={project.id}
										type="button"
										className={`${styles.mobileProjectButton} ${
											isActive ? styles.mobileProjectButtonActive : ""
										}`}
										aria-label={localizeLabel(`Selecionar ${project.name}`)}
										aria-pressed={isActive}
										data-mobile-project-id={project.id}
										onClick={() => selectProject(index)}
										onPointerDown={(event) =>
											handleProjectPointerDown(index, event)
										}
										onPointerMove={handleProjectPointerMove}
										onPointerUp={(event) =>
											handleProjectPointerUp(index, event)
										}
										onPointerCancel={() => {
											projectPointerStartRef.current = null;
										}}
									>
										<img
											src={project.logoSrc}
											alt={localizeLabel("")}
											aria-hidden="true"
											style={toLogoStyle(project.logoAspect)}
										/>
										<span>{localizeLabel(project.name)}</span>
									</button>
								);
							})}
						</div>

					</div>
				</article>
			</div>

			<div className={styles.atlasFrame}>
				<aside ref={indexPanelRef} className={styles.indexPanel} aria-label={localizeLabel("Índice de projetos")}>
					<div ref={projectListRef} className={styles.projectList}>
						{portfolioProjects.map((project, index) => {
							const isActive = index === activeIndex;
							const country = project.worldLocation?.country;
							const countryFlagSrc = country
								? COUNTRY_FLAGS[country]
								: undefined;

							return (
								<button
									key={project.id}
									type="button"
									className={`${styles.projectButton} ${
										isActive ? styles.projectButtonActive : ""
									}`}
									aria-pressed={isActive}
									onClick={() => selectProject(index)}
									onPointerDown={(event) =>
										handleProjectPointerDown(index, event)
									}
									onPointerMove={handleProjectPointerMove}
									onPointerUp={(event) => handleProjectPointerUp(index, event)}
									onPointerCancel={() => {
										projectPointerStartRef.current = null;
									}}
									data-project-id={project.id}
								>
									<span className={styles.projectOrdinal}>
										{localizeLabel(formatCounter(index))}
									</span>
									<img
										className={styles.projectLogo}
										style={toLogoStyle(project.logoAspect)}
										src={project.logoSrc}
										alt={localizeLabel("")}
										aria-hidden="true"
									/>
									<span className={styles.projectButtonCopy}>
										<strong>{localizeLabel(project.name)}</strong>
										<small>{localizeLabel(project.subtitle)}</small>
									</span>
									{country && countryFlagSrc ? (
										<span
											className={styles.projectCountryBadge}
											role="img"
											aria-label={localizeLabel(`País do projeto: ${country}`)}
											title={localizeLabel(country)}
										>
											<img src={countryFlagSrc} alt={localizeLabel("")} aria-hidden="true" />
										</span>
									) : null}
								</button>
							);
						})}
					</div>
				</aside>

				<div className={styles.mapPanel} aria-label={localizeLabel("Mapa dos projetos")}>
					<nav className={styles.atlasPager} aria-label={localizeLabel("Paginação de projetos")}>
						<button
							type="button"
							onClick={previousProject}
							aria-label={localizeLabel("Projeto anterior")}
						>
							←
						</button>
						<button
							type="button"
							onClick={nextProject}
							aria-label={localizeLabel("Próximo projeto")}
						>
							→
						</button>
					</nav>
				</div>

				{/* Com painel em camadas (ProjectStage), o card antigo só guarda o
				    lugar na grade; o Rag Everything continua com o card. */}
				<article
					ref={detailCardRef}
					className={styles.detailCard}
					aria-live="polite"
					data-stage={hasProjectStage(activeProject.id) ? "on" : undefined}
				>
					<header className={styles.locationHeader}>
						<strong>{localizeLabel(activeLocation?.country ?? "Brasil")}</strong>
						<span>
							{localizeLabel(activeLocation?.city ?? "Fortaleza")}{activeLocation?.region ? ` · ${localizeLabel(activeLocation.region)}` : null}
						</span>
					</header>

					<div className={styles.projectPreview}>
						<img
							key={activeProject.id}
							src={activeProject.imageSrc}
							alt={localizeLabel(activeProject.imageAlt)}
							draggable={false}
						/>
						<span className={styles.previewYear}>{localizeLabel(activeProject.year)}</span>
						{/* Projeto no ar: a foto inteira abre o site em nova aba. */}
						{activeProject.siteUrl ? (
							<a
								className={styles.projectSiteLink}
								href={activeProject.siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={toSiteLinkLabel(
									localizeLabel(activeProject.name),
									activeProject.siteUrl
								)}
								data-project-site-link={activeProject.id}
							>
								<ProjectSiteBadge variant="desktop" />
							</a>
						) : null}
					</div>

					<div className={styles.detailBody}>
						<div className={styles.detailTitleRow}>
							<div className={styles.detailTitleCopy}>
								<h2>{localizeLabel(activeProject.name)}</h2>
								<p>{localizeLabel(PROJECT_DESCRIPTIONS[activeProject.id])}</p>
							</div>
							<span className={styles.detailLogo}>
								<img
									src={activeProject.logoSrc}
									alt={localizeLabel(activeProject.logoAlt)}
									style={toLogoStyle(activeProject.logoAspect)}
								/>
							</span>
						</div>

						<div className={styles.detailMeta}>
							<span>{localizeLabel(activeProject.year)}</span>
							<span>{localizeLabel(activeProject.subtitle)}</span>
						</div>

						<div className={styles.technologyList} aria-label={localizeLabel("Tecnologias")}>
							{activeProject.technologies.map((technology) => (
								<span key={technology}>{localizeLabel(technology)}</span>
							))}
						</div>
					</div>
				</article>
			</div>

			<ProjectStage project={activeProject} />
		</section>
	);
}
