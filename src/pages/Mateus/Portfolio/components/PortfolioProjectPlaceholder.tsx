import { memo } from "react";

import type { PortfolioProject } from "../types";
import styles from "../Portfolio.module.css";

type PortfolioProjectPlaceholderDirection = "previous" | "next";

type PortfolioProjectPlaceholderProps = Readonly<{
  project: PortfolioProject;
  direction: PortfolioProjectPlaceholderDirection;
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function getDirectionLabel(
  direction: PortfolioProjectPlaceholderDirection
): string {
  return direction === "previous" ? "Projeto anterior" : "Próximo projeto";
}

function PortfolioProjectPlaceholderComponent({
  project,
  direction,
  className,
}: PortfolioProjectPlaceholderProps) {
  return (
    <article
      className={joinClasses(
        styles.portfolioProjectPlaceholder,
        direction === "previous" &&
          styles.portfolioProjectPlaceholderPrevious,
        direction === "next" && styles.portfolioProjectPlaceholderNext,
        className
      )}
      data-portfolio-project-placeholder="true"
      data-project-id={project.id}
      data-direction={direction}
      aria-label={`${getDirectionLabel(direction)}: ${project.name}`}
    >
      <div className={styles.portfolioProjectPlaceholderMedia}>
        <img
          src={project.imageSrc}
          alt={project.imageAlt}
          className={styles.portfolioProjectPlaceholderImage}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className={styles.portfolioProjectPlaceholderOverlay}>
        <span className={styles.portfolioProjectPlaceholderDirection}>
          {getDirectionLabel(direction)}
        </span>

        <div className={styles.portfolioProjectPlaceholderContent}>
          <div className={styles.portfolioProjectPlaceholderLogoBox}>
            <img
              src={project.logoSrc}
              alt={project.logoAlt}
              className={styles.portfolioProjectPlaceholderLogo}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>

          <div className={styles.portfolioProjectPlaceholderTextGroup}>
            <strong className={styles.portfolioProjectPlaceholderTitle}>
              {project.name}
            </strong>

            <span className={styles.portfolioProjectPlaceholderYear}>
              {project.year}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

const PortfolioProjectPlaceholder = memo(
  PortfolioProjectPlaceholderComponent
);

PortfolioProjectPlaceholder.displayName = "PortfolioProjectPlaceholder";

export default PortfolioProjectPlaceholder;
