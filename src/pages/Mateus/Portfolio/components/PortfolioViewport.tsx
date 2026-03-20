import { memo } from "react";

import PortfolioProjectCard from "./PortfolioProjectCard";
import PortfolioProjectPlaceholder from "./PortfolioProjectPlaceholder";

import type { PortfolioProject } from "../types";
import styles from "../Portfolio.module.css";

type PortfolioViewportProps = Readonly<{
  activeProject: PortfolioProject;
  previousProject?: PortfolioProject | null;
  nextProject?: PortfolioProject | null;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioViewportComponent({
  activeProject,
  previousProject = null,
  nextProject = null,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  className,
}: PortfolioViewportProps) {
  return (
    <section
      className={joinClasses(styles.portfolioViewport, className)}
      data-portfolio-viewport="true"
      aria-label="Projeto em destaque"
    >
      <div className={styles.portfolioViewportInner}>
        <div className={styles.portfolioViewportStage}>
          <div className={styles.portfolioViewportStageFrame}>
            <PortfolioProjectCard
              key={activeProject.id}
              project={activeProject}
              className={styles.portfolioViewportActiveCard}
            />
          </div>

          <div className={styles.portfolioViewportControls}>
            <button
              type="button"
              className={joinClasses(
                styles.portfolioViewportControlButton,
                !hasPrevious && styles.portfolioViewportControlButtonDisabled,
              )}
              onClick={onPrevious}
              disabled={!hasPrevious}
              aria-label="Projeto anterior"
            >
              <span aria-hidden="true">←</span>
            </button>

            <div
              className={styles.portfolioViewportActiveMeta}
              aria-live="polite"
            >
              <span className={styles.portfolioViewportActiveYear}>
                {activeProject.year}
              </span>
              <strong className={styles.portfolioViewportActiveName}>
                {activeProject.name}
              </strong>
            </div>

            <button
              type="button"
              className={joinClasses(
                styles.portfolioViewportControlButton,
                !hasNext && styles.portfolioViewportControlButtonDisabled,
              )}
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Próximo projeto"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <aside
          className={styles.portfolioViewportSidebar}
          aria-label="Projetos próximos"
        >
          <div className={styles.portfolioViewportSidebarGroup}>
            <span className={styles.portfolioViewportSidebarLabel}>
              Anterior
            </span>

            {previousProject ? (
              <PortfolioProjectPlaceholder
                project={previousProject}
                direction="previous"
                className={styles.portfolioViewportPlaceholderCard}
              />
            ) : (
              <div
                className={joinClasses(
                  styles.portfolioViewportPlaceholderCard,
                  styles.portfolioViewportPlaceholderEmpty,
                )}
                aria-hidden="true"
              />
            )}
          </div>

          <div className={styles.portfolioViewportSidebarGroup}>
            <span className={styles.portfolioViewportSidebarLabel}>
              Próximo
            </span>

            {nextProject ? (
              <PortfolioProjectPlaceholder
                project={nextProject}
                direction="next"
                className={styles.portfolioViewportPlaceholderCard}
              />
            ) : (
              <div
                className={joinClasses(
                  styles.portfolioViewportPlaceholderCard,
                  styles.portfolioViewportPlaceholderEmpty,
                )}
                aria-hidden="true"
              />
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

const PortfolioViewport = memo(PortfolioViewportComponent);

PortfolioViewport.displayName = "PortfolioViewport";

export default PortfolioViewport;
