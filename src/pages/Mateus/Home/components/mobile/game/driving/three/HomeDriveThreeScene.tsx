// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.tsx

import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  type ColorRepresentation,
  type Fog as ThreeFog,
  type Scene,
} from "three";

import {
  createInitialHomeDriveCrosswalkState,
  type HomeDriveCrosswalkRuntimeState,
} from "../domain/crosswalks";
import { createInitialHomeDriveTrafficState } from "../domain/homeDrive.traffic";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import {
  createInitialHomeDriveParkedVehicleState,
  type HomeDriveParkedVehicleRuntimeState,
} from "../domain/parkedVehicles";
import {
  createInitialHomeDrivePedestrianState,
  type HomeDrivePedestrianRuntimeState,
} from "../domain/pedestrians";
import {
  getHomeDrivePedestrianPerformanceProfile,
  type HomeDrivePedestrianPerformanceProfile,
} from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
import HomeDriveThreeBoundaryMountains from "./HomeDriveThreeBoundaryMountains";
import HomeDriveThreeBuildings from "./HomeDriveThreeBuildings";
import HomeDriveThreeBuildingSigns from "./HomeDriveThreeBuildingSigns";
import HomeDriveThreeCameraRig from "./HomeDriveThreeCameraRig";
import { HomeDriveThreeCrosswalks } from "./crosswalks";
import HomeDriveThreeGround from "./HomeDriveThreeGround";
import { HomeDriveThreeParkedVehicles } from "./parkedVehicles";
import { HomeDriveThreePedestrians } from "./pedestrians";
import HomeDriveThreeRoadNetwork from "./HomeDriveThreeRoadNetwork";
import HomeDriveThreeSimulation from "./HomeDriveThreeSimulation";
import HomeDriveThreeTraffic from "./HomeDriveThreeTraffic";
import HomeDriveThreeWorldObjects from "./HomeDriveThreeWorldObjects";
import { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials";
import styles from "./HomeDriveThreeScene.module.css";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeSceneProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  viewport: HomeDriveViewportMetrics;
  publishRuntimeSnapshot?: () => void;
}>;

type HomeDriveThreeWorldProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  pedestrianPerformance: HomeDrivePedestrianPerformanceProfile;
  publishRuntimeSnapshot?: () => void;
}>;

const INITIAL_CAMERA_HEIGHT_METERS = 2.65;
const INITIAL_CAMERA_FOV = 66;
const INITIAL_CAMERA_NEAR = 0.1;
const INITIAL_CAMERA_FAR = 4200;

const THREE_CLOCK_DEPRECATION_WARNING =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

let previousConsoleWarn: typeof console.warn | null = null;
let clockWarningFilterInstallCount = 0;

function shouldSuppressThreeClockWarning(args: readonly unknown[]): boolean {
  return args.some((arg) => {
    return (
      typeof arg === "string" &&
      arg.includes(THREE_CLOCK_DEPRECATION_WARNING)
    );
  });
}

function installThreeClockDeprecationWarningFilter(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (typeof console === "undefined" || typeof console.warn !== "function") {
    return () => {};
  }

  clockWarningFilterInstallCount += 1;

  if (clockWarningFilterInstallCount === 1) {
    previousConsoleWarn = console.warn;

    console.warn = (...args: unknown[]) => {
      if (shouldSuppressThreeClockWarning(args)) {
        return;
      }

      previousConsoleWarn?.apply(console, args);
    };
  }

  return () => {
    clockWarningFilterInstallCount = Math.max(
      0,
      clockWarningFilterInstallCount - 1,
    );

    if (clockWarningFilterInstallCount > 0) {
      return;
    }

    if (previousConsoleWarn) {
      console.warn = previousConsoleWarn;
      previousConsoleWarn = null;
    }
  };
}

function toThreeColor(color: ColorRepresentation): Color {
  return new Color(color);
}

function applySceneBackgroundAndFog(
  scene: Scene,
): Readonly<{
  previousBackground: Scene["background"];
  previousFog: ThreeFog | null;
}> {
  const previousBackground = scene.background;
  const previousFog = scene.fog;

  scene.background = toThreeColor(HOME_DRIVE_THREE_COLORS.sky);
  scene.fog = new Fog(HOME_DRIVE_THREE_COLORS.fog, 520, 3200);

  return {
    previousBackground,
    previousFog,
  };
}

function createAmbientLight(): AmbientLight {
  return new AmbientLight(HOME_DRIVE_THREE_COLORS.sky, 1.55);
}

function createHemisphereLight(): HemisphereLight {
  return new HemisphereLight(
    HOME_DRIVE_THREE_COLORS.sky,
    HOME_DRIVE_THREE_COLORS.grassDark,
    1.42,
  );
}

function createDirectionalLight(): DirectionalLight {
  const light = new DirectionalLight(HOME_DRIVE_THREE_COLORS.sun, 1.82);

  light.position.set(260, 520, -320);
  light.castShadow = false;

  return light;
}

function HomeDriveThreeEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    const { previousBackground, previousFog } =
      applySceneBackgroundAndFog(scene);

    const ambientLight = createAmbientLight();
    const hemisphereLight = createHemisphereLight();
    const directionalLight = createDirectionalLight();

    scene.add(ambientLight);
    scene.add(hemisphereLight);
    scene.add(directionalLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(hemisphereLight);
      scene.remove(directionalLight);

      scene.background = previousBackground;
      scene.fog = previousFog;

      ambientLight.dispose();
      hemisphereLight.dispose();
      directionalLight.dispose();
    };
  }, [scene]);

  return null;
}

function HomeDriveThreeWorld({
  runtimeRef,
  inputRef,
  trafficRef,
  parkedVehiclesRef,
  pedestriansRef,
  crosswalksRef,
  pedestrianPerformance,
  publishRuntimeSnapshot,
}: HomeDriveThreeWorldProps) {
  return (
    <>
      <HomeDriveThreeSimulation
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        trafficRef={trafficRef}
        pedestriansRef={pedestriansRef}
        crosswalksRef={crosswalksRef}
        pedestrianPerformance={pedestrianPerformance}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
        snapshotHz={10}
      />

      <HomeDriveThreeCameraRig runtimeRef={runtimeRef} />

      <HomeDriveThreeEnvironment />

      <HomeDriveThreeGround />
      <HomeDriveThreeBoundaryMountains />
      <HomeDriveThreeRoadNetwork />

      <HomeDriveThreeCrosswalks
        crosswalksRef={crosswalksRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={760}
        maxVisibleCrosswalks={96}
        showSignals
      />

      <HomeDriveThreeParkedVehicles
        parkedVehiclesRef={parkedVehiclesRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={viewportSafeVisibleRadiusMeters(
          pedestrianPerformance.visibleRadiusMeters,
        )}
        maxVisibleVehicles={pedestrianPerformance.maxVisiblePedestrians}
      />

      <HomeDriveThreeBuildings />
      <HomeDriveThreeBuildingSigns runtimeRef={runtimeRef} />
      <HomeDriveThreeTraffic trafficRef={trafficRef} />

      <HomeDriveThreePedestrians
        pedestriansRef={pedestriansRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={pedestrianPerformance.visibleRadiusMeters}
        maxVisiblePedestrians={pedestrianPerformance.maxVisiblePedestrians}
        fullDetailRadiusMeters={pedestrianPerformance.fullDetailRadiusMeters}
        mediumDetailRadiusMeters={pedestrianPerformance.mediumDetailRadiusMeters}
        snapshotHz={pedestrianPerformance.snapshotHz}
        debug={false}
      />

      <HomeDriveThreeWorldObjects runtimeRef={runtimeRef} />
    </>
  );
}

function viewportSafeVisibleRadiusMeters(baseRadiusMeters: number): number {
  return Math.max(420, Math.min(680, baseRadiusMeters + 160));
}

export default function HomeDriveThreeScene({
  runtimeRef,
  inputRef,
  viewport,
  publishRuntimeSnapshot,
}: HomeDriveThreeSceneProps) {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    return installThreeClockDeprecationWarningFilter();
  }, []);

  const pedestrianPerformance = useMemo(() => {
    return getHomeDrivePedestrianPerformanceProfile(viewport.isPortrait);
  }, [viewport.isPortrait]);

  const trafficRef = useRef<HomeDriveTrafficRuntimeState>(
    createInitialHomeDriveTrafficState({
      maxVehicles: viewport.isPortrait ? 118 : 176,
      density: viewport.isPortrait ? 1.18 : 1.68,
    }),
  );

  const parkedVehiclesRef = useRef<HomeDriveParkedVehicleRuntimeState>(
    createInitialHomeDriveParkedVehicleState({
      maxVehicles: viewport.isPortrait ? 82 : 156,
      density: viewport.isPortrait ? 0.68 : 1,
      maxRoads: viewport.isPortrait ? 86 : 146,
      minRoadLengthMeters: 74,
      seed: 6617,
    }),
  );

  const crosswalksRef = useRef<HomeDriveCrosswalkRuntimeState>(
    createInitialHomeDriveCrosswalkState({
      maxCrosswalks: viewport.isPortrait ? 72 : 96,
      density: viewport.isPortrait ? 0.86 : 1.08,
      minRoadLengthMeters: 82,
      seed: 9841,
    }),
  );

  const initialPedestrianState = useMemo(() => {
    return createInitialHomeDrivePedestrianState({
      maxPedestrians: pedestrianPerformance.maxPedestrians,
      density: pedestrianPerformance.density,
      maxRoads: pedestrianPerformance.maxRoads,
      minRoadLengthMeters: pedestrianPerformance.minRoadLengthMeters,
      seed: 7429,
    });
  }, [pedestrianPerformance]);

  const pedestriansRef = useRef<HomeDrivePedestrianRuntimeState>(
    initialPedestrianState,
  );

  const dpr = useMemo(() => {
    return Math.min(Math.max(viewport.dpr || 1, 1), 1.25);
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
            pedestriansRef={pedestriansRef}
            crosswalksRef={crosswalksRef}
            pedestrianPerformance={pedestrianPerformance}
            publishRuntimeSnapshot={publishRuntimeSnapshot}
          />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
