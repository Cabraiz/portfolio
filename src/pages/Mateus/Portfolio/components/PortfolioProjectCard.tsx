import {
  memo,
  type CSSProperties,
} from "react";

import type { PortfolioProject } from "../types";
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

function resolveProjectMediaPosition(project: PortfolioProject): string | undefined {
  const media = project.media;

  if (!media) {
    return undefined;
  }

  if (typeof media.position === "string" && media.position.trim().length > 0) {
    return media.position;
  }

  const hasFocalPointX = typeof media.focalPointX !== "undefined";
  const hasFocalPointY = typeof media.focalPointY !== "undefined";

  if (!hasFocalPointX && !hasFocalPointY) {
    return undefined;
  }

  return `${media.focalPointX ?? "center"} ${media.focalPointY ?? "center"}`;
}

function buildProjectMediaStyle(project: PortfolioProject): CSSProperties {
  const media = project.media;
  const resolvedPosition = resolveProjectMediaPosition(project);

  return {
    ...(media?.aspectRatio
      ? {
          "--portfolio-stage-aspect-ratio": media.aspectRatio,
        }
      : {}),
    ...(media?.fit
      ? {
          "--portfolio-project-image-fit": media.fit,
        }
      : {}),
    ...(resolvedPosition
      ? {
          "--portfolio-project-image-position": resolvedPosition,
        }
      : {}),
  } as CSSProperties;
}

function PortfolioProjectCardComponent({
  project,
  className,
  onPrevious,
  onNext,
  onHoverStart,
  onHoverEnd,
}: PortfolioProjectCardProps) {
  const mediaStyle = buildProjectMediaStyle(project);

  const handlePreviousClick = () => {
    onPrevious?.();
  };

  const handleNextClick = () => {
    onNext?.();
  };

  const handleFocus = () => {
    onHoverStart?.();
  };

  const handleBlur = () => {
    onHoverEnd?.();
  };

  const handleMouseEnter = () => {
    onHoverStart?.();
  };

  const handleMouseLeave = () => {
    onHoverEnd?.();
  };

  return (
    <article
      className={joinClasses(styles.portfolioProjectCard, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-portfolio-project-card="true"
      data-project-id={project.id}
      style={mediaStyle}
    >
      <div className={styles.portfolioProjectCardMedia}>
        <img
          src={project.imageSrc}
          alt={project.imageAlt}
          className={styles.portfolioProjectCardImage}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>

      <button
        type="button"
        className={joinClasses(
          styles.portfolioProjectCardHitZone,
          styles.portfolioProjectCardHitZonePrevious,
        )}
        onClick={handlePreviousClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Ver projeto anterior antes de ${project.name}`}
      >
        <span
          className={styles.portfolioProjectCardHitZoneCue}
          aria-hidden="true"
        >
          <span className={styles.portfolioProjectCardHitZoneIcon}>←</span>
          <span className={styles.portfolioProjectCardHitZoneLabel}>
            Anterior
          </span>
        </span>
      </button>

      <button
        type="button"
        className={joinClasses(
          styles.portfolioProjectCardHitZone,
          styles.portfolioProjectCardHitZoneNext,
        )}
        onClick={handleNextClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Ver próximo projeto depois de ${project.name}`}
      >
        <span
          className={styles.portfolioProjectCardHitZoneCue}
          aria-hidden="true"
        >
          <span className={styles.portfolioProjectCardHitZoneLabel}>
            Próximo
          </span>
          <span className={styles.portfolioProjectCardHitZoneIcon}>→</span>
        </span>
      </button>

      <div className={styles.portfolioProjectCardOverlay}>
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
                Projeto em destaque
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
