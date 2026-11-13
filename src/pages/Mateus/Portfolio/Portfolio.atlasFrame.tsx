import { localizeLabel } from '@/i18n/labels';
import type { RefObject } from "react";

import { portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import { hasProjectStage } from "./ProjectStage";
import { ProjectSiteBadge, toSiteLinkLabel } from "./ProjectSiteLink";
import {
	COUNTRY_FLAGS,
	PROJECT_DESCRIPTIONS,
	formatCounter,
	toLogoStyle,
} from "./Portfolio.mapData";
import type { ProjectPointerProps } from "./Portfolio.mapData";
import type { PortfolioProject } from "./types";

type PortfolioAtlasFrameProps = ProjectPointerProps &
	Readonly<{
		activeProject: PortfolioProject;
		activeLocation: PortfolioProject["worldLocation"];
		activeIndex: number;
		indexPanelRef: RefObject<HTMLElement | null>;
		projectListRef: RefObject<HTMLDivElement | null>;
		detailCardRef: RefObject<HTMLElement | null>;
		previousProject: () => void;
		nextProject: () => void;
	}>;

// Desktop: índice de projetos, paginação e card de detalhes.
export default function PortfolioAtlasFrame({
	activeProject,
	activeLocation,
	activeIndex,
	indexPanelRef,
	projectListRef,
	detailCardRef,
	previousProject,
	nextProject,
	selectProject,
	handleProjectPointerDown,
	handleProjectPointerMove,
	handleProjectPointerUp,
	projectPointerStartRef,
}: PortfolioAtlasFrameProps) {
	return (
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
	);
}
