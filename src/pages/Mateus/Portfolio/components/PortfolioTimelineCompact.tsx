import { memo } from "react";

import type { PortfolioProject, PortfolioProjectId } from "../types";
import styles from "./PortfolioTimelineCompact.module.css";

type PortfolioTimelineCompactProps = Readonly<{
  projects: readonly PortfolioProject[];
  activeProjectId: PortfolioProjectId;
  onSelectProject: (projectId: PortfolioProjectId) => void;
  ariaLabel?: string;
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioTimelineCompactComponent({
  projects,
  activeProjectId,
  onSelectProject,
  ariaLabel = "Selecionar projeto do portfólio",
  className,
}: PortfolioTimelineCompactProps) {
  return (
    <nav
      className={joinClasses(styles.portfolioTimelineCompact, className)}
      data-portfolio-timeline-compact="true"
      aria-label={ariaLabel}
    >
      <div className={styles.portfolioTimelineCompactHeader}>
        <span className={styles.portfolioTimelineCompactTitle}>Projetos</span>
        <span className={styles.portfolioTimelineCompactCount}>
          {String(projects.length).padStart(2, "0")}
        </span>
      </div>

      <div className={styles.portfolioTimelineCompactScroller}>
        <ul className={styles.portfolioTimelineCompactList}>
          {projects.map((project, index) => {
            const isActive = project.id === activeProjectId;

            return (
              <li
                key={project.id}
                className={styles.portfolioTimelineCompactItem}
              >
                <button
                  type="button"
                  className={joinClasses(
                    styles.portfolioTimelineCompactButton,
                    isActive && styles.portfolioTimelineCompactButtonActive,
                  )}
                  onClick={() => onSelectProject(project.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Abrir projeto ${project.name}`}
                  data-project-id={project.id}
                  data-project-active={isActive ? "true" : "false"}
                >
                  <span className={styles.portfolioTimelineCompactMetaRow}>
                    <span className={styles.portfolioTimelineCompactYear}>
                      {project.year}
                    </span>

                    <span className={styles.portfolioTimelineCompactIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>

                  <span className={styles.portfolioTimelineCompactName}>
                    {project.name}
                  </span>

                  <span className={styles.portfolioTimelineCompactStatus}>
                    <span
                      className={styles.portfolioTimelineCompactStatusDot}
                      aria-hidden="true"
                    />
                    {isActive ? "Atual" : "Selecionável"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

const PortfolioTimelineCompact = memo(PortfolioTimelineCompactComponent);

PortfolioTimelineCompact.displayName = "PortfolioTimelineCompact";

export default PortfolioTimelineCompact;
