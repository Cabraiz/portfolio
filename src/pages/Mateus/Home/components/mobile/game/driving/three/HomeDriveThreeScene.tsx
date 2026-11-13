// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.tsx

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";

import type { HomeDriveBuildingCollisionRuntimeState } from "../domain/buildingCollisions";
import type { HomeDriveCrosswalkRuntimeState } from "../domain/crosswalks";
import type {
	HomeDriveRuntimeDiagnosticsSnapshot,
	HomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
import type { HomeDriveParkedVehicleRuntimeState } from "../domain/parkedVehicles";
import type { HomeDrivePedestrianRuntimeState } from "../domain/pedestrians";
import type {
	HomeDriveUrbanFixtureCollisionRuntimeState,
} from "../domain/urbanFixtures";
import type { HomeDriveBootAssets } from "../boot/homeDriveBootAssets";
import {
	INITIAL_CAMERA_FAR,
	INITIAL_CAMERA_FOV,
	INITIAL_CAMERA_HEIGHT_METERS,
	INITIAL_CAMERA_NEAR,
} from "../boot/homeDriveBootConfig";
import styles from "./HomeDriveThreeScene.module.css";
import type { HomeDriveMutableRef } from "./HomeDriveThreeScene.types";
import {
	installThreeClockDeprecationWarningFilter,
} from "./HomeDriveThreeScene.clockWarning";
import { HomeDriveThreeWorld } from "./HomeDriveThreeScene.world";

export type HomeDriveThreeSceneProps = Readonly<{
  bootAssets: HomeDriveBootAssets;
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  viewport: HomeDriveViewportMetrics;
  publishRuntimeSnapshot?: () => void;
  onDiagnosticsSnapshot?: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
  onInitialWorldReady?: () => void;
}>;

export default function HomeDriveThreeScene({
  bootAssets,
  runtimeRef,
  inputRef,
  viewport,
  publishRuntimeSnapshot,
  onDiagnosticsSnapshot,
  onInitialWorldReady,
}: HomeDriveThreeSceneProps) {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    return installThreeClockDeprecationWarningFilter();
  }, []);

  const buildings = bootAssets.buildings;
  const urbanStreetLights = bootAssets.urbanStreetLights;
  const pedestrianPerformance = bootAssets.pedestrianPerformance;

  const trafficRef = useRef<HomeDriveTrafficRuntimeState>(
    bootAssets.trafficState,
  );
  const parkedVehiclesRef = useRef<HomeDriveParkedVehicleRuntimeState>(
    bootAssets.parkedVehicleState,
  );
  const buildingCollisionsRef =
    useRef<HomeDriveBuildingCollisionRuntimeState>(
      bootAssets.buildingCollisionState,
    );
  const urbanFixtureCollisionsRef =
    useRef<HomeDriveUrbanFixtureCollisionRuntimeState>(
      bootAssets.urbanFixtureCollisionState,
    );
  const crosswalksRef = useRef<HomeDriveCrosswalkRuntimeState>(
    bootAssets.crosswalkState,
  );
  const pedestriansRef = useRef<HomeDrivePedestrianRuntimeState>(
    bootAssets.pedestriansState,
  );
  const runtimeProfilerRef = useRef<HomeDriveRuntimeProfilerState>(
    bootAssets.runtimeProfilerState,
  );

  const dpr = useMemo(() => {
    return Math.min(Math.max(viewport.dpr || 1, 1), 1.2);
  }, [viewport.dpr]);

  const initialCameraPosition = useMemo<[number, number, number]>(() => {
    const runtime = runtimeRef.current;

    return [
      runtime.car.position.x,
      INITIAL_CAMERA_HEIGHT_METERS,
      runtime.car.position.z,
    ];
  }, [runtimeRef]);

  return (
    <div className={styles.root}>
      <Canvas
        className={styles.canvas}
        dpr={dpr}
        frameloop="always"
        camera={{
          fov: INITIAL_CAMERA_FOV,
          near: INITIAL_CAMERA_NEAR,
          far: INITIAL_CAMERA_FAR,
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
        <Suspense fallback={null}>
          <HomeDriveThreeWorld
            runtimeRef={runtimeRef}
            inputRef={inputRef}
            trafficRef={trafficRef}
            parkedVehiclesRef={parkedVehiclesRef}
            urbanFixtureCollisionsRef={urbanFixtureCollisionsRef}
            urbanStreetLights={urbanStreetLights}
            buildingCollisionsRef={buildingCollisionsRef}
            buildings={buildings}
            pedestriansRef={pedestriansRef}
            crosswalksRef={crosswalksRef}
            runtimeProfilerRef={runtimeProfilerRef}
            pedestrianPerformance={pedestrianPerformance}
            isPortrait={viewport.isPortrait}
            publishRuntimeSnapshot={publishRuntimeSnapshot}
            onDiagnosticsSnapshot={onDiagnosticsSnapshot}
            onInitialWorldReady={onInitialWorldReady}
          />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}




