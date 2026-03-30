import { memo } from "react";

import type { PortfolioProject } from "../types";
import PortfolioProjectMedia from "../ui/media/PortfolioProjectMedia";
import PortfolioStageSurface from "../ui/stage/PortfolioStageSurface";
import styles from "../ui/card/PortfolioProjectCard.module.css";

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
  const hasLogo =
    typeof project.logoSrc === "string" && project.logoSrc.trim().length > 0;

  return (
    <PortfolioStageSurface
      project={project}
      className={joinClasses(styles.portfolioProjectCard, className)}
      onPrevious={onPrevious}
      onNext={onNext}
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

      <div className={styles.portfolioProjectCardOverlay}>
        <div className={styles.portfolioProjectCardBottomRow}>
          <div className={styles.portfolioProjectCardIdentity}>
            {hasLogo ? (
              <div className={styles.portfolioProjectCardLogoBox}>
                <img
                  src={project.logoSrc}
                  alt={project.logoAlt ?? `Logo do projeto ${project.name}`}
                  className={styles.portfolioProjectCardLogo}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            ) : null}

            <div className={styles.portfolioProjectCardTextGroup}>
              <h3 className={styles.portfolioProjectCardTitle}>
                {project.name}
              </h3>

              <p className={styles.portfolioProjectCardMeta}>
                Projeto em destaque
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortfolioStageSurface>
  );
}

const PortfolioProjectCard = memo(PortfolioProjectCardComponent);

PortfolioProjectCard.displayName = "PortfolioProjectCard";

export default PortfolioProjectCard;
