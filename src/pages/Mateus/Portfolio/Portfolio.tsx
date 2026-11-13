import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation } from "react-router-dom";

import { getSectionIdByPath } from "@/features/navigation/landingSections";
import useLandingSectionNavigation from "@/features/navigation/useLandingSectionNavigation";

import usePortfolioActiveItem from "./hooks/usePortfolioActiveItem";
import useMobilePortfolioBrandPush from "./hooks/useMobilePortfolioBrandPush";
import useDesktopDetailCardFit from "./hooks/useDesktopDetailCardFit";
import usePortfolioMotion from "./hooks/usePortfolioMotion";
import useMapLabelSide from "./hooks/useMapLabelSide";
import { defaultPortfolioProjectId, portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import ProjectStage, { preloadProjectStages } from "./ProjectStage";
import type { PortfolioProjectId } from "./types";
import { worldAtlasTiles } from "./worldAtlasTiles";
import {
	PORTFOLIO_AUTOPLAY_INTERVAL_MS,
	WORLD_JOURNEY_DESTINATIONS,
	WORLD_JOURNEY_ORIGIN,
	getProjectMapPosition,
	isSameMapPosition,
} from "./Portfolio.mapData";
import type { PortfolioRootStyle } from "./Portfolio.mapData";
import {
	useMobileProjectListCentering,
	usePortfolioKeyboardNavigation,
	usePortfolioMobileGeometry,
} from "./Portfolio.effects";
import PortfolioGeoViewport from "./Portfolio.geoViewport";
import PortfolioMobile from "./Portfolio.mobile";
import PortfolioAtlasFrame from "./Portfolio.atlasFrame";

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

	usePortfolioMobileGeometry(
		mobileDetailCardRef,
		rootRef,
		setMobileDetailCardHeight,
		setMobileMapAreaHeight
	);

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

	usePortfolioKeyboardNavigation(
		isPortfolioActive,
		goToPrevious,
		goToNext,
		setIsAutoplayPaused
	);

	useMobileProjectListCentering(mobileProjectListRef, projectListRef, activeIndex);

	usePortfolioMotion(rootRef, activeProject.id);
	useMapLabelSide(rootRef, activeProject.id, mobileMapZoom);

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

			<PortfolioGeoViewport
				activeProject={activeProject}
				activeLocation={activeLocation}
				worldJourneyDestination={worldJourneyDestination}
				connectionOrigin={connectionOrigin}
				transferOrigin={transferOrigin}
				travelerOrigin={travelerOrigin}
				selectProject={selectProject}
				setIsAutoplayPaused={setIsAutoplayPaused}
				setFlight={setFlight}
			/>

			<PortfolioMobile
				activeProject={activeProject}
				activeLocation={activeLocation}
				activeIndex={activeIndex}
				setMobileMapZoom={setMobileMapZoom}
				mobileDetailCardRef={mobileDetailCardRef}
				mobileProjectListRef={mobileProjectListRef}
				nextProject={nextProject}
				openPreview={openPreview}
				previewProject={previewProject}
				closePreview={closePreview}
				selectProject={selectProject}
				handleProjectPointerDown={handleProjectPointerDown}
				handleProjectPointerMove={handleProjectPointerMove}
				handleProjectPointerUp={handleProjectPointerUp}
				projectPointerStartRef={projectPointerStartRef}
			/>

			<PortfolioAtlasFrame
				activeProject={activeProject}
				activeLocation={activeLocation}
				activeIndex={activeIndex}
				indexPanelRef={indexPanelRef}
				projectListRef={projectListRef}
				detailCardRef={detailCardRef}
				previousProject={previousProject}
				nextProject={nextProject}
				selectProject={selectProject}
				handleProjectPointerDown={handleProjectPointerDown}
				handleProjectPointerMove={handleProjectPointerMove}
				handleProjectPointerUp={handleProjectPointerUp}
				projectPointerStartRef={projectPointerStartRef}
			/>

			<ProjectStage project={activeProject} />
		</section>
	);
}
