// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation/simulationFixtureCollisions.ts
// Colisões com carros estacionados e mobiliário urbano.

import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import { mergeHomeDriveImpactStates } from "../../domain/homeDrive.impact";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  resolveHomeDriveParkedVehicleCollisions,
  tickHomeDriveParkedVehicleImpactState,
  type HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import {
  createHomeDriveUrbanTrafficLights,
  resolveHomeDriveUrbanFixtureCollisions,
  type HomeDriveUrbanFixtureCollisionRuntimeState,
  type HomeDriveUrbanStreetLight,
} from "../../domain/urbanFixtures";

import { FIXED_STEP_SECONDS } from "./simulationShared";
import type {
  HomeDriveMutableRef,
  SimulationStepResult,
} from "./simulationShared";

export function tickParkedVehiclesAndCollisionsStep(

  nextRuntime: HomeDriveRuntimeState,

  parkedVehiclesRef:

    | HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>

    | undefined,

): SimulationStepResult {

  if (!parkedVehiclesRef) {

    return {

      runtime: nextRuntime,

      hadCollision: false,

    };

  }


  const impactedParkedVehicles = tickHomeDriveParkedVehicleImpactState(

    parkedVehiclesRef.current,

    FIXED_STEP_SECONDS,

  );


  const collisionResolution = resolveHomeDriveParkedVehicleCollisions(

    nextRuntime.car,

    impactedParkedVehicles,

    nextRuntime.elapsedSeconds,

    {

      brutality: 1.72,

      playerRadiusMeters: 1.64,

      parkedVehiclePushMultiplier: 1.24,

      playerPushMultiplier: 0.92,

      playerReverseKickMultiplier: 0.52,

      minImpactSpeedMps: 0.72,

      maxDamagePerHit: 0.78,

    },

  );


  parkedVehiclesRef.current = collisionResolution.parkedVehicles;


  if (collisionResolution.events.length <= 0 || !collisionResolution.impact) {

    return {

      runtime: nextRuntime,

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


export function tickUrbanFixtureCollisionsStep(

  nextRuntime: HomeDriveRuntimeState,

  urbanFixtureCollisionsRef:

    | HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>

    | undefined,

  urbanStreetLights: readonly HomeDriveUrbanStreetLight[] | undefined,

  crosswalksRef:

    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>

    | undefined,

): SimulationStepResult {

  if (!urbanFixtureCollisionsRef || !urbanStreetLights) {

    return {

      runtime: nextRuntime,

      hadCollision: false,

    };

  }



  const trafficLights = crosswalksRef

    ? createHomeDriveUrbanTrafficLights(

        crosswalksRef.current.crosswalks,

        crosswalksRef.current.elapsedSeconds,

      )

    : [];



  const collisionResolution = resolveHomeDriveUrbanFixtureCollisions(

    nextRuntime.car,

    urbanFixtureCollisionsRef.current,

    nextRuntime.elapsedSeconds,

    urbanStreetLights,

    trafficLights,

    {

      brutality: 1.62,

      playerRadiusMeters: 1.72,

      streetLightRadiusMeters: 0.76,

      trafficLightRadiusMeters: 0.94,

      minImpactSpeedMps: 0.66,

      maxCandidateRadiusMeters: 20,

      maxImpactsPerStep: 1,

      maxTrackedImpacts: 420,

      playerPushMultiplier: 0.84,

      reverseKickMultiplier: 0.05,

      maxReverseKickMps: 1.1,

      streetLightLeanMultiplier: 0.98,

      trafficLightLeanMultiplier: 1.34,

    },

  );



  urbanFixtureCollisionsRef.current =

    collisionResolution.urbanFixtureCollisions;



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
