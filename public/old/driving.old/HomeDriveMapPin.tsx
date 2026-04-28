import type { CSSProperties } from "react";

import styles from "./HomeDriveMapPin.module.css";

export type HomeDriveMapPinTone = "default" | "active" | "near";

export type HomeDriveMapPinProps = Readonly<{
  title: string;
  subtitle?: string;
  scale: number;
  opacity: number;
  translateY: number;
  blur: number;
  zIndex: number;
  tone?: HomeDriveMapPinTone;
  className?: string;
}>;

type MapPinCssVars = CSSProperties &
  Readonly<{
    "--home-drive-map-pin-scale": number;
    "--home-drive-map-pin-opacity": number;
    "--home-drive-map-pin-y": string;
    "--home-drive-map-pin-blur": string;
    "--home-drive-map-pin-z": number;
  }>;

function buildClassName(
  tone: HomeDriveMapPinTone,
  className?: string,
): string {
  return [
    styles.root,
    tone === "active" ? styles.rootActive : "",
    tone === "near" ? styles.rootNear : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function HomeDriveMapPin({
  title,
  subtitle,
  scale,
  opacity,
  translateY,
  blur,
  zIndex,
  tone = "default",
  className,
}: HomeDriveMapPinProps) {
  const style: MapPinCssVars = {
    "--home-drive-map-pin-scale": scale,
    "--home-drive-map-pin-opacity": opacity,
    "--home-drive-map-pin-y": `${translateY}px`,
    "--home-drive-map-pin-blur": `${blur}px`,
    "--home-drive-map-pin-z": zIndex,
  };

  return (
    <div
      className={buildClassName(tone, className)}
      data-home-drive-map-pin="true"
      style={style}
    >
      <div className={styles.pinShadow} />

      <div className={styles.pinIcon} aria-hidden="true">
        <div className={styles.pinInner} />
      </div>

      <div className={styles.pinStem} />

      <div className={styles.label}>
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </div>
  );
}
