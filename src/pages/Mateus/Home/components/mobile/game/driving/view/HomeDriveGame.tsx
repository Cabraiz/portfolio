// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveGame.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

import useHomeDriveEngineAudio from "../audio/useHomeDriveEngineAudio";
import { useHomeDriveRuntimeRefs } from "../hooks/useHomeDriveRuntimeRefs";
import { useHomeDriveSteeringWheel } from "../hooks/useHomeDriveSteeringWheel";
import { useHomeDriveViewport } from "../hooks/useHomeDriveViewport";
import HomeDriveThreeScene from "../three/HomeDriveThreeScene";
import {
  buildHomeDriveCockpitCssVariables,
  HOME_DRIVE_COCKPIT_ASSETS,
} from "./cockpit";
import HomeDriveCompass from "./HomeDriveCompass";
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
  const steeringWheel = useHomeDriveSteeringWheel();

  const {
    runtimeRef,
    inputRef,
    runtimeSnapshot,
    patchInputRef,
    publishRuntimeSnapshot,
  } = useHomeDriveRuntimeRefs();

  const closeTapRef = useRef<HiddenCloseTapState>({
    count: 0,
    lastTapAt: 0,
  });

  const engineAudio = useHomeDriveEngineAudio({
    runtimeRef,
    inputRef,
    enabled: true,
    paused: false,
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
    patchInputRef({
      steering: steeringWheel.steering,
      throttle: 1,
      brake: 0,
    });
  }, [patchInputRef, steeringWheel.steering]);

  const startEngineAudioFromGesture = useCallback(() => {
    engineAudio.startFromGesture();
  }, [engineAudio]);

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
    [engineAudio, onClose, startEngineAudioFromGesture],
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
      <HomeDriveThreeScene
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        viewport={viewport}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
      />

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

      <HomeDriveSpeedometer speedMps={runtimeSnapshot.car.speedMps} />

      <HomeDriveCompass
        className={styles.compass}
        headingRad={runtimeSnapshot.car.headingRad}
      />

      <HomeDriveSteeringWheel controller={steeringWheel} />
    </div>
  );
}
