// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation.tsx


import { useFrame } from "@react-three/fiber";

import { useRef } from "react";


import {

  resolveHomeDriveBuildingCollisions,

  type HomeDriveBuildingCollisionRuntimeState,

} from "../domain/buildingCollisions";

import {

  syncHomeDriveCrosswalkOccupanciesFromPedestrians,

  tickHomeDriveCrosswalks,

  type HomeDriveCrosswalkRuntimeState,

} from "../domain/crosswalks";

import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";

import { resolveHomeDriveTrafficCollisions } from "../domain/homeDrive.collision";

import { mergeHomeDriveImpactStates } from "../domain/homeDrive.impact";

import { tickHomeDrivePhysics } from "../domain/homeDrive.physics";

import { tickHomeDriveTraffic } from "../domain/homeDrive.traffic";
import { getHomeDriveTrafficPerformanceProfile } from "../domain/homeDrive.trafficPerformance";

import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";

import type {

  HomeDriveInputState,

  HomeDriveRuntimeState,

} from "../domain/homeDrive.types";

import {

  resolveHomeDriveParkedVehicleCollisions,

  tickHomeDriveParkedVehicleImpactState,

  type HomeDriveParkedVehicleRuntimeState,

} from "../domain/parkedVehicles";

import {

  createHomeDriveUrbanTrafficLights,

  resolveHomeDriveUrbanFixtureCollisions,

  type HomeDriveUrbanFixtureCollisionRuntimeState,

  type HomeDriveUrbanStreetLight,

} from "../domain/urbanFixtures";

import {

  resolveHomeDrivePedestrianCollisions,

  tickHomeDrivePedestrianImpactAgents,

  tickHomeDrivePedestrians,

  type HomeDrivePedestrianRuntimeState,

} from "../domain/pedestrians";

import type { HomeDrivePedestrianPerformanceProfile } from "../domain/pedestrians/homeDrive.pedestrianPerformance";

import { getHomeDrivePedestrianSimulationStepSeconds } from "../domain/pedestrians/homeDrive.pedestrianPerformance";

import {

  measureHomeDriveRuntimeProfilerSection,

  type HomeDriveRuntimeProfilerState,

} from "../domain/diagnostics";


type HomeDriveMutableRef<T> = {

  current: T;

};


export type HomeDriveThreeSimulationProps = Readonly<{

  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;

  inputRef: HomeDriveMutableRef<HomeDriveInputState>;

  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;

  parkedVehiclesRef?: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;

  urbanFixtureCollisionsRef?: HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>;

  urbanStreetLights?: readonly HomeDriveUrbanStreetLight[];

  buildingCollisionsRef?: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;

  buildings?: readonly HomeDriveBuilding[];

  pedestriansRef?: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;

  crosswalksRef?: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;

  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile;

  isPortrait?: boolean;

  enabled?: boolean;

  publishRuntimeSnapshot?: () => void;

  snapshotHz?: number;

  runtimeProfilerRef?: HomeDriveMutableRef<HomeDriveRuntimeProfilerState>;

}>;


type SimulationStepResult = Readonly<{

  runtime: HomeDriveRuntimeState;

  hadCollision: boolean;

}>;


const FIXED_STEP_SECONDS = 1 / 60;

const MAX_ACCUMULATED_SECONDS = 0.12;

const MAX_STEPS_PER_FRAME = 5;

const DEFAULT_SNAPSHOT_HZ = 8;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}


function sanitizeDeltaSeconds(deltaSeconds: number): number {

  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {

    return 0;

  }


  return Math.min(deltaSeconds, MAX_ACCUMULATED_SECONDS);

}


function tickPedestriansStep(

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

  crosswalksRef:

    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>

    | undefined,

  runtime: HomeDriveRuntimeState,

  deltaSeconds: number,

  tickIndex: number,

  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile,

): void {

  if (!pedestriansRef) {

    return;

  }


  pedestriansRef.current = tickHomeDrivePedestrians(

    pedestriansRef.current,

    deltaSeconds,

    {

      maxDeltaSeconds: deltaSeconds,

      simulationTimeSeconds: runtime.elapsedSeconds,

      crosswalks: crosswalksRef?.current,

      activeCenter: runtime.car.position,

      activeHeadingRad: runtime.car.headingRad,

      activeSpeedMps: runtime.car.speedMps,

      activeRadiusMeters: pedestrianPerformance?.activeSimulationRadiusMeters,

      warmRadiusMeters: pedestrianPerformance?.warmSimulationRadiusMeters,

      warmTickModulo: pedestrianPerformance?.warmTickModulo,

      coldTickModulo: pedestrianPerformance?.coldTickModulo,

      tickIndex,

      density: pedestrianPerformance?.density,

      seed: 7429,

      populateRadiusMeters: pedestrianPerformance?.populateRadiusMeters,

      pedestrianResidentPoolEnabled:

        pedestrianPerformance?.pedestrianResidentPoolEnabled,

      pedestrianResidentPoolSize:

        pedestrianPerformance?.pedestrianResidentPoolSize,

      pedestrianResidentPoolMinFrontAgents:

        pedestrianPerformance?.pedestrianResidentPoolMinFrontAgents,

      pedestrianResidentPoolMinFarAgents:

        pedestrianPerformance?.pedestrianResidentPoolMinFarAgents,

      pedestrianResidentPoolTeleportMinForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportMinForwardMeters,

      pedestrianResidentPoolTeleportMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportMaxForwardMeters,

      pedestrianResidentPoolTeleportHorizonMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolTeleportHorizonMaxForwardMeters,

      pedestrianResidentPoolRecycleBehindMeters:

        pedestrianPerformance?.pedestrianResidentPoolRecycleBehindMeters,

      pedestrianResidentPoolRecycleSideMeters:

        pedestrianPerformance?.pedestrianResidentPoolRecycleSideMeters,

      pedestrianResidentPoolMaxTeleportsPerTick:

        pedestrianPerformance?.pedestrianResidentPoolMaxTeleportsPerTick,

      pedestrianResidentPoolMaxInitialTeleports:

        pedestrianPerformance?.pedestrianResidentPoolMaxInitialTeleports,

      pedestrianResidentPoolProtectVisibleConeMeters:

        pedestrianPerformance?.pedestrianResidentPoolProtectVisibleConeMeters,

      pedestrianResidentPoolProtectVisibleConeRadians:

        pedestrianPerformance?.pedestrianResidentPoolProtectVisibleConeRadians,

      pedestrianResidentPoolDebug:

        pedestrianPerformance?.pedestrianResidentPoolDebug,

      pedestrianResidentPoolViewportOccupancyEnabled:

        pedestrianPerformance?.pedestrianResidentPoolViewportOccupancyEnabled,

      pedestrianResidentPoolForceAllAgentsIntoViewport:

        pedestrianPerformance?.pedestrianResidentPoolForceAllAgentsIntoViewport,

      pedestrianResidentPoolVisibleNearMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearMinMeters,

      pedestrianResidentPoolVisibleNearMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearMaxMeters,

      pedestrianResidentPoolVisibleNearCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleNearCount,

      pedestrianResidentPoolVisibleMidMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidMinMeters,

      pedestrianResidentPoolVisibleMidMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidMaxMeters,

      pedestrianResidentPoolVisibleMidCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleMidCount,

      pedestrianResidentPoolVisibleFarMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarMinMeters,

      pedestrianResidentPoolVisibleFarMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarMaxMeters,

      pedestrianResidentPoolVisibleFarCount:

        pedestrianPerformance?.pedestrianResidentPoolVisibleFarCount,

      pedestrianResidentPoolSideMinForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideMinForwardMeters,

      pedestrianResidentPoolSideMaxForwardMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideMaxForwardMeters,

      pedestrianResidentPoolSideLateralMinMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideLateralMinMeters,

      pedestrianResidentPoolSideLateralMaxMeters:

        pedestrianPerformance?.pedestrianResidentPoolSideLateralMaxMeters,

      pedestrianResidentPoolSideCount:

        pedestrianPerformance?.pedestrianResidentPoolSideCount,

      pedestrianResidentPoolMaxViewportTeleportsPerTick:

        pedestrianPerformance?.pedestrianResidentPoolMaxViewportTeleportsPerTick,

      pedestrianResidentPoolViewportMinSpacingMeters:

        pedestrianPerformance?.pedestrianResidentPoolViewportMinSpacingMeters,
      pedestrianResidentPoolLockAfterBoot:

        pedestrianPerformance?.pedestrianResidentPoolLockAfterBoot,
      pedestrianResidentPoolAllowRuntimeExpansion:

        pedestrianPerformance?.pedestrianResidentPoolAllowRuntimeExpansion,

      populationEnabled: true,

    },

  );


  if (crosswalksRef) {

    crosswalksRef.current = syncHomeDriveCrosswalkOccupanciesFromPedestrians(

      crosswalksRef.current,

      pedestriansRef.current.agents,

    );

  }

}


function tickPedestrianImpactVisualFrame(

  pedestriansRef:

    | HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>

    | undefined,

  runtime: HomeDriveRuntimeState,

  frameRemainderSeconds: number,

): void {

  if (!pedestriansRef || pedestriansRef.current.agents.length <= 0) {

    return;

  }

  const visualTimeSeconds =

    runtime.elapsedSeconds + clampNumber(frameRemainderSeconds, 0, FIXED_STEP_SECONDS);

  const nextAgents = tickHomeDrivePedestrianImpactAgents(

    pedestriansRef.current.agents,

    visualTimeSeconds,

  );

  pedestriansRef.current = {

    ...pedestriansRef.current,

    agents: nextAgents,

    elapsedSeconds: Math.max(

      pedestriansRef.current.elapsedSeconds,

      visualTimeSeconds,

    ),

  };

}


function tickPedestrianCollisionsStep(

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


function tickTrafficAndCollisionsStep(

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


function tickParkedVehiclesAndCollisionsStep(

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

      parkedVehiclePushMultiplier: 0.9,

      playerPushMultiplier: 0.92,

      playerReverseKickMultiplier: 0.52,

      minImpactSpeedMps: 0.72,

      maxDamagePerHit: 0.42,

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


function tickUrbanFixtureCollisionsStep(

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


function tickSimulationStep(

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


function getImpactSerial(runtime: HomeDriveRuntimeState): number | null {

  const serial = runtime.impact?.serial;


  return typeof serial === "number" && Number.isFinite(serial) ? serial : null;

}


export default function HomeDriveThreeSimulation({

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

  pedestrianPerformance,

  isPortrait = true,

  enabled = true,

  publishRuntimeSnapshot,

  snapshotHz = DEFAULT_SNAPSHOT_HZ,

  runtimeProfilerRef,

}: HomeDriveThreeSimulationProps) {

  const accumulatorRef = useRef(0);

  const snapshotAccumulatorRef = useRef(0);

  const pedestrianAccumulatorRef = useRef(0);

  const pedestrianTickIndexRef = useRef(0);

  const lastPublishedImpactSerialRef = useRef<number | null>(null);


  useFrame((_, rawDeltaSeconds) => {

    if (!enabled) {

      accumulatorRef.current = 0;

      snapshotAccumulatorRef.current = 0;

      pedestrianAccumulatorRef.current = 0;

      return;

    }


    const deltaSeconds = sanitizeDeltaSeconds(rawDeltaSeconds);


    if (deltaSeconds <= 0) {

      return;

    }


    accumulatorRef.current = Math.min(

      accumulatorRef.current + deltaSeconds,

      MAX_ACCUMULATED_SECONDS,

    );


    let steps = 0;

    let hadCollisionThisFrame = false;


    while (

      accumulatorRef.current >= FIXED_STEP_SECONDS &&

      steps < MAX_STEPS_PER_FRAME

    ) {

      const stepResult = tickSimulationStep(

        runtimeRef.current,

        inputRef.current,

        trafficRef,

        parkedVehiclesRef,

        pedestriansRef,

        urbanFixtureCollisionsRef,

        urbanStreetLights,

        buildingCollisionsRef,

        buildings,

        crosswalksRef,

        runtimeProfilerRef,

        isPortrait,

      );


      runtimeRef.current = stepResult.runtime;

      hadCollisionThisFrame = hadCollisionThisFrame || stepResult.hadCollision;


      const pedestrianStepSeconds = pedestrianPerformance

        ? getHomeDrivePedestrianSimulationStepSeconds(pedestrianPerformance)

        : FIXED_STEP_SECONDS;


      pedestrianAccumulatorRef.current += FIXED_STEP_SECONDS;


      while (pedestrianAccumulatorRef.current >= pedestrianStepSeconds) {

        pedestrianTickIndexRef.current += 1;


        measureHomeDriveRuntimeProfilerSection(

          runtimeProfilerRef?.current,

          "pedestrians",

          () => {

            tickPedestriansStep(

              pedestriansRef,

              crosswalksRef,

              runtimeRef.current,

              pedestrianStepSeconds,

              pedestrianTickIndexRef.current,

              pedestrianPerformance,

            );

          },

        );


        pedestrianAccumulatorRef.current -= pedestrianStepSeconds;

      }


      accumulatorRef.current -= FIXED_STEP_SECONDS;

      steps += 1;

    }


    if (steps >= MAX_STEPS_PER_FRAME) {

      accumulatorRef.current = 0;

      pedestrianAccumulatorRef.current = 0;

    }


    measureHomeDriveRuntimeProfilerSection(

      runtimeProfilerRef?.current,

      "pedestrians",

      () => {

        tickPedestrianImpactVisualFrame(

          pedestriansRef,

          runtimeRef.current,

          accumulatorRef.current,

        );

      },

    );


    if (!publishRuntimeSnapshot) {

      return;

    }


    const currentImpactSerial = getImpactSerial(runtimeRef.current);

    const hasNewImpactSerial =

      currentImpactSerial !== null &&

      currentImpactSerial !== lastPublishedImpactSerialRef.current;


    if (hadCollisionThisFrame || hasNewImpactSerial) {

      lastPublishedImpactSerialRef.current = currentImpactSerial;

      snapshotAccumulatorRef.current = 0;

      publishRuntimeSnapshot();

      return;

    }


    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 8));

    const snapshotIntervalSeconds = 1 / safeSnapshotHz;


    snapshotAccumulatorRef.current += deltaSeconds;


    if (snapshotAccumulatorRef.current < snapshotIntervalSeconds) {

      return;

    }


    snapshotAccumulatorRef.current = 0;

    lastPublishedImpactSerialRef.current = currentImpactSerial;

    publishRuntimeSnapshot();

  });


  return null;

}


