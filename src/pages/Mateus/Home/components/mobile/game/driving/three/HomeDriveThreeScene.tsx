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

import type { HomeDriveBuildingCollisionRuntimeState } from "../domain/buildingCollisions";
import type { HomeDriveCrosswalkRuntimeState } from "../domain/crosswalks";
import {
  createHomeDriveRuntimeDiagnosticsSnapshot,
  flushHomeDriveRuntimeProfilerSnapshot,
  type HomeDriveRuntimeDiagnosticsSnapshot,
  type HomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import {
  HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ,
  HOME_DRIVE_WORLD_BUILDINGS_ON,
  HOME_DRIVE_WORLD_CARS_ON,
  HOME_DRIVE_WORLD_PEDESTRIANS_ON,
} from "../domain/homeDrive.globalDebugFlags";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
import type { HomeDriveParkedVehicleRuntimeState } from "../domain/parkedVehicles";
import type { HomeDrivePedestrianRuntimeState } from "../domain/pedestrians";
import type { HomeDrivePedestrianPerformanceProfile } from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import type {
  HomeDriveUrbanFixtureCollisionRuntimeState,
  HomeDriveUrbanStreetLight,
} from "../domain/urbanFixtures";
import type { HomeDriveBootAssets } from "../boot/homeDriveBootAssets";
import {
  BUILDING_COLLISION_MARK_MAX_VISIBLE_LANDSCAPE,
  BUILDING_COLLISION_MARK_MAX_VISIBLE_PORTRAIT,
  BUILDING_COLLISION_MARK_VISIBLE_RADIUS_LANDSCAPE,
  BUILDING_COLLISION_MARK_VISIBLE_RADIUS_PORTRAIT,
  BUILDING_RUBBLE_MAX_VISIBLE_LANDSCAPE,
  BUILDING_RUBBLE_MAX_VISIBLE_PORTRAIT,
  BUILDING_RUBBLE_VISIBLE_RADIUS_LANDSCAPE,
  BUILDING_RUBBLE_VISIBLE_RADIUS_PORTRAIT,
  DAMAGED_BUILDINGS_MAX_VISIBLE_LANDSCAPE,
  DAMAGED_BUILDINGS_MAX_VISIBLE_PORTRAIT,
  DAMAGED_BUILDINGS_VISIBLE_RADIUS_LANDSCAPE,
  DAMAGED_BUILDINGS_VISIBLE_RADIUS_PORTRAIT,
  HOME_DRIVE_BOOT_WORLD_READY_MIN_FRAMES,
  HOME_DRIVE_BOOT_WORLD_READY_MIN_MS,
  INITIAL_CAMERA_FAR,
  INITIAL_CAMERA_FOV,
  INITIAL_CAMERA_HEIGHT_METERS,
  INITIAL_CAMERA_NEAR,
  PARKED_MAX_VISIBLE_LANDSCAPE,
  PARKED_MAX_VISIBLE_PORTRAIT,
  PARKED_VISIBLE_RADIUS_LANDSCAPE,
  PARKED_VISIBLE_RADIUS_PORTRAIT,
  URBAN_FIXTURES_MAX_STREET_LIGHTS_LANDSCAPE,
  URBAN_FIXTURES_MAX_STREET_LIGHTS_PORTRAIT,
  URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_LANDSCAPE,
  URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_PORTRAIT,
  URBAN_FIXTURES_VISIBLE_RADIUS_LANDSCAPE,
  URBAN_FIXTURES_VISIBLE_RADIUS_PORTRAIT,
} from "../boot/homeDriveBootConfig";
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
import HomeDriveThreeUrbanFixtures from "./urbanFixtures";
import HomeDriveThreeWorldObjects from "./HomeDriveThreeWorldObjects";
import { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials";
import styles from "./HomeDriveThreeScene.module.css";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeSceneProps = Readonly<{
  bootAssets: HomeDriveBootAssets;
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  viewport: HomeDriveViewportMetrics;
  publishRuntimeSnapshot?: () => void;
  onDiagnosticsSnapshot?: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
  onInitialWorldReady?: () => void;
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
  onInitialWorldReady?: () => void;
}>;

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

function HomeDriveThreeBootReadinessProbe({
  minFrames,
  minElapsedMs,
  onReady,
}: Readonly<{
  minFrames: number;
  minElapsedMs: number;
  onReady?: () => void;
}>) {
  const startedAtMsRef = useRef(getNowMs());
  const frameCountRef = useRef(0);
  const didReportRef = useRef(false);

  useFrame(() => {
    if (!onReady || didReportRef.current) {
      return;
    }

    frameCountRef.current += 1;

    const elapsedMs = getNowMs() - startedAtMsRef.current;

    if (frameCountRef.current < minFrames || elapsedMs < minElapsedMs) {
      return;
    }

    didReportRef.current = true;
    onReady();
  });

  return null;
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
  onInitialWorldReady,
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

      <HomeDriveThreeBootReadinessProbe
        minFrames={HOME_DRIVE_BOOT_WORLD_READY_MIN_FRAMES}
        minElapsedMs={HOME_DRIVE_BOOT_WORLD_READY_MIN_MS}
        onReady={onInitialWorldReady}
      />
    </>
  );
}

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




