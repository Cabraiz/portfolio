import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import {
  getHomeDriveSkyCssVars,
  getHomeDriveSkyPreset,
  type HomeDriveSkyPreset,
} from "./domain/homeDrive.skyPresets";
import styles from "./HomeDrivePixelSky.module.css";

export type HomeDrivePixelSkyProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  routeSegment: HomeDriveRouteSegment;
  environmentShift: number;
  className?: string;
}>;

type PixelSkyStyle = CSSProperties & Record<`--${string}`, string | number>;

const CLOUDS = [
  {
    id: "cloud-far-left",
    className: styles.cloudFarLeft,
  },
  {
    id: "cloud-near-left",
    className: styles.cloudNearLeft,
  },
  {
    id: "cloud-center",
    className: styles.cloudCenter,
  },
  {
    id: "cloud-far-right",
    className: styles.cloudFarRight,
  },
] as const;

const STARS = [
  { id: "star-0", className: styles.star0 },
  { id: "star-1", className: styles.star1 },
  { id: "star-2", className: styles.star2 },
  { id: "star-3", className: styles.star3 },
  { id: "star-4", className: styles.star4 },
  { id: "star-5", className: styles.star5 },
  { id: "star-6", className: styles.star6 },
  { id: "star-7", className: styles.star7 },
  { id: "star-8", className: styles.star8 },
  { id: "star-9", className: styles.star9 },
  { id: "star-10", className: styles.star10 },
  { id: "star-11", className: styles.star11 },
] as const;

function getSkyMotionVars(
  runtime: HomeDriveRuntimeState,
  environmentShift: number,
  preset: HomeDriveSkyPreset,
): PixelSkyStyle {
  const speedFactor = Math.max(0.18, Math.min(1.35, runtime.speedKmh / 92));
  const elapsed = Number.isFinite(runtime.elapsedSeconds)
    ? runtime.elapsedSeconds
    : 0;

  const safeEnvironmentShift = Number.isFinite(environmentShift)
    ? environmentShift
    : 0;

  const cloudShift = safeEnvironmentShift * 0.18 + elapsed * speedFactor * -1.25;
  const starShift = safeEnvironmentShift * 0.055 + elapsed * -0.08;
  const dustShift = safeEnvironmentShift * 0.11 + elapsed * speedFactor * -0.48;
  const sunDrop = preset.id === "sunset" ? 18 : preset.id === "night" ? 44 : 0;

  return {
    ...getHomeDriveSkyCssVars(preset),
    "--home-drive-sky-cloud-shift": `${cloudShift}px`,
    "--home-drive-sky-star-shift": `${starShift}px`,
    "--home-drive-sky-dust-shift": `${dustShift}px`,
    "--home-drive-sky-speed-factor": speedFactor,
    "--home-drive-sky-sun-drop": `${sunDrop}px`,
    "--home-drive-sky-horizon-intensity": Math.max(
      0.18,
      Math.min(0.88, routeHorizonIntensity(runtime, preset)),
    ),
  };
}

function routeHorizonIntensity(
  runtime: HomeDriveRuntimeState,
  preset: HomeDriveSkyPreset,
): number {
  const progress =
    runtime.routeProgress > 1
      ? Math.max(0, Math.min(1, runtime.routeProgress / 100))
      : Math.max(0, Math.min(1, runtime.routeProgress));

  if (preset.id === "night") {
    return 0.34 + progress * 0.18;
  }

  if (preset.id === "sunset") {
    return 0.58 + progress * 0.22;
  }

  return 0.42 + progress * 0.14;
}

function buildRootClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

export default function HomeDrivePixelSky({
  runtime,
  routeSegment,
  environmentShift,
  className,
}: HomeDrivePixelSkyProps) {
  const skyPreset = useMemo(() => {
    return getHomeDriveSkyPreset(routeSegment, runtime.routeProgress);
  }, [routeSegment, runtime.routeProgress]);

  const rootStyle = useMemo(() => {
    return getSkyMotionVars(runtime, environmentShift, skyPreset);
  }, [environmentShift, runtime, skyPreset]);

  return (
    <div
      aria-hidden="true"
      className={buildRootClassName(className)}
      data-home-drive-sky={skyPreset.id}
      style={rootStyle}
    >
      <div className={styles.gradientBands} />
      <div className={styles.horizonGlow} />
      <div className={styles.haze} />

      <div className={styles.stars}>
        {STARS.map((star) => (
          <span key={star.id} className={star.className} />
        ))}
      </div>

      <div className={styles.sun}>
        <span className={styles.sunCore} />
        <span className={styles.sunStepA} />
        <span className={styles.sunStepB} />
      </div>

      <div className={styles.moon}>
        <span className={styles.moonCore} />
        <span className={styles.moonCut} />
        <span className={styles.moonPixelA} />
        <span className={styles.moonPixelB} />
      </div>

      <div className={styles.cloudLayer}>
        {CLOUDS.map((cloud) => (
          <span key={cloud.id} className={`${styles.cloud} ${cloud.className}`} />
        ))}
      </div>

      <div className={styles.pixelDust} />
      <div className={styles.scanline} />
      <div className={styles.vignette} />
      <div className={styles.contrast} />
    </div>
  );
}
