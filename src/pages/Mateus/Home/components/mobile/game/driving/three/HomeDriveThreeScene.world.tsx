// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.world.tsx

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type {
	HomeDriveBuildingCollisionRuntimeState,
} from "../domain/buildingCollisions";
import type { HomeDriveCrosswalkRuntimeState } from "../domain/crosswalks";
import type {
	HomeDriveRuntimeDiagnosticsSnapshot,
	HomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import {
	HOME_DRIVE_WORLD_BUILDINGS_ON,
	HOME_DRIVE_WORLD_CARS_ON,
	HOME_DRIVE_WORLD_PEDESTRIANS_ON,
} from "../domain/homeDrive.globalDebugFlags";
import type {
	HomeDriveTrafficRuntimeState,
} from "../domain/homeDrive.traffic.types";
import type {
	HomeDriveInputState,
	HomeDriveRuntimeState,
} from "../domain/homeDrive.types";
import type {
	HomeDriveParkedVehicleRuntimeState,
} from "../domain/parkedVehicles";
import type { HomeDrivePedestrianRuntimeState } from "../domain/pedestrians";
import type {
	HomeDrivePedestrianPerformanceProfile,
} from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import type {
	HomeDriveUrbanFixtureCollisionRuntimeState,
	HomeDriveUrbanStreetLight,
} from "../domain/urbanFixtures";
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
import type { HomeDriveMutableRef } from "./HomeDriveThreeScene.types";
import {
	getSortedStringArray,
	areStringArraysEqual,
	HomeDriveThreeEnvironment,
} from "./HomeDriveThreeScene.environment";
import {
	HomeDriveThreeBootReadinessProbe,
	HomeDriveThreeDiagnosticsSampler,
} from "./HomeDriveThreeScene.diagnostics";

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

export function HomeDriveThreeWorld({
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
