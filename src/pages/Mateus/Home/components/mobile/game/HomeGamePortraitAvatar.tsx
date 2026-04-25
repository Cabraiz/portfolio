import React, { useMemo, type CSSProperties } from "react";

import styles from "./HomeGameStage.module.css";

type CssVars = CSSProperties &
  Readonly<Record<`--${string}`, string | number | undefined>>;

export type HomeGamePortraitAvatarProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  progress?: number;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  className?: string;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function HomeGamePortraitAvatar({
  imageSrc,
  imageAlt = "Mateus Cabral",
  progress = 0,
  imageLoaded = true,
  onImageLoad,
  className,
}: HomeGamePortraitAvatarProps) {
  const safeProgress = clamp(progress, 0, 1);

  const rootStyle = useMemo<CssVars>(() => {
    return {
      "--game-progress": safeProgress.toFixed(4),
    };
  }, [safeProgress]);

  const portraitStyle = useMemo<CSSProperties>(() => {
    return {
      opacity: imageLoaded ? 1 : 0,
      transform: imageLoaded ? "scale(1)" : "scale(1.035)",
      transition: "opacity 260ms ease, transform 420ms ease",
    };
  }, [imageLoaded]);

  const shellClassName = [styles.portraitShell, className]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={styles.coreHalo} style={rootStyle} aria-hidden="true" />
      <div className={styles.coreRing} style={rootStyle} aria-hidden="true" />
      <div
        className={styles.coreRingSecondary}
        style={rootStyle}
        aria-hidden="true"
      />
      <div
        className={styles.coreProgress}
        style={rootStyle}
        aria-hidden="true"
      />

      <div className={shellClassName}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className={styles.portrait}
          style={portraitStyle}
          loading="eager"
          decoding="async"
          draggable={false}
          onLoad={onImageLoad}
        />
        <div className={styles.portraitGlass} aria-hidden="true" />
      </div>

      <div
        className={[
          styles.completionBloom,
          safeProgress >= 1 ? styles.completionBloomActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={rootStyle}
        aria-hidden="true"
      />
    </>
  );
}
