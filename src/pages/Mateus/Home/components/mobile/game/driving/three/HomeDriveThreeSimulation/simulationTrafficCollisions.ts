// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation/simulationTrafficCollisions.ts
// Colisões de pedestres e passo do tráfego com colisões.

import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import {
  resolveHomeDriveTrafficCollisions,
} from "../../domain/homeDrive.collision";
import { mergeHomeDriveImpactStates } from "../../domain/homeDrive.impact";
import { tickHomeDriveTraffic } from "../../domain/homeDrive.traffic";
import {
  getHomeDriveTrafficPerformanceProfile,
} from "../../domain/homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficRuntimeState,
} from "../../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  resolveHomeDrivePedestrianCollisions,
  tickHomeDrivePedestrianImpactAgents,
  type HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";

import { FIXED_STEP_SECONDS } from "./simulationShared";
import type {
  HomeDriveMutableRef,
  SimulationStepResult,
} from "./simulationShared";

export function tickPedestrianCollisionsStep(

  nextRuntime: HomeDriveRuntimeState,

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

): SimulationStepResult {

  if (!pedestriansRef) {

    return {

      runtime: nextRuntime,

      hadCollision: false,

    };

  }


  const impactTickedAgents = tickHomeDrivePedestrianImpactAgents(

    pedestriansRef.current.agents,

    nextRuntime.elapsedSeconds,

  );


  const collisionResolution = resolveHomeDrivePedestrianCollisions(

    nextRuntime.car,

    impactTickedAgents,

    nextRuntime.elapsedSeconds,

    {

      brutality: 1.92,

      playerRadiusMeters: 1.72,

      pedestrianRadiusMeters: 0.52,

      minImpactSpeedMps: 0.72,

      maxCandidateRadiusMeters: 24,

      impactForwardMeters: 5.2,

      lateralPaddingMeters: 1.12,

      speedLookaheadSeconds: 0.38,

      maxImpactForwardMeters: 24,

      speedLossRatio: 0.18,

      minSpeedAfterHitMps: -1.2,

      lockSeconds: 3.85,
      initialLaunchLeadSeconds: 0.11,
      zeroCarSpinOnPedestrianImpact: true,
      preserveCarHeading: true,
      resetSteeringOnImpact: true,
      carRecoilMultiplier: 0.58,
      carCameraShakeMultiplier: 0.6,
      carVisualPitchMultiplier: 0.28,
      carControlLockMultiplier: 0.68,
      carCollisionImpulseMultiplier: 0.78,

    },

  );


  pedestriansRef.current = {

    ...pedestriansRef.current,

    agents: collisionResolution.agents,

    elapsedSeconds: Math.max(

      pedestriansRef.current.elapsedSeconds,

      nextRuntime.elapsedSeconds,

    ),

  };


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


export function tickTrafficAndCollisionsStep(

  nextRuntime: HomeDriveRuntimeState,

  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState> | undefined,

  crosswalksRef:

    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>

    | undefined,

  isPortrait: boolean,

): SimulationStepResult {

  if (!trafficRef) {

    return {

      runtime: nextRuntime,

      hadCollision: false,

    };

  }


  const trafficPerformance = getHomeDriveTrafficPerformanceProfile(isPortrait);


  const nextTraffic = tickHomeDriveTraffic(

    trafficRef.current,

    FIXED_STEP_SECONDS,

    {

      crosswalks: crosswalksRef?.current,

      activeCenter: nextRuntime.car.position,

      activeHeadingRad: nextRuntime.car.headingRad,

      activeSpeedMps: nextRuntime.car.speedMps,

      performance: trafficPerformance,

    },

  );


  const collisionResolution = resolveHomeDriveTrafficCollisions(

    nextRuntime.car,

    nextTraffic,

    nextRuntime.elapsedSeconds,

    {

      brutality: 1.62,

      maxCandidateRadiusMeters: trafficPerformance.collisionCandidateRadiusMeters,

    },

  );


  trafficRef.current = collisionResolution.traffic;


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
