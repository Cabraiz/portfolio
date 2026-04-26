// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.tsx

import React, { Suspense, useMemo, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";

import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
import HomeDriveThreeCameraRig from "./HomeDriveThreeCameraRig";
import HomeDriveThreeGround from "./HomeDriveThreeGround";
import HomeDriveThreeRoadNetwork from "./HomeDriveThreeRoadNetwork";
import HomeDriveThreeSimulation from "./HomeDriveThreeSimulation";
import HomeDriveThreeWorldObjects from "./HomeDriveThreeWorldObjects";
import { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials";
import styles from "./HomeDriveThreeScene.module.css";

export type HomeDriveThreeSceneProps = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
  inputRef: MutableRefObject<HomeDriveInputState>;
  viewport: HomeDriveViewportMetrics;
  publishRuntimeSnapshot?: () => void;
}>;

type HomeDriveThreeWorldProps = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
  inputRef: MutableRefObject<HomeDriveInputState>;
  publishRuntimeSnapshot?: () => void;
}>;

function HomeDriveThreeWorld({
  runtimeRef,
  inputRef,
  publishRuntimeSnapshot,
}: HomeDriveThreeWorldProps) {
  return (
    <>
      <HomeDriveThreeSimulation
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
        snapshotHz={10}
      />

      <HomeDriveThreeCameraRig runtimeRef={runtimeRef} />

      <fog attach="fog" args={[HOME_DRIVE_THREE_COLORS.fog, 260, 1650]} />

      <ambientLight intensity={1.65} />

      <hemisphereLight
        args={[
          HOME_DRIVE_THREE_COLORS.sky,
          HOME_DRIVE_THREE_COLORS.grassDark,
          1.45,
        ]}
      />

      <directionalLight position={[260, 520, -320]} intensity={1.75} />

      <HomeDriveThreeGround />
      <HomeDriveThreeRoadNetwork />
      <HomeDriveThreeWorldObjects runtimeRef={runtimeRef} />
    </>
  );
}

export default function HomeDriveThreeScene({
  runtimeRef,
  inputRef,
  viewport,
  publishRuntimeSnapshot,
}: HomeDriveThreeSceneProps) {
  const dpr = useMemo(() => {
    return Math.min(Math.max(viewport.dpr || 1, 1), 1.25);
  }, [viewport.dpr]);

  const initialCameraPosition = useMemo<[number, number, number]>(() => {
    const runtime = runtimeRef.current;

    return [runtime.car.position.x, 4.2, runtime.car.position.z];
  }, [runtimeRef]);

  return (
    <div className={styles.root}>
      <Canvas
        className={styles.canvas}
        dpr={dpr}
        frameloop="always"
        camera={{
          fov: 62,
          near: 0.1,
          far: 3600,
          position: initialCameraPosition,
        }}
        gl={{
          alpha: false,
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 220,
        }}
      >
        <color attach="background" args={[HOME_DRIVE_THREE_COLORS.sky]} />

        <Suspense fallback={null}>
          <HomeDriveThreeWorld
            runtimeRef={runtimeRef}
            inputRef={inputRef}
            publishRuntimeSnapshot={publishRuntimeSnapshot}
          />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
