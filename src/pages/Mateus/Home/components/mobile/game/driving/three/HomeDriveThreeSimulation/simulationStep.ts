// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation/simulationStep.ts
// Colisões com prédios e passo completo da simulação.

import {
  resolveHomeDriveBuildingCollisions,
  type HomeDriveBuildingCollisionRuntimeState,
} from "../../domain/buildingCollisions";
import {
  tickHomeDriveCrosswalks,
  type HomeDriveCrosswalkRuntimeState,
} from "../../domain/crosswalks";
import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import { mergeHomeDriveImpactStates } from "../../domain/homeDrive.impact";
import { tickHomeDrivePhysics } from "../../domain/homeDrive.physics";
import type {
  HomeDriveTrafficRuntimeState,
} from "../../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../../domain/homeDrive.types";
import type {
  HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import type {
  HomeDriveUrbanFixtureCollisionRuntimeState,
  HomeDriveUrbanStreetLight,
} from "../../domain/urbanFixtures";
import type { HomeDrivePedestrianRuntimeState } from "../../domain/pedestrians";
import {
  measureHomeDriveRuntimeProfilerSection,
  type HomeDriveRuntimeProfilerState,
} from "../../domain/diagnostics";

import { FIXED_STEP_SECONDS } from "./simulationShared";
import type {
  HomeDriveMutableRef,
  SimulationStepResult,
} from "./simulationShared";
import {
  tickPedestrianCollisionsStep,
  tickTrafficAndCollisionsStep,
} from "./simulationTrafficCollisions";
import {
  tickParkedVehiclesAndCollisionsStep,
  tickUrbanFixtureCollisionsStep,
} from "./simulationFixtureCollisions";

function tickBuildingCollisionsStep(

  nextRuntime: HomeDriveRuntimeState,

  buildings: readonly HomeDriveBuilding[] | undefined,

  buildingCollisionsRef:

    | HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>

    | undefined,

): SimulationStepResult {

  if (!buildingCollisionsRef || !buildings || buildings.length <= 0) {

    return {

      runtime: nextRuntime,

      hadCollision: false,

    };

  }


  const collisionResolution = resolveHomeDriveBuildingCollisions(

    nextRuntime.car,

    buildings,

    buildingCollisionsRef.current,

    nextRuntime.elapsedSeconds,

    {

      brutality: 1.86,

      playerRadiusMeters: 1.72,

      playerPushMultiplier: 0.98,

      reverseKickMultiplier: 0.62,

      maxReverseKickMps: 13.5,

      minImpactSpeedMps: 0.68,

      cooldownSeconds: 0.28,

      candidateRadiusMeters: 108,

      maxCandidateBuildings: 36,

    },

  );


  buildingCollisionsRef.current = collisionResolution.buildingCollisions;


  if (collisionResolution.events.length <= 0 || !collisionResolution.impact) {

    return {

      runtime: {

        ...nextRuntime,

        car: collisionResolution.car,

      },

      hadCollision: false,

    };

  }


  return {

    runtime: {

      ...nextRuntime,

      car: collisionResolution.car,

      impact: mergeHomeDriveImpactStates(

        nextRuntime.impact,

        collisionResolution.impact,

      ),

    },

    hadCollision: true,

  };

}


export function tickSimulationStep(

  runtime: HomeDriveRuntimeState,

  input: HomeDriveInputState,

  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState> | undefined,

  parkedVehiclesRef:

    | HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>

    | undefined,

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

  urbanFixtureCollisionsRef:

    | HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>

    | undefined,

  urbanStreetLights: readonly HomeDriveUrbanStreetLight[] | undefined,

  buildingCollisionsRef:

    | HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>

    | undefined,

  buildings: readonly HomeDriveBuilding[] | undefined,

  crosswalksRef:

    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>

    | undefined,

  runtimeProfilerRef:

    | HomeDriveMutableRef<HomeDriveRuntimeProfilerState>

    | undefined,

  isPortrait: boolean,

): SimulationStepResult {

  if (crosswalksRef) {

    crosswalksRef.current = tickHomeDriveCrosswalks(

      crosswalksRef.current,

      FIXED_STEP_SECONDS,

    );

  }


  const physicsRuntime = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "physics",

    () => tickHomeDrivePhysics(runtime, input, FIXED_STEP_SECONDS),

  );


  const pedestrianCollisionResult = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "pedestrians",

    () =>

      tickPedestrianCollisionsStep(

        physicsRuntime,

        pedestriansRef,

      ),

  );


  const trafficResult = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "traffic",

    () =>

      tickTrafficAndCollisionsStep(

        pedestrianCollisionResult.runtime,

        trafficRef,

        crosswalksRef,

        isPortrait,

      ),

  );


  const parkedResult = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "parkedVehicles",

    () =>

      tickParkedVehiclesAndCollisionsStep(

        trafficResult.runtime,

        parkedVehiclesRef,

      ),

  );


  const urbanFixtureResult = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "urbanFixtures",

    () =>

      tickUrbanFixtureCollisionsStep(

        parkedResult.runtime,

        urbanFixtureCollisionsRef,

        urbanStreetLights,

        crosswalksRef,

      ),

  );


  /**

   * Prédio entra por último.

   *

   * Motivo:

   * se tráfego/carro parado empurrar o player para dentro da fachada,

   * o prédio corrige a posição final e gera o impacto visual.

   */

  const buildingResult = measureHomeDriveRuntimeProfilerSection(

    runtimeProfilerRef?.current,

    "buildings",

    () =>

      tickBuildingCollisionsStep(

        urbanFixtureResult.runtime,

        buildings,

        buildingCollisionsRef,

      ),

  );


  return {

    runtime: buildingResult.runtime,

    hadCollision:

      pedestrianCollisionResult.hadCollision ||

      trafficResult.hadCollision ||

      parkedResult.hadCollision ||

      urbanFixtureResult.hadCollision ||

      buildingResult.hadCollision,

  };

}
