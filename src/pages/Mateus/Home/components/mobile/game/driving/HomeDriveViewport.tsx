import React, { useMemo, type CSSProperties } from "react";

import type {
  HomeDriveLandmark,
  HomeDriveRuntimeState,
} from "./domain/homeDrive.types";
import HomeDriveCockpit from "./HomeDriveCockpit";
import HomeDriveControls from "./HomeDriveControls";
import HomeDriveHud from "./HomeDriveHud";
import HomeDriveIntroOverlay from "./HomeDriveIntroOverlay";
import HomeDriveLandmarkLayer from "./HomeDriveLandmarkLayer";
import HomeDrivePauseOverlay from "./HomeDrivePauseOverlay";
import HomeDrivePixelSky from "./HomeDrivePixelSky";
import HomeDriveRoadside from "./HomeDriveRoadside";
import HomeDriveRoadSurface from "./HomeDriveRoadSurface";
import styles from "./HomeDriveViewport.module.css";
import useHomeDriveScene from "../../../../hooks/useHomeDriveScene";

export type HomeDriveViewportProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  landmarks: readonly HomeDriveLandmark[];
  onStart: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onClose?: () => void;
  onSteerChange: (value: number) => void;
  onThrottleChange: (active: boolean) => void;
  onBrakeChange: (active: boolean) => void;
  className?: string;
}>;

type ViewportCssVars = CSSProperties &
  Readonly<{
    "--home-drive-atmosphere-sky-glow": string;
    "--home-drive-atmosphere-haze": string;
    "--home-drive-noise-opacity": number;
  }>;

function buildViewportClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

export default function HomeDriveViewport({
  runtime,
  landmarks,
  onStart,
  onPauseToggle,
  onReset,
  onClose,
  onSteerChange,
  onThrottleChange,
  onBrakeChange,
  className,
}: HomeDriveViewportProps) {
  const scene = useHomeDriveScene({
    runtime,
    landmarks,
  });

  const shouldShowDrivingScene = runtime.phase !== "ready";

  const viewportStyle = useMemo<ViewportCssVars>(() => {
    return {
      "--home-drive-atmosphere-sky-glow": scene.scenePreset.skyGlow,
      "--home-drive-atmosphere-haze": scene.scenePreset.haze,
      "--home-drive-noise-opacity": Math.min(
        0.07,
        scene.scenePreset.ambientNoiseOpacity,
      ),
    };
  }, [
    scene.scenePreset.ambientNoiseOpacity,
    scene.scenePreset.haze,
    scene.scenePreset.skyGlow,
  ]);

  return (
    <div
      className={buildViewportClassName(className)}
      data-home-drive="viewport"
      data-home-drive-scene={scene.scenePreset.id}
      data-home-drive-phase={runtime.phase}
      style={viewportStyle}
    >
      <HomeDrivePixelSky
        runtime={runtime}
        routeSegment={scene.routeSegment}
        environmentShift={scene.environmentShift}
      />

      <div className={styles.atmosphere} />
      <div className={styles.noise} />

      {shouldShowDrivingScene ? (
        <>
          <HomeDriveRoadside
            runtime={runtime}
            routeSegment={scene.routeSegment}
          />

          <HomeDriveRoadSurface
            runtime={runtime}
            routeSegment={scene.routeSegment}
            laneMarkerTranslateY={scene.laneMarkerTranslateY}
            roadCurveState={scene.roadCurveState}
          />

          <HomeDriveLandmarkLayer
            runtime={runtime}
            visibleLandmarks={scene.visibleLandmarks}
            routeSegment={scene.routeSegment}
          />

          <div className={styles.glassVignette} />

          <HomeDriveCockpit runtime={runtime} />
        </>
      ) : null}

      <HomeDriveHud
        runtime={runtime}
        onPauseToggle={onPauseToggle}
        onReset={onReset}
        onClose={onClose}
        onStart={onStart}
      />

      {shouldShowDrivingScene ? (
        <HomeDriveControls
          runtime={runtime}
          onStart={onStart}
          onPauseToggle={onPauseToggle}
          onSteerChange={onSteerChange}
          onThrottleChange={onThrottleChange}
          onBrakeChange={onBrakeChange}
        />
      ) : null}

      <HomeDriveIntroOverlay
        runtime={runtime}
        onStart={onStart}
        onClose={onClose}
      />

      <HomeDrivePauseOverlay
        runtime={runtime}
        onResume={onPauseToggle}
        onReset={onReset}
        onClose={onClose}
      />
    </div>
  );
}
