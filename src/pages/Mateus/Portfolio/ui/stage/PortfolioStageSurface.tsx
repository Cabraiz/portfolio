import { memo, type ReactNode } from "react";

import type { PortfolioProject } from "../../types";
import styles from "./PortfolioStageSurface.module.css";

type PortfolioStageSurfaceProps = Readonly<{
  project: PortfolioProject;
  children: ReactNode;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioStageSurfaceComponent({
  project,
  children,
  className,
  onPrevious,
  onNext,
  onHoverStart,
  onHoverEnd,
  previousAriaLabel = "Ver projeto anterior",
  nextAriaLabel = "Ver próximo projeto",
}: PortfolioStageSurfaceProps) {
  const hasPreviousAction = typeof onPrevious === "function";
  const hasNextAction = typeof onNext === "function";

  return (
    <article
      className={joinClasses(styles.portfolioStageSurface, className)}
      data-portfolio-stage-surface="true"
      data-project-id={project.id}
      aria-label={`Projeto em destaque: ${project.name}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      <div
        className={styles.portfolioStageSurfaceMedia}
        data-portfolio-stage-surface-media="true"
      >
        {children}
      </div>

      <div
        className={styles.portfolioStageSurfaceOverlay}
        aria-hidden="true"
      />

      {hasPreviousAction ? (
        <button
          type="button"
          className={joinClasses(
            styles.portfolioStageSurfaceHitZone,
            styles.portfolioStageSurfaceHitZonePrevious,
          )}
          onClick={onPrevious}
          aria-label={previousAriaLabel}
        >
          <span className={styles.portfolioStageSurfaceControl}>
            <span
              className={styles.portfolioStageSurfaceControlIcon}
              aria-hidden="true"
            >
              ←
            </span>
            <span className={styles.portfolioStageSurfaceControlLabel}>
              Anterior
            </span>
          </span>
        </button>
      ) : null}

      {hasNextAction ? (
        <button
          type="button"
          className={joinClasses(
            styles.portfolioStageSurfaceHitZone,
            styles.portfolioStageSurfaceHitZoneNext,
          )}
          onClick={onNext}
          aria-label={nextAriaLabel}
        >
          <span className={styles.portfolioStageSurfaceControl}>
            <span className={styles.portfolioStageSurfaceControlLabel}>
              Próximo
            </span>
            <span
              className={styles.portfolioStageSurfaceControlIcon}
              aria-hidden="true"
            >
              →
            </span>
          </span>
        </button>
      ) : null}
    </article>
  );
}

const PortfolioStageSurface = memo(PortfolioStageSurfaceComponent);

PortfolioStageSurface.displayName = "PortfolioStageSurface";

export default PortfolioStageSurface;
