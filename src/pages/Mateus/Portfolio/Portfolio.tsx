import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "react-router-dom";

import useLandingSectionNavigation from "@/features/navigation/useLandingSectionNavigation";

import flagBrazil from "../../../assets/Mateus/portfolio/flags/brasil-semicircle-realistic-v4.png";
import flagUnitedStates from "../../../assets/Mateus/portfolio/flags/estados-unidos-semicircle-realistic-v3.png";
import flagGuineaBissau from "../../../assets/Mateus/portfolio/flags/guine-bissau-semicircle-realistic-v3.png";
import flagMexico from "../../../assets/Mateus/portfolio/flags/mexico-semicircle-realistic-v3.png";
import flagPortugal from "../../../assets/Mateus/portfolio/flags/portugal-semicircle-realistic-v3.png";

import usePortfolioActiveItem from "./hooks/usePortfolioActiveItem";
import { defaultPortfolioProjectId, portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import type { PortfolioProjectId } from "./types";
import { worldAtlasTiles } from "./worldAtlasTiles";

const PORTFOLIO_AUTOPLAY_INTERVAL_MS = 6200;
const PORTFOLIO_MAGNET_IDLE_MS = 120;
const PORTFOLIO_MAGNET_DURATION_SECONDS = 0.62;
const PORTFOLIO_MAGNET_ENTRY_RATIO = 0.1;

const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
	Brasil: flagBrazil,
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
	"app-barber":
		"Agenda digital com recorrência, organização de serviços e uma jornada direta para clientes e profissionais.",
	"central-clube-livro":
		"Experiência editorial para um clube de leitura, com narrativas imersivas, encontros e descoberta de livros.",
	"site-adv":
		"Presença institucional elegante, com conteúdo jurídico acessível e canais de contato fáceis de encontrar.",
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
	{ id: "site-adv", x: 36.6992, y: 58.7744 },
	{ id: "site-cabeleireira", x: 39.2981, y: 52.0733 },
];

const MOBILE_BRAZIL_ROUTE_POINTS: ReadonlyArray<
	Readonly<{
		id: (typeof WORLD_MAP_POINTS)[number]["id"];
		x: number;
		y: number;
	}>
> = [
	{ id: "erp-varejo", x: 14, y: 84 },
	{ id: "site-adv", x: 23, y: 60 },
	{ id: "site-cabeleireira", x: 66, y: 24 },
];

const MOBILE_BRAZIL_ROUTE_HUB = MOBILE_BRAZIL_ROUTE_POINTS[2];

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
	"app-barber": { x: 19.05, y: 25.15 },
	// Ajuste visual do atlas ilustrado: Lisboa fica na costa oeste de Portugal.
	"central-clube-livro": { x: 48.05, y: 28.4876 },
};
const WORLD_ASPECT_RATIO = 2;

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
};

type MobileRoutePointStyle = CSSProperties & {
	"--mobile-route-x": string;
	"--mobile-route-y": string;
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
	const location = useLocation();
	const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
	const [mobileMapZoom, setMobileMapZoom] = useState(1);
	const rootRef = useRef<HTMLElement>(null);
	const isMagnetizingRef = useRef(false);
	const projectListRef = useRef<HTMLDivElement>(null);
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
	const { activeSectionId, navigateToSection } = useLandingSectionNavigation();
	const isPortfolioRoute = location.pathname === "/portfolio";
	const isPortfolioActive = activeSectionId === "portfolio" || isPortfolioRoute;
	const wasPortfolioActiveRef = useRef(false);

	useEffect(() => {
		const root = rootRef.current;
		const prefersReducedMotion = globalThis.matchMedia(
			"(prefers-reduced-motion: reduce)"
		);

		if (!root || globalThis.innerWidth <= 980 || prefersReducedMotion.matches) {
			return undefined;
		}

		let idleTimerId: number | undefined;
		let releaseTimerId: number | undefined;
		let previousScrollY = globalThis.scrollY;
		let isScrollingDown = false;

		const releaseMagnet = () => {
			isMagnetizingRef.current = false;
		};

		const magnetizePortfolio = () => {
			idleTimerId = undefined;

			if (
				isMagnetizingRef.current ||
				!isScrollingDown ||
				globalThis.innerWidth <= 980 ||
				prefersReducedMotion.matches
			) {
				return;
			}

			const rect = root.getBoundingClientRect();
			const navbarHeight =
				Number.parseFloat(
					getComputedStyle(root).getPropertyValue("--app-navbar-height")
				) || 70;
			const visibleHeight = Math.max(
				0,
				Math.min(rect.bottom, globalThis.innerHeight) -
					Math.max(rect.top, navbarHeight)
			);
			const visibleRatio = visibleHeight / Math.max(globalThis.innerHeight, 1);
			const isEnteringFromHome = rect.top > navbarHeight + 4;

			if (!isEnteringFromHome || visibleRatio < PORTFOLIO_MAGNET_ENTRY_RATIO) {
				return;
			}

			isMagnetizingRef.current = true;
			navigateToSection("portfolio", {
				offsetPx: navbarHeight,
				duration: PORTFOLIO_MAGNET_DURATION_SECONDS,
				replace: true,
				syncUrl: true,
			});

			globalThis.clearTimeout(releaseTimerId);
			releaseTimerId = globalThis.window.setTimeout(
				releaseMagnet,
				PORTFOLIO_MAGNET_DURATION_SECONDS * 1000 + 180
			);
		};

		const scheduleMagnet = () => {
			const nextScrollY = globalThis.scrollY;
			isScrollingDown = nextScrollY > previousScrollY;
			previousScrollY = nextScrollY;

			if (isMagnetizingRef.current) return;

			globalThis.clearTimeout(idleTimerId);
			idleTimerId = globalThis.window.setTimeout(
				magnetizePortfolio,
				PORTFOLIO_MAGNET_IDLE_MS
			);
		};

		globalThis.addEventListener("scroll", scheduleMagnet, { passive: true });

		return () => {
			globalThis.removeEventListener("scroll", scheduleMagnet);
			globalThis.clearTimeout(idleTimerId);
			globalThis.clearTimeout(releaseTimerId);
			isMagnetizingRef.current = false;
		};
	}, [navigateToSection]);

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
		if (!projectList || globalThis.innerWidth > 720) return;

		const activeButton = projectList.querySelector<HTMLElement>(
			'[data-project-id][aria-pressed="true"]'
		);
		if (!activeButton) return;

		const nextScrollLeft = Math.max(
			0,
			activeButton.offsetLeft -
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

	const activeLocation = activeProject.worldLocation;
	const worldJourneyDestination = WORLD_JOURNEY_DESTINATIONS[activeProject.id];
	const mobileBrazilRoutePoint = MOBILE_BRAZIL_ROUTE_POINTS.find(
		(point) => point.id === activeProject.id
	);

	const selectProject = useCallback(
		(index: number) => {
			setActiveIndex(index);
			setIsAutoplayPaused(true);
		},
		[setActiveIndex]
	);

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
	} as PortfolioRootStyle;

	return (
		<section
			ref={rootRef}
			className={styles.portfolioRoot}
			style={portfolioRootStyle}
			aria-label="Portfólio"
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
							alt=""
							draggable={false}
							data-world-tile={index}
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
					<div className={styles.routeNetwork} aria-hidden="true">
						{WORLD_MAP_POINTS.filter(
							(point) => point.id !== "site-cabeleireira"
						).map((point) => (
							<span
								key={point.id}
								className={`${styles.routeLine} ${
									point.id === activeProject.id ? styles.routeLineActive : ""
								}`}
								style={toRouteStyle(BRAZIL_ROUTE_HUB, point)}
							/>
						))}
					</div>

					<div
						className={styles.routeHub}
						style={toGeographicPositionStyle(BRAZIL_ROUTE_HUB)}
						aria-hidden="true"
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
								aria-label={`Selecionar ${project.name}`}
								aria-pressed={isActive}
								onClick={() => selectProject(projectIndex)}
							>
								<span className={styles.mapPointDot} />
								{isActive ? (
									<span className={styles.mapPointLabel}>
										<strong>
											{project.worldLocation?.city ?? project.name}
										</strong>
										<small>{project.name}</small>
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
							/>
							<span
								className={styles.journeyTraveler}
								style={toRouteStyle(
									WORLD_JOURNEY_ORIGIN,
									worldJourneyDestination
								)}
								aria-hidden="true"
								data-world-journey-traveler={activeProject.id}
							>
								<span data-world-journey-traveler-dot="true" />
							</span>

							<span
								className={`${styles.journeyMarker} ${styles.journeyOrigin}`}
								style={toGeographicPositionStyle(WORLD_JOURNEY_ORIGIN)}
								aria-label="Origem: Fortaleza, Brasil"
								data-world-journey-origin="fortaleza"
							>
								<span className={styles.journeyMarkerDot} />
								<span className={styles.journeyMarkerLabel}>
									<strong>Fortaleza</strong>
									<small>BRASIL · ORIGEM</small>
								</span>
							</span>

							<button
								type="button"
								className={`${styles.journeyMarker} ${styles.journeyDestination}`}
								style={toGeographicPositionStyle(worldJourneyDestination)}
								aria-label={`Destino atual: ${activeLocation?.city}, ${activeLocation?.country}`}
								aria-pressed="true"
								onClick={() => setIsAutoplayPaused(true)}
								data-world-journey-destination={activeProject.id}
							>
								<span className={styles.journeyMarkerDot} />
								<span className={styles.journeyMarkerLabel}>
									<strong>{activeLocation?.city}</strong>
									<small>{activeProject.name} · DESTINO</small>
								</span>
							</button>
						</div>
					) : null}
				</div>
			</div>

			<div className={styles.mobilePortfolio} data-mobile-portfolio="true">
				<div className={styles.mobileLocation} data-mobile-location="true">
					<strong>{activeLocation?.country ?? "Brasil"}</strong>
					<span>{activeLocation?.city ?? "Fortaleza"}</span>
					<small>{activeLocation?.region}</small>
				</div>

				{mobileBrazilRoutePoint ? (
					<div
						className={styles.mobileBrazilRouteNetwork}
						data-mobile-route-network="true"
						aria-hidden="true"
					>
						<svg
							className={styles.mobileRouteCanvas}
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
						>
							<defs>
								<mask
									id={`mobile-route-reveal-${activeProject.id}`}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="100"
									height="100"
								>
									<line
										key={`mobile-route-mask-${activeProject.id}`}
										className={styles.mobileRouteRevealMask}
										x1={MOBILE_BRAZIL_ROUTE_HUB.x}
										y1={MOBILE_BRAZIL_ROUTE_HUB.y}
										x2={mobileBrazilRoutePoint.x}
										y2={mobileBrazilRoutePoint.y}
										pathLength="1"
										data-mobile-route-reveal={activeProject.id}
									/>
								</mask>
							</defs>

							{MOBILE_BRAZIL_ROUTE_POINTS.filter(
								(point) => point.id !== MOBILE_BRAZIL_ROUTE_HUB.id
							).map((point) => (
								<line
									key={`mobile-route-base-${point.id}`}
									className={styles.mobileRouteBase}
									x1={MOBILE_BRAZIL_ROUTE_HUB.x}
									y1={MOBILE_BRAZIL_ROUTE_HUB.y}
									x2={point.x}
									y2={point.y}
									pathLength="100"
									data-mobile-route-base={point.id}
								/>
							))}

							{mobileBrazilRoutePoint.id !== MOBILE_BRAZIL_ROUTE_HUB.id ? (
								<line
									key={`mobile-route-active-${activeProject.id}`}
									className={styles.mobileRouteActive}
									x1={MOBILE_BRAZIL_ROUTE_HUB.x}
									y1={MOBILE_BRAZIL_ROUTE_HUB.y}
									x2={mobileBrazilRoutePoint.x}
									y2={mobileBrazilRoutePoint.y}
									pathLength="100"
									mask={`url(#mobile-route-reveal-${activeProject.id})`}
									data-mobile-map-route="true"
									data-mobile-route-active={activeProject.id}
								/>
							) : null}
						</svg>

						{MOBILE_BRAZIL_ROUTE_POINTS.map((point) => {
							const project = portfolioProjects.find(
								(candidate) => candidate.id === point.id
							);
							const isActive = point.id === activeProject.id;
							const isHub = point.id === MOBILE_BRAZIL_ROUTE_HUB.id;
							const pointStyle = {
								"--mobile-route-x": `${point.x}%`,
								"--mobile-route-y": `${point.y}%`,
							} as MobileRoutePointStyle;

							return (
								<span
									key={`mobile-route-node-${point.id}`}
									className={`${styles.mobileRouteNode} ${
										isHub ? styles.mobileRouteHub : ""
									} ${isActive ? styles.mobileRouteNodeActive : ""}`}
									style={pointStyle}
									data-mobile-route-node={point.id}
									data-mobile-map-marker={isActive ? "true" : undefined}
									data-mobile-route-project={isActive ? point.id : undefined}
								>
									<span className={styles.mobileRouteNodeDot} />
									{isActive ? (
										<span className={styles.mobileRouteNodeLabel}>
											<strong>{activeLocation?.city ?? activeProject.name}</strong>
											<small>{project?.name ?? activeProject.name}</small>
										</span>
									) : null}
								</span>
							);
						})}
					</div>
				) : null}

				<div
					className={styles.mobileMapControls}
					data-mobile-map-controls="true"
					aria-label="Controles do mapa"
				>
					<button
						type="button"
						aria-label="Centralizar mapa"
						onClick={() => setMobileMapZoom(1)}
					>
						◆
					</button>
					<button
						type="button"
						aria-label="Aumentar mapa"
						onClick={() =>
							setMobileMapZoom((current) => Math.min(1.16, current + 0.08))
						}
					>
						+
					</button>
					<button
						type="button"
						aria-label="Diminuir mapa"
						onClick={() =>
							setMobileMapZoom((current) => Math.max(0.92, current - 0.08))
						}
					>
						−
					</button>
				</div>

				<article
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
							<small>{activeProject.projectLabel}</small>
							<h2>{activeProject.name}</h2>
							<p>{activeProject.subtitle}</p>
						</div>

						<div className={styles.mobileMeta} data-mobile-meta="true">
							<span>{activeProject.year}</span>
							<span>{activeProject.subtitle}</span>
						</div>

						<div
							className={styles.mobileTechnologies}
							data-mobile-technologies="true"
							aria-label="Tecnologias"
						>
							{activeProject.technologies.map((technology) => (
								<span key={technology}>{technology}</span>
							))}
						</div>

						<h3>Todos os projetos</h3>
					</div>

					<div
						className={styles.mobileProjectPreview}
						data-mobile-project-preview="true"
					>
						<img
							key={activeProject.id}
							src={activeProject.imageSrc}
							alt={activeProject.imageAlt}
							draggable={false}
						/>
					</div>

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
										aria-label={`Selecionar ${project.name}`}
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
										<img src={project.logoSrc} alt="" aria-hidden="true" />
										<span>{project.name}</span>
									</button>
								);
							})}
						</div>

						<button
							type="button"
							className={styles.mobileNextProject}
							aria-label="Próximo projeto"
							onClick={nextProject}
						>
							›
						</button>
					</div>
				</article>
			</div>

			<div className={styles.atlasFrame}>
				<aside className={styles.indexPanel} aria-label="Índice de projetos">
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
										{formatCounter(index)}
									</span>
									<img
										className={styles.projectLogo}
										src={project.logoSrc}
										alt=""
										aria-hidden="true"
									/>
									<span className={styles.projectButtonCopy}>
										<strong>{project.name}</strong>
										<small>{project.subtitle}</small>
									</span>
									{country && countryFlagSrc ? (
										<span
											className={styles.projectCountryBadge}
											role="img"
											aria-label={`País do projeto: ${country}`}
											title={country}
										>
											<img src={countryFlagSrc} alt="" aria-hidden="true" />
										</span>
									) : null}
								</button>
							);
						})}
					</div>
				</aside>

				<div className={styles.mapPanel} aria-label="Mapa dos projetos">
					<nav className={styles.atlasPager} aria-label="Paginação de projetos">
						<button
							type="button"
							onClick={previousProject}
							aria-label="Projeto anterior"
						>
							←
						</button>
						<button
							type="button"
							onClick={nextProject}
							aria-label="Próximo projeto"
						>
							→
						</button>
					</nav>
				</div>

				<article className={styles.detailCard} aria-live="polite">
					<header className={styles.locationHeader}>
						<strong>{activeLocation?.country ?? "Brasil"}</strong>
						<span>
							{activeLocation?.city ?? "Fortaleza"} · {activeLocation?.region}
						</span>
					</header>

					<div className={styles.projectPreview}>
						<img
							key={activeProject.id}
							src={activeProject.imageSrc}
							alt={activeProject.imageAlt}
							draggable={false}
						/>
						<span className={styles.previewYear}>{activeProject.year}</span>
					</div>

					<div className={styles.detailBody}>
						<div className={styles.detailTitleRow}>
							<div className={styles.detailTitleCopy}>
								<h2>{activeProject.name}</h2>
								<p>{PROJECT_DESCRIPTIONS[activeProject.id]}</p>
							</div>
							<img src={activeProject.logoSrc} alt={activeProject.logoAlt} />
						</div>

						<div className={styles.detailMeta}>
							<span>{activeProject.year}</span>
							<span>{activeProject.subtitle}</span>
						</div>

						<div className={styles.technologyList} aria-label="Tecnologias">
							{activeProject.technologies.map((technology) => (
								<span key={technology}>{technology}</span>
							))}
						</div>
					</div>
				</article>
			</div>
		</section>
	);
}
