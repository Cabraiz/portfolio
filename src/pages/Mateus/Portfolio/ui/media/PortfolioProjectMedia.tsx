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

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function resolveObjectPosition(project: PortfolioProject): string {
  const media = project.media;

  if (media?.position && media.position.trim().length > 0) {
    return media.position;
  }

  const fallbackX = media?.focalPointX ?? "center";
  const fallbackY = media?.focalPointY ?? "center";

  return `${fallbackX} ${fallbackY}`;
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

  const style = useMemo(
    () =>
      ({
        "--portfolio-project-media-aspect-ratio": resolveAspectRatio(project),
        "--portfolio-project-image-fit": resolveObjectFit(project),
        "--portfolio-project-image-position": resolveObjectPosition(project),
      }) as CSSProperties,
    [project],
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
      data-media-fit={resolveObjectFit(project)}
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
