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
import {
  createHomeDriveRuntimeDiagnosticsSnapshot,
  createHomeDriveRuntimeProfilerState,
  flushHomeDriveRuntimeProfilerSnapshot,
  type HomeDriveRuntimeDiagnosticsSnapshot,
  type HomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import {
  HOME_DRIVE_WORLD_BUILDINGS_ON,
  HOME_DRIVE_WORLD_CARS_ON,
  HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT,
  HOME_DRIVE_WORLD_PEDESTRIANS_ON,
  HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ,
} from "../domain/homeDrive.globalDebugFlags";
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
  preloadHomeDrivePedestrianBootRuntime,
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
import {
  HomeDriveThreePedestrians,
  prewarmHomeDriveThreePedestrianAnimationBakeCache,
} from "./pedestrians";
import HomeDriveThreeRoadNetwork from "./HomeDriveThreeRoadNetwork";
import HomeDriveThreeSimulation from "./HomeDriveThreeSimulation";
import HomeDriveThreeTraffic from "./HomeDriveThreeTraffic";
import {
  createHomeDriveUrbanStreetLights,
  createInitialHomeDriveUrbanFixtureCollisionState,
  type HomeDriveUrbanFixtureCollisionRuntimeState,
  type HomeDriveUrbanStreetLight,
} from "../domain/urbanFixtures";
import HomeDriveThreeUrbanFixtures from "./urbanFixtures";
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
  onDiagnosticsSnapshot?: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
}>;

type HomeDriveThreeWorldProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  urbanFixtureCollisionsRef: HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>;
  urbanStreetLights: readonly HomeDriveUrbanStreetLight[];
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  buildings: readonly HomeDriveBuilding[];
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  runtimeProfilerRef: HomeDriveMutableRef<HomeDriveRuntimeProfilerState>;
  pedestrianPerformance: HomeDrivePedestrianPerformanceProfile;
  isPortrait: boolean;
  publishRuntimeSnapshot?: () => void;
  onDiagnosticsSnapshot?: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
}>;

const INITIAL_CAMERA_HEIGHT_METERS = 2.65;
const INITIAL_CAMERA_FOV = 66;
const INITIAL_CAMERA_NEAR = 0.1;
const INITIAL_CAMERA_FAR = 4200;

// Tráfego dinâmico: limite fixo pedido para reduzir custo de IA/render.
const TRAFFIC_MAX_VEHICLES_PORTRAIT = HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT;
const TRAFFIC_MAX_VEHICLES_LANDSCAPE = HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT;
const TRAFFIC_DENSITY_PORTRAIT = 1.7;
const TRAFFIC_DENSITY_LANDSCAPE = 2;
const TRAFFIC_MIN_ROAD_LENGTH_METERS = 64;

// Carros estacionados: pool alto pedido. Eles continuam com culling por raio/limite
// visível abaixo, então não viram 3000 instâncias desenhadas ao mesmo tempo.
const PARKED_MAX_VEHICLES_PORTRAIT = 3000;
const PARKED_MAX_VEHICLES_LANDSCAPE = 3000;
const PARKED_DENSITY_PORTRAIT = 1.35;
const PARKED_DENSITY_LANDSCAPE = 1.35;
const PARKED_MAX_ROADS_PORTRAIT = 3000;
const PARKED_MAX_ROADS_LANDSCAPE = 3000;
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

const URBAN_FIXTURES_VISIBLE_RADIUS_PORTRAIT = 680;
const URBAN_FIXTURES_VISIBLE_RADIUS_LANDSCAPE = 860;
const URBAN_FIXTURES_MAX_STREET_LIGHTS_PORTRAIT = 180;
const URBAN_FIXTURES_MAX_STREET_LIGHTS_LANDSCAPE = 260;
const URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_PORTRAIT = 72;
const URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_LANDSCAPE = 112;
const URBAN_FIXTURES_STREET_LIGHT_DENSITY = 1.18;
const URBAN_FIXTURES_MAX_STREET_LIGHTS_TOTAL = 1040;
const URBAN_FIXTURES_MIN_ROAD_LENGTH_METERS = 58;
const URBAN_FIXTURES_STREET_LIGHT_SEED = 17191;

const THREE_CLOCK_DEPRECATION_WARNING =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

const HOME_DRIVE_THREE_PEDESTRIAN_SCENE_DEBUG = true;

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


type HomeDriveThreeDiagnosticsSamplerProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  buildings: readonly HomeDriveBuilding[];
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  runtimeProfilerRef: HomeDriveMutableRef<HomeDriveRuntimeProfilerState>;
  onDiagnosticsSnapshot: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
}>;

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function HomeDriveThreeDiagnosticsSampler({
  runtimeRef,
  trafficRef,
  parkedVehiclesRef,
  buildings,
  buildingCollisionsRef,
  pedestriansRef,
  runtimeProfilerRef,
  onDiagnosticsSnapshot,
}: HomeDriveThreeDiagnosticsSamplerProps) {
  const { gl } = useThree();
  const smoothedFpsRef = useRef(60);
  const lastPublishAtMsRef = useRef(0);
  const sampleIntervalMs =
    1000 / Math.max(1, HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ);

  useFrame((_, deltaSeconds) => {
    const nowMs = getNowMs();
    const instantFps = deltaSeconds > 0 ? 1 / deltaSeconds : smoothedFpsRef.current;

    smoothedFpsRef.current =
      smoothedFpsRef.current * 0.84 + instantFps * 0.16;

    if (nowMs - lastPublishAtMsRef.current < sampleIntervalMs) {
      return;
    }

    lastPublishAtMsRef.current = nowMs;

    onDiagnosticsSnapshot(
      createHomeDriveRuntimeDiagnosticsSnapshot({
        sampledAtMs: nowMs,
        fps: smoothedFpsRef.current,
        frameTimeMs: deltaSeconds * 1000,
        runtime: runtimeRef.current,
        traffic: trafficRef.current,
        parkedVehicles: parkedVehiclesRef.current,
        pedestrians: pedestriansRef.current,
        buildings,
        buildingCollisions: buildingCollisionsRef.current,
        renderer: {
          memory: {
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
          },
          render: {
            calls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            points: gl.info.render.points,
            lines: gl.info.render.lines,
          },
        },
        profiler: flushHomeDriveRuntimeProfilerSnapshot(
          runtimeProfilerRef.current,
          nowMs,
        ),
      }),
    );
  });

  return null;
}

function HomeDriveThreeWorld({
  runtimeRef,
  inputRef,
  trafficRef,
  parkedVehiclesRef,
  urbanFixtureCollisionsRef,
  urbanStreetLights,
  buildingCollisionsRef,
  buildings,
  pedestriansRef,
  crosswalksRef,
  runtimeProfilerRef,
  pedestrianPerformance,
  isPortrait,
  publishRuntimeSnapshot,
  onDiagnosticsSnapshot,
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
      {onDiagnosticsSnapshot ? (
        <HomeDriveThreeDiagnosticsSampler
          runtimeRef={runtimeRef}
          trafficRef={trafficRef}
          parkedVehiclesRef={parkedVehiclesRef}
          buildings={buildings}
          buildingCollisionsRef={buildingCollisionsRef}
          pedestriansRef={pedestriansRef}
          runtimeProfilerRef={runtimeProfilerRef}
          onDiagnosticsSnapshot={onDiagnosticsSnapshot}
        />
      ) : null}

      <HomeDriveThreeSimulation
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        trafficRef={HOME_DRIVE_WORLD_CARS_ON ? trafficRef : undefined}
        parkedVehiclesRef={
          HOME_DRIVE_WORLD_CARS_ON ? parkedVehiclesRef : undefined
        }
        urbanFixtureCollisionsRef={urbanFixtureCollisionsRef}
        urbanStreetLights={urbanStreetLights}
        buildingCollisionsRef={
          HOME_DRIVE_WORLD_BUILDINGS_ON ? buildingCollisionsRef : undefined
        }
        buildings={HOME_DRIVE_WORLD_BUILDINGS_ON ? buildings : []}
        pedestriansRef={
          HOME_DRIVE_WORLD_PEDESTRIANS_ON ? pedestriansRef : undefined
        }
        crosswalksRef={crosswalksRef}
        pedestrianPerformance={
          HOME_DRIVE_WORLD_PEDESTRIANS_ON ? pedestrianPerformance : undefined
        }
        isPortrait={isPortrait}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
        snapshotHz={8}
        runtimeProfilerRef={runtimeProfilerRef}
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
        showSignals={false}
      />

      <HomeDriveThreeUrbanFixtures
        runtimeRef={runtimeRef}
        crosswalksRef={crosswalksRef}
        urbanFixtureCollisionsRef={urbanFixtureCollisionsRef}
        streetLights={urbanStreetLights}
        visibleRadiusMeters={
          isPortrait
            ? URBAN_FIXTURES_VISIBLE_RADIUS_PORTRAIT
            : URBAN_FIXTURES_VISIBLE_RADIUS_LANDSCAPE
        }
        maxVisibleStreetLights={
          isPortrait
            ? URBAN_FIXTURES_MAX_STREET_LIGHTS_PORTRAIT
            : URBAN_FIXTURES_MAX_STREET_LIGHTS_LANDSCAPE
        }
        maxVisibleTrafficLights={
          isPortrait
            ? URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_PORTRAIT
            : URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_LANDSCAPE
        }
        snapshotHz={6}
      />

      {HOME_DRIVE_WORLD_CARS_ON ? (
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
      ) : null}

      {HOME_DRIVE_WORLD_BUILDINGS_ON ? (
        <>
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
        </>
      ) : null}
      {HOME_DRIVE_WORLD_CARS_ON ? (
        <HomeDriveThreeTraffic
          trafficRef={trafficRef}
          runtimeRef={runtimeRef}
          isPortrait={isPortrait}
        />
      ) : null}

      {HOME_DRIVE_WORLD_PEDESTRIANS_ON ? (
        <HomeDriveThreePedestrians
          pedestriansRef={pedestriansRef}
          runtimeRef={runtimeRef}
          visibleRadiusMeters={pedestrianPerformance.visibleRadiusMeters}
          maxVisiblePedestrians={pedestrianPerformance.maxVisiblePedestrians}
          fullDetailRadiusMeters={pedestrianPerformance.fullDetailRadiusMeters}
          mediumDetailRadiusMeters={pedestrianPerformance.mediumDetailRadiusMeters}
          snapshotHz={pedestrianPerformance.snapshotHz}
          enableInstancedRig={pedestrianPerformance.enableInstancedRig}
          enableBakedAnimation={pedestrianPerformance.enableBakedAnimation}
          maxFullReactPedestrians={pedestrianPerformance.maxFullReactPedestrians}
          maxMediumReactPedestrians={pedestrianPerformance.maxMediumReactPedestrians}
          maxInstancedPedestrians={pedestrianPerformance.maxInstancedPedestrians}
          instancedAnimationHz={pedestrianPerformance.instancedAnimationHzNear}
          instancedAnimationUpdateStride={
            pedestrianPerformance.instancedMatrixUpdateStride
          }
          instancedMaxUpdatesPerFrame={
            pedestrianPerformance.instancedMaxUpdatesPerFrame
          }
          enableRenderSeparation={
            pedestrianPerformance.enablePedestrianRenderSeparation
          }
          renderSeparationCellSizeMeters={
            pedestrianPerformance.pedestrianRenderSeparationCellSizeMeters
          }
          renderSeparationMinMeters={
            pedestrianPerformance.pedestrianRenderSeparationMinMeters
          }
          renderSeparationMaxOffsetMeters={
            pedestrianPerformance.pedestrianRenderSeparationMaxOffsetMeters
          }
          debug={false}
        />
      ) : null}

      <HomeDriveThreeWorldObjects runtimeRef={runtimeRef} />
    </>
  );
}

export default function HomeDriveThreeScene({
  runtimeRef,
  inputRef,
  viewport,
  publishRuntimeSnapshot,
  onDiagnosticsSnapshot,
}: HomeDriveThreeSceneProps) {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    return installThreeClockDeprecationWarningFilter();
  }, []);

  const buildings = useMemo(() => {
    return HOME_DRIVE_WORLD_BUILDINGS_ON ? getHomeDriveBuildings() : [];
  }, []);

  const urbanStreetLights = useMemo(() => {
    return createHomeDriveUrbanStreetLights({
      density: URBAN_FIXTURES_STREET_LIGHT_DENSITY,
      maxLights: URBAN_FIXTURES_MAX_STREET_LIGHTS_TOTAL,
      minRoadLengthMeters: URBAN_FIXTURES_MIN_ROAD_LENGTH_METERS,
      seed: URBAN_FIXTURES_STREET_LIGHT_SEED,
    });
  }, []);

  const pedestrianPerformance = useMemo(() => {
    return getHomeDrivePedestrianPerformanceProfile(viewport.isPortrait);
  }, [viewport.isPortrait]);

  const initialTrafficState = useMemo<HomeDriveTrafficRuntimeState>(() => {
    if (!HOME_DRIVE_WORLD_CARS_ON) {
      return {
        vehicles: [],
        elapsedSeconds: 0,
        lastCollisionAt: -999,
      };
    }

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

  const initialParkedVehicleState = useMemo<HomeDriveParkedVehicleRuntimeState>(() => {
    if (!HOME_DRIVE_WORLD_CARS_ON) {
      return {
        vehicles: [],
        seed: 6617,
      };
    }

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

  const urbanFixtureCollisionsRef =
    useRef<HomeDriveUrbanFixtureCollisionRuntimeState>(
      createInitialHomeDriveUrbanFixtureCollisionState(),
    );

  const crosswalksRef = useRef<HomeDriveCrosswalkRuntimeState>(
    createInitialHomeDriveCrosswalkState({
      maxCrosswalks: viewport.isPortrait ? 72 : 96,
      density: viewport.isPortrait ? 0.86 : 1.08,
      minRoadLengthMeters: 82,
      seed: 9841,
    }),
  );

  const initialPedestrianState = useMemo<HomeDrivePedestrianRuntimeState>(() => {
    if (!HOME_DRIVE_WORLD_PEDESTRIANS_ON) {
      return createInitialHomeDrivePedestrianState({
        density: 0,
        maxRoads: 0,
        minRoadLengthMeters: Number.POSITIVE_INFINITY,
        seed: 7429,
        initialFocusCenter: runtimeRef.current.car.position,
      });
    }

    const animationBakePrewarm =
      prewarmHomeDriveThreePedestrianAnimationBakeCache();
    const basePedestrians = createInitialHomeDrivePedestrianState({
      density: pedestrianPerformance.density,
      maxRoads: pedestrianPerformance.maxRoads,
      minRoadLengthMeters: pedestrianPerformance.minRoadLengthMeters,
      seed: 7429,
      initialFocusCenter: runtimeRef.current.car.position,
    });

    return preloadHomeDrivePedestrianBootRuntime(basePedestrians, {
      enabled: pedestrianPerformance.pedestrianBootPreloadEnabled,
      activeCenter: runtimeRef.current.car.position,
      activeHeadingRad: runtimeRef.current.car.headingRad,
      activeSpeedMps: runtimeRef.current.car.speedMps,
      seed: 7429,
      profile: pedestrianPerformance,
      steps: pedestrianPerformance.pedestrianBootPreloadSteps,
      stepSeconds: pedestrianPerformance.pedestrianBootPreloadStepSeconds,
      bakeLibraryClipCount: animationBakePrewarm.clipCount,
      bakeLibrarySampleCount: animationBakePrewarm.sampleCount,
      debug: HOME_DRIVE_THREE_PEDESTRIAN_SCENE_DEBUG,
    }).pedestrians;
  }, [pedestrianPerformance, runtimeRef]);

  const pedestriansRef = useRef<HomeDrivePedestrianRuntimeState>(
    initialPedestrianState,
  );

  const runtimeProfilerRef = useRef<HomeDriveRuntimeProfilerState>(
    createHomeDriveRuntimeProfilerState(),
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
          />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}


