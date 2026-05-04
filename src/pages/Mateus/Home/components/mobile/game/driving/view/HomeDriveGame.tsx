// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveGame.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import useHomeDriveEngineAudio from "../audio/useHomeDriveEngineAudio";
import useHomeDriveBootLoader from "../boot/useHomeDriveBootLoader";
import {
  createInitialHomeDriveMissionRuntimeState,
  getHomeDriveMissionDestinations,
  resolveHomeDriveMissionCompassTarget,
  tickHomeDriveMissionRuntime,
  type HomeDriveMissionRuntimeState,
} from "../domain/missions";
import type { HomeDriveRuntimeDiagnosticsSnapshot } from "../domain/diagnostics";
import { HOME_DRIVE_RUNTIME_DIAGNOSTICS_OVERLAY_ENABLED } from "../domain/homeDrive.globalDebugFlags";
import { useHomeDriveRuntimeRefs } from "../hooks/useHomeDriveRuntimeRefs";
import { useHomeDriveSteeringWheel } from "../hooks/useHomeDriveSteeringWheel";
import { useHomeDriveViewport } from "../hooks/useHomeDriveViewport";
import HomeDriveThreeScene from "../three/HomeDriveThreeScene";
import {
  buildHomeDriveCockpitCssVariables,
  HOME_DRIVE_COCKPIT_ASSETS,
} from "./cockpit";
import HomeDriveCompass from "./HomeDriveCompass";
import HomeDriveDiagnosticsOverlay from "./HomeDriveDiagnosticsOverlay";
import HomeDriveBootLoadingScreen from "./HomeDriveBootLoadingScreen";
import styles from "./HomeDriveGame.module.css";
import HomeDriveSpeedometer from "./HomeDriveSpeedometer";
import HomeDriveSteeringWheel from "./HomeDriveSteeringWheel";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
}>;

type HiddenCloseTapState = {
  count: number;
  lastTapAt: number;
};

function getEventTargetElement(
  target: EventTarget | null,
): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function isInteractiveOverlayTarget(target: EventTarget | null): boolean {
  const element = getEventTargetElement(target);

  if (!element) {
    return false;
  }

  return Boolean(element.closest("[data-home-drive-interactive='true']"));
}

export default function HomeDriveGame({ onClose }: HomeDriveGameProps) {
  const { rootRef, viewport } = useHomeDriveViewport();

  const {
    runtimeRef,
    inputRef,
    runtimeSnapshot,
    patchInputRef,
    publishRuntimeSnapshot,
  } = useHomeDriveRuntimeRefs();

  const bootLoader = useHomeDriveBootLoader({
    viewport,
    runtimeRef,
  });
  const isBootDataReady =
    bootLoader.status === "ready" && bootLoader.assets !== null;
  const [isWorldReady, setIsWorldReady] = useState(false);
  const isDriveUnlocked = isBootDataReady && isWorldReady;

  useEffect(() => {
    setIsWorldReady(false);
  }, [bootLoader.assets, bootLoader.status]);

  const handleInitialWorldReady = useCallback(() => {
    setIsWorldReady(true);
  }, []);

  const loadingSnapshot = useMemo(() => {
    if (!isBootDataReady || !bootLoader.assets || isWorldReady) {
      return bootLoader.snapshot;
    }

    return {
      ...bootLoader.snapshot,
      phase: "rendering" as const,
      label: "Renderizando cidade",
      detail: "Aguardando o primeiro frame real antes de liberar.",
      progress: Math.max(bootLoader.snapshot.progress, 99),
      loaded: 1,
      total: 1,
    };
  }, [bootLoader.assets, bootLoader.snapshot, isBootDataReady, isWorldReady]);

  const handleSteeringChange = useCallback(
    (steering: number) => {
      if (!isDriveUnlocked) {
        return;
      }

      /*
        A direção agora entra direto no inputRef.
        Isso evita render React a cada movimento do volante.
      */
      patchInputRef({
        steering,
        throttle: 1,
        brake: 0,
      });
    },
    [isDriveUnlocked, patchInputRef],
  );

  const steeringWheel = useHomeDriveSteeringWheel({
    onSteeringChange: handleSteeringChange,
  });

  const missionDestinations = useMemo(() => {
    return getHomeDriveMissionDestinations();
  }, []);

  const [missionRuntime, setMissionRuntime] =
    useState<HomeDriveMissionRuntimeState>(() =>
      createInitialHomeDriveMissionRuntimeState({
        destinations: missionDestinations,
        startedAtSeconds: runtimeRef.current.elapsedSeconds,
      }),
    );

  const shouldShowRuntimeDiagnostics =
    HOME_DRIVE_RUNTIME_DIAGNOSTICS_OVERLAY_ENABLED;
  const [runtimeDiagnosticsSnapshot, setRuntimeDiagnosticsSnapshot] =
    useState<HomeDriveRuntimeDiagnosticsSnapshot | null>(null);

  const handleRuntimeDiagnosticsSnapshot = useCallback(
    (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => {
      if (!shouldShowRuntimeDiagnostics) {
        return;
      }

      setRuntimeDiagnosticsSnapshot(snapshot);
    },
    [shouldShowRuntimeDiagnostics],
  );

  const closeTapRef = useRef<HiddenCloseTapState>({
    count: 0,
    lastTapAt: 0,
  });

  const engineAudio = useHomeDriveEngineAudio({
    runtimeRef,
    inputRef,
    enabled: isDriveUnlocked,
    paused: !isDriveUnlocked,
    muted: false,
    masterVolume: 0.92,
    updateHz: 30,
    settings: {
      masterVolume: 0.92,
      idleVolume: 0.42,
      lowVolume: 0.58,
      highVolume: 0.46,
      speedForFullBlendMps: 42,
      highLayerStartRatio: 0.46,
      throttleGain: 0.22,
      brakeDucking: 0.24,
      minPlaybackRate: 0.82,
      maxPlaybackRate: 1.44,
      fadeLerp: 0.14,
    },
  });

  useEffect(() => {
    if (!isDriveUnlocked) {
      return;
    }

    patchInputRef({
      steering: steeringWheel.steering,
      throttle: 1,
      brake: 0,
    });
  }, [isDriveUnlocked, patchInputRef, steeringWheel.steering]);

  useEffect(() => {
    if (!isDriveUnlocked) {
      return;
    }

    setMissionRuntime((currentRuntime) => {
      const result = tickHomeDriveMissionRuntime({
        runtime: currentRuntime,
        carPosition: runtimeSnapshot.car.position,
        elapsedSeconds: runtimeSnapshot.elapsedSeconds,
        destinations: missionDestinations,
      });

      return result.runtime;
    });
  }, [
    isDriveUnlocked,
    missionDestinations,
    runtimeSnapshot.car.position.x,
    runtimeSnapshot.car.position.z,
    runtimeSnapshot.elapsedSeconds,
  ]);

  const missionCompassTarget = useMemo(() => {
    return resolveHomeDriveMissionCompassTarget({
      runtime: missionRuntime,
      carPosition: runtimeSnapshot.car.position,
      carHeadingRad: runtimeSnapshot.car.headingRad,
      destinations: missionDestinations,
    });
  }, [
    missionDestinations,
    missionRuntime,
    runtimeSnapshot.car.headingRad,
    runtimeSnapshot.car.position,
  ]);

  const startEngineAudioFromGesture = useCallback(() => {
    if (!isDriveUnlocked) {
      return;
    }

    engineAudio.startFromGesture();
  }, [engineAudio, isDriveUnlocked]);

  useEffect(() => {
    if (!onClose) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      engineAudio.stop();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [engineAudio, onClose]);

  const handlePointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isInteractiveOverlayTarget(event.target)) {
        return;
      }

      if (!isDriveUnlocked) {
        return;
      }

      startEngineAudioFromGesture();

      if (!onClose) {
        return;
      }

      const isHiddenCloseZone = event.clientX <= 76 && event.clientY <= 76;

      if (!isHiddenCloseZone) {
        return;
      }

      const now = performance.now();
      const previous = closeTapRef.current;
      const count = now - previous.lastTapAt <= 620 ? previous.count + 1 : 1;

      closeTapRef.current = {
        count,
        lastTapAt: now,
      };

      if (count < 2) {
        return;
      }

      closeTapRef.current = {
        count: 0,
        lastTapAt: 0,
      };

      engineAudio.stop();
      onClose();
    },
    [engineAudio, isDriveUnlocked, onClose, startEngineAudioFromGesture],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      "--home-drive-vw": `${viewport.width}px`,
      "--home-drive-vh": `${viewport.height}px`,
      "--free-drive-vw": `${viewport.width}px`,
      "--free-drive-vh": `${viewport.height}px`,
      ...buildHomeDriveCockpitCssVariables({
        steering: steeringWheel.steering,
      }),
    } as CSSProperties;
  }, [steeringWheel.steering, viewport.height, viewport.width]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={rootStyle}
      onPointerDownCapture={handlePointerDownCapture}
    >
      {isBootDataReady && bootLoader.assets ? (
        <HomeDriveThreeScene
          bootAssets={bootLoader.assets}
          runtimeRef={runtimeRef}
          inputRef={inputRef}
          viewport={viewport}
          publishRuntimeSnapshot={publishRuntimeSnapshot}
          onDiagnosticsSnapshot={
            shouldShowRuntimeDiagnostics
              ? handleRuntimeDiagnosticsSnapshot
              : undefined
          }
          onInitialWorldReady={handleInitialWorldReady}
        />
      ) : null}

      {isDriveUnlocked ? (
        <>
          {shouldShowRuntimeDiagnostics ? (
            <HomeDriveDiagnosticsOverlay snapshot={runtimeDiagnosticsSnapshot} />
          ) : null}

          <div className={styles.cockpitLayer} aria-hidden="true">
            <img
              className={styles.cockpitImage}
              src={HOME_DRIVE_COCKPIT_ASSETS.cockpitSrc}
              alt=""
              draggable={false}
            />
            <span className={styles.cockpitShade} />
            <span className={styles.cockpitGlass} />
          </div>

          <HomeDriveSpeedometer
            speedMps={runtimeSnapshot.car.speedMps}
            impact={runtimeSnapshot.impact}
          />

          <HomeDriveCompass
            className={styles.compass}
            headingRad={runtimeSnapshot.car.headingRad}
            target={missionCompassTarget}
          />

          <HomeDriveSteeringWheel controller={steeringWheel} />
        </>
      ) : null}

      {!isDriveUnlocked ? (
        <HomeDriveBootLoadingScreen
          snapshot={loadingSnapshot}
          onRetry={bootLoader.retry}
        />
      ) : null}
    </div>
  );
}

