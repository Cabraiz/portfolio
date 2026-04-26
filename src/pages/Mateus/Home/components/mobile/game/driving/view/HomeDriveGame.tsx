// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveGame.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

import { useHomeDriveRuntimeRefs } from "../hooks/useHomeDriveRuntimeRefs";
import { useHomeDriveSteeringWheel } from "../hooks/useHomeDriveSteeringWheel";
import { useHomeDriveViewport } from "../hooks/useHomeDriveViewport";
import HomeDriveThreeScene from "../three/HomeDriveThreeScene";
import HomeDriveCompass from "./HomeDriveCompass";
import styles from "./HomeDriveGame.module.css";
import HomeDriveSteeringWheel from "./HomeDriveSteeringWheel";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
}>;

type HiddenCloseTapState = {
  count: number;
  lastTapAt: number;
};

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

  useEffect(() => {
    patchInputRef({
      steering: steeringWheel.steering,
      throttle: 1,
      brake: 0,
    });
  }, [patchInputRef, steeringWheel.steering]);

  useEffect(() => {
    if (!onClose) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handlePointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
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

      onClose();
    },
    [onClose],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      "--home-drive-vw": `${viewport.width}px`,
      "--home-drive-vh": `${viewport.height}px`,
      "--free-drive-vw": `${viewport.width}px`,
      "--free-drive-vh": `${viewport.height}px`,
    } as CSSProperties;
  }, [viewport.height, viewport.width]);

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

      <HomeDriveCompass
        className={styles.compass}
        headingRad={runtimeSnapshot.car.headingRad}
      />

      <HomeDriveSteeringWheel controller={steeringWheel} />
    </div>
  );
}
