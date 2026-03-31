import {
  memo,
  useMemo,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react";

import type { PortfolioProject } from "../../types";
import styles from "./PortfolioProjectMedia.module.css";

type PortfolioProjectMediaProps = Readonly<{
  project: PortfolioProject;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  draggable?: boolean;
  sizes?: string;
  fallbackLabel?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}>;

const compactObjectPositionByProjectId: Partial<
  Record<PortfolioProject["id"], string>
> = {
  "erp-varejo": "center 6%",
  "app-bank": "50% 10%",
  "app-barber": "50% 8%",
  "site-adv": "50% 6%",
  "site-cabeleireira": "58% 10%",
};

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function resolveObjectPosition(project: PortfolioProject): string {
  const media = project.media;

  if (media?.position && media.position.trim().length > 0) {
    return media.position.trim();
  }

  const fallbackX = media?.focalPointX ?? "center";
  const fallbackY = media?.focalPointY ?? "top";

  return `${fallbackX} ${fallbackY}`;
}

function shiftObjectPositionTowardTop(
  position: string,
  deltaPercent: number,
): string {
  const tokens = position.trim().split(/\s+/).filter(Boolean);

  const rawX = tokens[0] ?? "center";
  const rawY = tokens[1] ?? "top";

  if (/^-?\d+(\.\d+)?%$/.test(rawY)) {
    const nextPercent = Math.max(
      0,
      Number.parseFloat(rawY.replace("%", "")) - deltaPercent,
    );

    return `${rawX} ${nextPercent}%`;
  }

  if (rawY === "center") {
    return `${rawX} 18%`;
  }

  if (rawY === "bottom") {
    return `${rawX} 30%`;
  }

  return `${rawX} 8%`;
}

function resolveCompactObjectPosition(project: PortfolioProject): string {
  const explicitCompactPosition = compactObjectPositionByProjectId[project.id];

  if (explicitCompactPosition) {
    return explicitCompactPosition;
  }

  return shiftObjectPositionTowardTop(resolveObjectPosition(project), 10);
}

function resolveObjectFit(project: PortfolioProject): string {
  return project.media?.fit ?? "cover";
}

function resolveAspectRatio(project: PortfolioProject): string {
  return project.media?.aspectRatio ?? "16 / 9";
}

function PortfolioProjectMediaComponent({
  project,
  className,
  imageClassName,
  loading = "lazy",
  decoding = "async",
  draggable = false,
  sizes = "100vw",
  fallbackLabel,
  onLoad,
  onError,
}: PortfolioProjectMediaProps) {
  const [hasError, setHasError] = useState(false);

  const objectFit = resolveObjectFit(project);
  const objectPosition = resolveObjectPosition(project);
  const compactObjectPosition = resolveCompactObjectPosition(project);
  const aspectRatio = resolveAspectRatio(project);

  const style = useMemo(
    () =>
      ({
        "--portfolio-project-media-aspect-ratio": aspectRatio,
        "--portfolio-project-image-fit": objectFit,
        "--portfolio-project-image-position": objectPosition,
        "--portfolio-project-image-position-compact": compactObjectPosition,
        "--portfolio-project-media-radius": "inherit",
      }) as CSSProperties,
    [aspectRatio, compactObjectPosition, objectFit, objectPosition],
  );

  const hasRenderableImage =
    typeof project.imageSrc === "string" &&
    project.imageSrc.trim().length > 0 &&
    !hasError;

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onError?.(event);
  };

  return (
    <div
      className={joinClasses(styles.portfolioProjectMedia, className)}
      style={style}
      data-portfolio-project-media="true"
      data-project-id={project.id}
      data-media-fit={objectFit}
      data-media-position={objectPosition}
      data-media-position-compact={compactObjectPosition}
    >
      <div className={styles.portfolioProjectMediaViewport}>
        {hasRenderableImage ? (
          <img
            className={joinClasses(
              styles.portfolioProjectMediaImage,
              imageClassName,
            )}
            src={project.imageSrc}
            alt={project.imageAlt}
            loading={loading}
            decoding={decoding}
            draggable={draggable}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <div
            className={styles.portfolioProjectMediaFallback}
            role="img"
            aria-label={fallbackLabel ?? project.imageAlt}
          >
            <div className={styles.portfolioProjectMediaFallbackInner}>
              <span className={styles.portfolioProjectMediaFallbackEyebrow}>
                Projeto
              </span>

              <strong className={styles.portfolioProjectMediaFallbackTitle}>
                {project.name}
              </strong>

              <span className={styles.portfolioProjectMediaFallbackYear}>
                {project.year}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PortfolioProjectMedia = memo(PortfolioProjectMediaComponent);

PortfolioProjectMedia.displayName = "PortfolioProjectMedia";

export default PortfolioProjectMedia;
