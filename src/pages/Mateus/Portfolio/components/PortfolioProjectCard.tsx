import { memo } from "react";

import type { PortfolioProject } from "../types";
import styles from "../Portfolio.module.css";

type PortfolioProjectCardProps = Readonly<{
  project: PortfolioProject;
  className?: string;
  imageLoading?: "eager" | "lazy";
  imageDecoding?: "sync" | "async" | "auto";
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioProjectCardComponent({
  project,
  className,
  imageLoading = "eager",
  imageDecoding = "async",
}: PortfolioProjectCardProps) {
  return (
    <article
      className={joinClasses(styles.portfolioProjectCard, className)}
      data-portfolio-project-card="true"
      data-project-id={project.id}
      aria-label={`${project.projectLabel}: ${project.name}`}
    >
      <div className={styles.portfolioProjectCardMedia}>
        <img
          src={project.imageSrc}
          alt={project.imageAlt}
          className={styles.portfolioProjectCardImage}
          loading={imageLoading}
          decoding={imageDecoding}
          draggable={false}
        />
      </div>

      <div className={styles.portfolioProjectCardOverlay}>
        <div className={styles.portfolioProjectCardTopRow}>
          <span className={styles.portfolioProjectCardLabel}>
            {project.projectLabel}
          </span>

          <span className={styles.portfolioProjectCardYear}>
            {project.year}
          </span>
        </div>

        <div className={styles.portfolioProjectCardBottomRow}>
          <div className={styles.portfolioProjectCardIdentity}>
            <div className={styles.portfolioProjectCardLogoBox}>
              <img
                src={project.logoSrc}
                alt={project.logoAlt}
                className={styles.portfolioProjectCardLogo}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>

            <div className={styles.portfolioProjectCardTextGroup}>
              <h3 className={styles.portfolioProjectCardTitle}>
                {project.name}
              </h3>

              <p className={styles.portfolioProjectCardMeta}>
                Projeto selecionado do portfólio
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const PortfolioProjectCard = memo(PortfolioProjectCardComponent);

PortfolioProjectCard.displayName = "PortfolioProjectCard";

export default PortfolioProjectCard;
