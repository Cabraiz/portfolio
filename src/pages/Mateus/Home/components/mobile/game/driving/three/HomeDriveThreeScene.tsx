// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.tsx

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  type ColorRepresentation,
  type Scene,
} from "three";

import {
  createInitialHomeDriveBuildingCollisionState,
  type HomeDriveBuildingCollisionRuntimeState,
} from "../domain/buildingCollisions";
import {
  createInitialHomeDriveCrosswalkState,
  type HomeDriveCrosswalkRuntimeState,
} from "../domain/crosswalks";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import { createInitialHomeDriveTrafficState } from "../domain/homeDrive.traffic";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
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
import {
  getHomeDriveDamagedBuildingIdsFromCollisionState,
  HomeDriveThreeBuildingCollisionMarks,
  HomeDriveThreeBuildingRubble,
  HomeDriveThreeDamagedBuildings,
} from "./buildingCollisions";
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
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  buildings: readonly HomeDriveBuilding[];
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  pedestrianPerformance: HomeDrivePedestrianPerformanceProfile;
  isPortrait: boolean;
  publishRuntimeSnapshot?: () => void;
}>;

const INITIAL_CAMERA_HEIGHT_METERS = 2.65;
const INITIAL_CAMERA_FOV = 66;
const INITIAL_CAMERA_NEAR = 0.1;
const INITIAL_CAMERA_FAR = 4200;

const TRAFFIC_MAX_VEHICLES_PORTRAIT = 472;
const TRAFFIC_MAX_VEHICLES_LANDSCAPE = 704;
const TRAFFIC_DENSITY_PORTRAIT = 3.4;
const TRAFFIC_DENSITY_LANDSCAPE = 4;
const TRAFFIC_MIN_ROAD_LENGTH_METERS = 64;

const PARKED_MAX_VEHICLES_PORTRAIT = 126;
const PARKED_MAX_VEHICLES_LANDSCAPE = 220;
const PARKED_DENSITY_PORTRAIT = 0.92;
const PARKED_DENSITY_LANDSCAPE = 1.24;
const PARKED_MAX_ROADS_PORTRAIT = 96;
const PARKED_MAX_ROADS_LANDSCAPE = 172;
const PARKED_MIN_ROAD_LENGTH_METERS = 68;

const PARKED_VISIBLE_RADIUS_PORTRAIT = 540;
const PARKED_VISIBLE_RADIUS_LANDSCAPE = 660;
const PARKED_MAX_VISIBLE_PORTRAIT = 96;
const PARKED_MAX_VISIBLE_LANDSCAPE = 148;

const BUILDING_COLLISION_MARK_VISIBLE_RADIUS_PORTRAIT = 430;
const BUILDING_COLLISION_MARK_VISIBLE_RADIUS_LANDSCAPE = 620;
const BUILDING_COLLISION_MARK_MAX_VISIBLE_PORTRAIT = 64;
const BUILDING_COLLISION_MARK_MAX_VISIBLE_LANDSCAPE = 112;

const DAMAGED_BUILDINGS_VISIBLE_RADIUS_PORTRAIT = 560;
const DAMAGED_BUILDINGS_VISIBLE_RADIUS_LANDSCAPE = 820;
const DAMAGED_BUILDINGS_MAX_VISIBLE_PORTRAIT = 24;
const DAMAGED_BUILDINGS_MAX_VISIBLE_LANDSCAPE = 42;

const BUILDING_RUBBLE_VISIBLE_RADIUS_PORTRAIT = 560;
const BUILDING_RUBBLE_VISIBLE_RADIUS_LANDSCAPE = 860;
const BUILDING_RUBBLE_MAX_VISIBLE_PORTRAIT = 420;
const BUILDING_RUBBLE_MAX_VISIBLE_LANDSCAPE = 900;

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
  previousFog: Scene["fog"];
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

function getSortedStringArray(values: readonly string[]): readonly string[] {
  return [...values].sort((first, second) => first.localeCompare(second));
}

function areStringArraysEqual(
  first: readonly string[],
  second: readonly string[],
): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
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
  buildingCollisionsRef,
  buildings,
  pedestriansRef,
  crosswalksRef,
  pedestrianPerformance,
  isPortrait,
  publishRuntimeSnapshot,
}: HomeDriveThreeWorldProps) {
  const [damagedBuildingIds, setDamagedBuildingIds] = useState<
    readonly string[]
  >(() =>
    getSortedStringArray(
      getHomeDriveDamagedBuildingIdsFromCollisionState(
        buildingCollisionsRef.current,
      ),
    ),
  );
  const damagedBuildingIdsAccumulatorRef = useRef(0);
  const lastDamagedBuildingSerialRef = useRef<number | null>(
    buildingCollisionsRef.current.serial ?? null,
  );

  useFrame((_, deltaSeconds) => {
    const currentSerial = buildingCollisionsRef.current.serial ?? null;

    if (currentSerial === lastDamagedBuildingSerialRef.current) {
      damagedBuildingIdsAccumulatorRef.current = 0;
      return;
    }

    damagedBuildingIdsAccumulatorRef.current += deltaSeconds;

    if (damagedBuildingIdsAccumulatorRef.current < 1 / 12) {
      return;
    }

    damagedBuildingIdsAccumulatorRef.current = 0;
    lastDamagedBuildingSerialRef.current = currentSerial;

    const nextIds = getSortedStringArray(
      getHomeDriveDamagedBuildingIdsFromCollisionState(
        buildingCollisionsRef.current,
      ),
    );

    setDamagedBuildingIds((currentIds) => {
      return areStringArraysEqual(currentIds, nextIds) ? currentIds : nextIds;
    });
  });

  return (
    <>
      <HomeDriveThreeSimulation
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        trafficRef={trafficRef}
        parkedVehiclesRef={parkedVehiclesRef}
        buildingCollisionsRef={buildingCollisionsRef}
        buildings={buildings}
        pedestriansRef={pedestriansRef}
        crosswalksRef={crosswalksRef}
        pedestrianPerformance={pedestrianPerformance}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
        snapshotHz={8}
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
        visibleRadiusMeters={
          isPortrait
            ? PARKED_VISIBLE_RADIUS_PORTRAIT
            : PARKED_VISIBLE_RADIUS_LANDSCAPE
        }
        maxVisibleVehicles={
          isPortrait ? PARKED_MAX_VISIBLE_PORTRAIT : PARKED_MAX_VISIBLE_LANDSCAPE
        }
      />

      <HomeDriveThreeBuildings
        buildings={buildings}
        hiddenBuildingIds={damagedBuildingIds}
      />

      <HomeDriveThreeDamagedBuildings
        buildings={buildings}
        buildingCollisionsRef={buildingCollisionsRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={
          isPortrait
            ? DAMAGED_BUILDINGS_VISIBLE_RADIUS_PORTRAIT
            : DAMAGED_BUILDINGS_VISIBLE_RADIUS_LANDSCAPE
        }
        maxVisibleBuildings={
          isPortrait
            ? DAMAGED_BUILDINGS_MAX_VISIBLE_PORTRAIT
            : DAMAGED_BUILDINGS_MAX_VISIBLE_LANDSCAPE
        }
        snapshotHz={8}
      />

      <HomeDriveThreeBuildingRubble
        buildingCollisionsRef={buildingCollisionsRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={
          isPortrait
            ? BUILDING_RUBBLE_VISIBLE_RADIUS_PORTRAIT
            : BUILDING_RUBBLE_VISIBLE_RADIUS_LANDSCAPE
        }
        maxVisiblePieces={
          isPortrait
            ? BUILDING_RUBBLE_MAX_VISIBLE_PORTRAIT
            : BUILDING_RUBBLE_MAX_VISIBLE_LANDSCAPE
        }
        snapshotHz={8}
      />

      <HomeDriveThreeBuildingCollisionMarks
        buildingCollisionsRef={buildingCollisionsRef}
        runtimeRef={runtimeRef}
        visibleRadiusMeters={
          isPortrait
            ? BUILDING_COLLISION_MARK_VISIBLE_RADIUS_PORTRAIT
            : BUILDING_COLLISION_MARK_VISIBLE_RADIUS_LANDSCAPE
        }
        maxVisibleMarks={
          isPortrait
            ? BUILDING_COLLISION_MARK_MAX_VISIBLE_PORTRAIT
            : BUILDING_COLLISION_MARK_MAX_VISIBLE_LANDSCAPE
        }
        snapshotHz={12}
      />

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

  const buildings = useMemo(() => {
    return getHomeDriveBuildings();
  }, []);

  const pedestrianPerformance = useMemo(() => {
    return getHomeDrivePedestrianPerformanceProfile(viewport.isPortrait);
  }, [viewport.isPortrait]);

  const initialTrafficState = useMemo(() => {
    return createInitialHomeDriveTrafficState({
      maxVehicles: viewport.isPortrait
        ? TRAFFIC_MAX_VEHICLES_PORTRAIT
        : TRAFFIC_MAX_VEHICLES_LANDSCAPE,
      density: viewport.isPortrait
        ? TRAFFIC_DENSITY_PORTRAIT
        : TRAFFIC_DENSITY_LANDSCAPE,
      minRoadLengthMeters: TRAFFIC_MIN_ROAD_LENGTH_METERS,
    });
  }, [viewport.isPortrait]);

  const trafficRef = useRef<HomeDriveTrafficRuntimeState>(initialTrafficState);

  const initialParkedVehicleState = useMemo(() => {
    return createInitialHomeDriveParkedVehicleState({
      maxVehicles: viewport.isPortrait
        ? PARKED_MAX_VEHICLES_PORTRAIT
        : PARKED_MAX_VEHICLES_LANDSCAPE,
      density: viewport.isPortrait
        ? PARKED_DENSITY_PORTRAIT
        : PARKED_DENSITY_LANDSCAPE,
      maxRoads: viewport.isPortrait
        ? PARKED_MAX_ROADS_PORTRAIT
        : PARKED_MAX_ROADS_LANDSCAPE,
      minRoadLengthMeters: PARKED_MIN_ROAD_LENGTH_METERS,
      seed: 6617,
    });
  }, [viewport.isPortrait]);

  const parkedVehiclesRef = useRef<HomeDriveParkedVehicleRuntimeState>(
    initialParkedVehicleState,
  );

  const buildingCollisionsRef =
    useRef<HomeDriveBuildingCollisionRuntimeState>(
      createInitialHomeDriveBuildingCollisionState(),
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
            buildingCollisionsRef={buildingCollisionsRef}
            buildings={buildings}
            pedestriansRef={pedestriansRef}
            crosswalksRef={crosswalksRef}
            pedestrianPerformance={pedestrianPerformance}
            isPortrait={viewport.isPortrait}
            publishRuntimeSnapshot={publishRuntimeSnapshot}
          />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
