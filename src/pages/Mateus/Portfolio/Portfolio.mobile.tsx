import { localizeLabel } from '@/i18n/labels';
import type { Dispatch, RefObject, SetStateAction } from "react";

import { portfolioProjects } from "./portfolio.data";
import styles from "./Portfolio.module.css";
import MobileProjectMeta from "./MobileProjectMeta";
import ProjectImageLightbox from "./ProjectImageLightbox";
import { ProjectSiteBadge, toSiteLinkLabel } from "./ProjectSiteLink";
import { toLogoStyle } from "./Portfolio.mapData";
import type { ProjectPointerProps } from "./Portfolio.mapData";
import type { PortfolioProject, PortfolioProjectId } from "./types";

type PortfolioMobileProps = ProjectPointerProps &
	Readonly<{
		activeProject: PortfolioProject;
		activeLocation: PortfolioProject["worldLocation"];
		activeIndex: number;
		setMobileMapZoom: Dispatch<SetStateAction<number>>;
		mobileDetailCardRef: RefObject<HTMLElement | null>;
		mobileProjectListRef: RefObject<HTMLDivElement | null>;
		nextProject: () => void;
		openPreview: (projectId: PortfolioProjectId) => void;
		previewProject: PortfolioProject | undefined;
		closePreview: () => void;
	}>;

// Versão de celular: local, controles do mapa e card do projeto.
export default function PortfolioMobile({
	activeProject,
	activeLocation,
	activeIndex,
	setMobileMapZoom,
	mobileDetailCardRef,
	mobileProjectListRef,
	nextProject,
	openPreview,
	previewProject,
	closePreview,
	selectProject,
	handleProjectPointerDown,
	handleProjectPointerMove,
	handleProjectPointerUp,
	projectPointerStartRef,
}: PortfolioMobileProps) {
	return (
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
	);
}
