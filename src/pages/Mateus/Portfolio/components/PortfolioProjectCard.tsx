import { memo } from "react";

import { getPortfolioTechnologyIcons } from "../portfolio.technology-icons";
import type { PortfolioProject } from "../types";
import PortfolioProjectMedia from "../ui/media/PortfolioProjectMedia";
import PortfolioStageSurface from "../ui/stage/PortfolioStageSurface";
import styles from "./PortfolioProjectCard.module.css";

type PortfolioProjectCardProps = Readonly<{
  project: PortfolioProject;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioProjectCardComponent({
  project,
  className,
  onPrevious,
  onNext,
  onHoverStart,
  onHoverEnd,
}: PortfolioProjectCardProps) {
  const hasPrevious = typeof onPrevious === "function";
  const hasNext = typeof onNext === "function";

  const technologyIcons = getPortfolioTechnologyIcons(
    project.technologies ?? [],
    5,
  );
  const hasTechnologyIcons = technologyIcons.length > 0;

  return (
    <PortfolioStageSurface
      project={project}
      className={joinClasses(styles.portfolioProjectCard, className)}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
    >
      <PortfolioProjectMedia
        project={project}
        className={styles.portfolioProjectCardMedia}
        imageClassName={styles.portfolioProjectCardImage}
        loading="eager"
        decoding="async"
        draggable={false}
      />

      <div
        className={styles.portfolioProjectCardNavigationLayer}
        aria-hidden="true"
      >
        <button
          type="button"
          className={joinClasses(
            styles.portfolioProjectCardNavZone,
            styles.portfolioProjectCardNavZonePrevious,
          )}
          onClick={onPrevious}
          disabled={!hasPrevious}
          tabIndex={-1}
          aria-label="Projeto anterior"
          data-nav-direction="previous"
        >
          <span
            className={joinClasses(
              styles.portfolioProjectCardNavPill,
              styles.portfolioProjectCardNavPillPrevious,
            )}
          >
            <span className={styles.portfolioProjectCardNavEyebrow}>
              Previous project
            </span>

            <span className={styles.portfolioProjectCardNavMain}>
              <span className={styles.portfolioProjectCardNavIcon}>←</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          className={joinClasses(
            styles.portfolioProjectCardNavZone,
            styles.portfolioProjectCardNavZoneNext,
          )}
          onClick={onNext}
          disabled={!hasNext}
          tabIndex={-1}
          aria-label="Próximo projeto"
          data-nav-direction="next"
        >
          <span
            className={joinClasses(
              styles.portfolioProjectCardNavPill,
              styles.portfolioProjectCardNavPillNext,
            )}
          >
            <span className={styles.portfolioProjectCardNavEyebrow}>
              Next project
            </span>

            <span className={styles.portfolioProjectCardNavMain}>
              <span className={styles.portfolioProjectCardNavIcon}>→</span>
            </span>
          </span>
        </button>
      </div>

      <div className={styles.portfolioProjectCardOverlay}>
        {hasTechnologyIcons ? (
          <div
            className={styles.portfolioProjectCardTechRail}
            aria-label={`Tecnologias utilizadas no projeto ${project.name}`}
          >
            <ul className={styles.portfolioProjectCardTechList}>
              {technologyIcons.map((technology) => (
                <li
                  key={`${project.id}-${technology.label}`}
                  className={styles.portfolioProjectCardTechEntry}
                >
                  <div
                    className={styles.portfolioProjectCardTechChip}
                    title={technology.label}
                    aria-label={technology.label}
                  >
                    <img
                      src={technology.src}
                      alt={technology.label}
                      className={styles.portfolioProjectCardTechIcon}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />

                    <span className={styles.portfolioProjectCardTechLabel}>
                      {technology.label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </PortfolioStageSurface>
  );
}

const PortfolioProjectCard = memo(PortfolioProjectCardComponent);

PortfolioProjectCard.displayName = "PortfolioProjectCard";

export default PortfolioProjectCard;
