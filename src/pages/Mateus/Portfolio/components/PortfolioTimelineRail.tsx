import { memo } from "react";

import type { PortfolioProjectListItem, PortfolioProjectId } from "../types";
import styles from "../Portfolio.module.css";

type PortfolioTimelineRailProps = Readonly<{
  projects: readonly PortfolioProjectListItem[];
  activeProjectId: PortfolioProjectId;
  onSelectProject: (projectId: PortfolioProjectId) => void;
  className?: string;
  ariaLabel?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioTimelineRailComponent({
  projects,
  activeProjectId,
  onSelectProject,
  className,
  ariaLabel = "Navegação dos projetos do portfólio",
}: PortfolioTimelineRailProps) {
  return (
    <aside
      className={joinClasses(styles.portfolioTimelineRail, className)}
      data-portfolio-timeline="true"
      aria-label={ariaLabel}
    >
      <div className={styles.portfolioTimelineRailInner}>
        <div
          className={styles.portfolioTimelineRailLine}
          aria-hidden="true"
        />

        <ul className={styles.portfolioTimelineList}>
          {projects.map((project, index) => {
            const isActive = project.id === activeProjectId;

            return (
              <li
                key={project.id}
                className={joinClasses(
                  styles.portfolioTimelineItem,
                  isActive && styles.portfolioTimelineItemActive,
                )}
              >
                <button
                  type="button"
                  className={joinClasses(
                    styles.portfolioTimelineButton,
                    isActive && styles.portfolioTimelineButtonActive,
                  )}
                  onClick={() => onSelectProject(project.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Abrir projeto ${project.name}`}
                  data-project-id={project.id}
                  data-project-active={isActive ? "true" : "false"}
                >
                  <span
                    className={joinClasses(
                      styles.portfolioTimelineMarker,
                      isActive && styles.portfolioTimelineMarkerActive,
                    )}
                    aria-hidden="true"
                  />

                  <span className={styles.portfolioTimelineContent}>
                    <span className={styles.portfolioTimelineMetaRow}>
                      <span className={styles.portfolioTimelineYear}>
                        {project.year}
                      </span>

                      <span className={styles.portfolioTimelineIndex}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </span>

                    <span className={styles.portfolioTimelineProjectName}>
                      {project.name}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

const PortfolioTimelineRail = memo(PortfolioTimelineRailComponent);

PortfolioTimelineRail.displayName = "PortfolioTimelineRail";

export default PortfolioTimelineRail;
