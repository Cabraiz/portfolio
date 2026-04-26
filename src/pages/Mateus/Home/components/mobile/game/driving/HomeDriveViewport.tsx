import React, { useMemo, useRef, type CSSProperties } from "react";

import type {
  HomeDriveLandmark,
  HomeDriveRuntimeState,
} from "./domain/homeDrive.types";
import HomeDriveCockpit from "./HomeDriveCockpit";
import HomeDriveControls from "./HomeDriveControls";
import HomeDriveDebugOverlay from "./HomeDriveDebugOverlay";
import HomeDriveHud from "./HomeDriveHud";
import HomeDriveIntroOverlay from "./HomeDriveIntroOverlay";
import HomeDriveLandmarkLayer from "./HomeDriveLandmarkLayer";
import HomeDrivePauseOverlay from "./HomeDrivePauseOverlay";
import HomeDrivePixelSky from "./HomeDrivePixelSky";
import HomeDriveRoadside from "./HomeDriveRoadside";
import HomeDriveRoadSurface from "./HomeDriveRoadSurface";
import styles from "./HomeDriveViewport.module.css";
import useHomeDriveViewportProfile, {
  type HomeDriveViewportCssVars,
} from "../../../../hooks/useHomeDriveViewportProfile";
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
  HomeDriveViewportCssVars &
  Readonly<{
    "--home-drive-atmosphere-sky-glow": string;
    "--home-drive-atmosphere-haze": string;
    "--home-drive-noise-opacity": number;
  }>;

function buildViewportClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

function toCssPx(value: number): string {
  if (!Number.isFinite(value)) {
    return "0px";
  }

  return `${Math.round(value)}px`;
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
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const scene = useHomeDriveScene({
    runtime,
    landmarks,
  });

  const viewportProfile = useHomeDriveViewportProfile({
    stageRef: viewportRef,
  });

  const shouldShowDrivingScene = runtime.phase !== "ready";

  const viewportStyle = useMemo<ViewportCssVars>(() => {
    const { values } = viewportProfile;

    return {
      /*
        Primeiro espalha tudo que vem do hook.
      */
      ...viewportProfile.cssVars,

      /*
        Depois força explicitamente as variáveis críticas.
        Isso garante que cockpit, volante e velocímetro recebam
        valores mesmo se alguma versão do hook/cssVars estiver defasada.
      */
      "--home-drive-camera-width-px": toCssPx(values.viewportWidth),
      "--home-drive-camera-height-px": toCssPx(values.viewportHeight),
      "--home-drive-visual-width-px": toCssPx(values.visualWidth),
      "--home-drive-visual-height-px": toCssPx(values.visualHeight),
      "--home-drive-stage-width-px": toCssPx(values.stageWidth),
      "--home-drive-stage-height-px": toCssPx(values.stageHeight),

      "--home-drive-bottom-safe-zone": toCssPx(values.bottomSafeZonePx),
      "--home-drive-system-bottom-inset": toCssPx(values.systemBottomInsetPx),

      "--home-drive-cockpit-width": toCssPx(values.cockpitWidthPx),
      "--home-drive-cockpit-height": toCssPx(values.cockpitHeightPx),
      "--home-drive-cockpit-bottom": toCssPx(values.cockpitBottomPx),

      "--home-drive-steering-width": toCssPx(values.steeringWidthPx),
      "--home-drive-steering-bottom": toCssPx(values.steeringBottomPx),

      "--home-drive-speedometer-size": toCssPx(values.speedometerSizePx),
      "--home-drive-speedometer-x": toCssPx(values.speedometerXpx),
      "--home-drive-speedometer-y": toCssPx(values.speedometerYpx),

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
    viewportProfile,
  ]);

  return (
    <div
      ref={viewportRef}
      className={buildViewportClassName(className)}
      data-home-drive="viewport"
      data-home-drive-scene={scene.scenePreset.id}
      data-home-drive-phase={runtime.phase}
      data-home-drive-camera-kind={viewportProfile.flags.kind}
      data-home-drive-camera-short={
        viewportProfile.flags.isShort ? "true" : "false"
      }
      data-home-drive-camera-narrow={
        viewportProfile.flags.isNarrow ? "true" : "false"
      }
      data-home-drive-camera-tall={
        viewportProfile.flags.isTall ? "true" : "false"
      }
      data-home-drive-bottom-inset-risk={
        viewportProfile.flags.hasSystemBottomInsetRisk ? "true" : "false"
      }
      data-home-drive-stage-width={viewportProfile.values.stageWidth}
      data-home-drive-stage-height={viewportProfile.values.stageHeight}
      data-home-drive-speedometer-x={viewportProfile.values.speedometerXpx}
      data-home-drive-speedometer-y={viewportProfile.values.speedometerYpx}
      data-home-drive-speedometer-size={
        viewportProfile.values.speedometerSizePx
      }
      data-home-drive-cockpit-width={viewportProfile.values.cockpitWidthPx}
      data-home-drive-cockpit-height={viewportProfile.values.cockpitHeightPx}
      data-home-drive-cockpit-bottom={viewportProfile.values.cockpitBottomPx}
      data-home-drive-steering-width={viewportProfile.values.steeringWidthPx}
      data-home-drive-steering-bottom={viewportProfile.values.steeringBottomPx}
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

      <HomeDriveDebugOverlay profile={viewportProfile} />
    </div>
  );
}
