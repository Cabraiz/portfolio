import { localizeLabel } from '@/i18n/labels';
import type { Dispatch, SetStateAction } from "react";

// Avião da rota: "Jet Airplane" (CC0, https://opengameart.org/content/jet-airplane),
// pintado nas cores do site e renderizado de cima no Blender.
import journeyPlane from "../../../assets/Mateus/portfolio/journey-plane-v2.webp";

import { portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import {
	BRAZIL_ROUTE_HUB,
	WORLD_JOURNEY_ORIGIN,
	WORLD_MAP_POINTS,
	toGeographicPositionStyle,
	toRouteStyle,
} from "./Portfolio.mapData";
import type { JourneyFlight, MapPointStyle } from "./Portfolio.mapData";
import type { PortfolioProject } from "./types";

type PortfolioGeoViewportProps = Readonly<{
	activeProject: PortfolioProject;
	activeLocation: PortfolioProject["worldLocation"];
	worldJourneyDestination: Readonly<{ x: number; y: number }> | undefined;
	connectionOrigin: Readonly<{ x: number; y: number }> | null;
	transferOrigin: Readonly<{ x: number; y: number }> | null;
	travelerOrigin: Readonly<{ x: number; y: number }>;
	selectProject: (index: number) => void;
	setIsAutoplayPaused: Dispatch<SetStateAction<boolean>>;
	setFlight: Dispatch<SetStateAction<JourneyFlight>>;
}>;

// Mapa geográfico: rotas do Brasil, pontos dos projetos e a viagem pelo mundo.
export default function PortfolioGeoViewport({
	activeProject,
	activeLocation,
	worldJourneyDestination,
	connectionOrigin,
	transferOrigin,
	travelerOrigin,
	selectProject,
	setIsAutoplayPaused,
	setFlight,
}: PortfolioGeoViewportProps) {
	return (
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
							// O avião já voa sozinho: nenhum agente o arrasta.
							data-agent-skip=""
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
	);
}
