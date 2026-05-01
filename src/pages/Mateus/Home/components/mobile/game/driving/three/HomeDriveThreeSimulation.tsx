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
  tickHomeDrivePedestrians,
  type HomeDrivePedestrianRuntimeState,
} from "../domain/pedestrians";
import type { HomeDrivePedestrianPerformanceProfile } from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import { getHomeDrivePedestrianSimulationStepSeconds } from "../domain/pedestrians/homeDrive.pedestrianPerformance";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeSimulationProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  parkedVehiclesRef?: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  buildingCollisionsRef?: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  buildings?: readonly HomeDriveBuilding[];
  pedestriansRef?: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  crosswalksRef?: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile;
  enabled?: boolean;
  publishRuntimeSnapshot?: () => void;
  snapshotHz?: number;
}>;

type SimulationStepResult = Readonly<{
  runtime: HomeDriveRuntimeState;
  hadCollision: boolean;
}>;

const FIXED_STEP_SECONDS = 1 / 60;
const MAX_ACCUMULATED_SECONDS = 0.12;
const MAX_STEPS_PER_FRAME = 5;
const DEFAULT_SNAPSHOT_HZ = 8;

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
      crosswalks: crosswalksRef?.current,
      activeCenter: runtime.car.position,
      activeRadiusMeters: pedestrianPerformance?.activeSimulationRadiusMeters,
      warmRadiusMeters: pedestrianPerformance?.warmSimulationRadiusMeters,
      warmTickModulo: pedestrianPerformance?.warmTickModulo,
      coldTickModulo: pedestrianPerformance?.coldTickModulo,
      tickIndex,
    },
  );

  if (crosswalksRef) {
    crosswalksRef.current = syncHomeDriveCrosswalkOccupanciesFromPedestrians(
      crosswalksRef.current,
      pedestriansRef.current.agents,
    );
  }
}

function tickTrafficAndCollisionsStep(
  nextRuntime: HomeDriveRuntimeState,
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState> | undefined,
  crosswalksRef:
    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>
    | undefined,
): SimulationStepResult {
  if (!trafficRef) {
    return {
      runtime: nextRuntime,
      hadCollision: false,
    };
  }

  const nextTraffic = tickHomeDriveTraffic(
    trafficRef.current,
    FIXED_STEP_SECONDS,
    {
      crosswalks: crosswalksRef?.current,
    },
  );

  const collisionResolution = resolveHomeDriveTrafficCollisions(
    nextRuntime.car,
    nextTraffic,
    nextRuntime.elapsedSeconds,
    {
      brutality: 1.62,
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
  buildingCollisionsRef:
    | HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>
    | undefined,
  buildings: readonly HomeDriveBuilding[] | undefined,
  crosswalksRef:
    | HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>
    | undefined,
): SimulationStepResult {
  if (crosswalksRef) {
    crosswalksRef.current = tickHomeDriveCrosswalks(
      crosswalksRef.current,
      FIXED_STEP_SECONDS,
    );
  }

  const physicsRuntime = tickHomeDrivePhysics(runtime, input, FIXED_STEP_SECONDS);

  const trafficResult = tickTrafficAndCollisionsStep(
    physicsRuntime,
    trafficRef,
    crosswalksRef,
  );

  const parkedResult = tickParkedVehiclesAndCollisionsStep(
    trafficResult.runtime,
    parkedVehiclesRef,
  );

  /**
   * Prédio entra por último.
   *
   * Motivo:
   * se tráfego/carro parado empurrar o player para dentro da fachada,
   * o prédio corrige a posição final e gera o impacto visual.
   */
  const buildingResult = tickBuildingCollisionsStep(
    parkedResult.runtime,
    buildings,
    buildingCollisionsRef,
  );

  return {
    runtime: buildingResult.runtime,
    hadCollision:
      trafficResult.hadCollision ||
      parkedResult.hadCollision ||
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
  buildingCollisionsRef,
  buildings,
  pedestriansRef,
  crosswalksRef,
  pedestrianPerformance,
  enabled = true,
  publishRuntimeSnapshot,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
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
        buildingCollisionsRef,
        buildings,
        crosswalksRef,
      );

      runtimeRef.current = stepResult.runtime;
      hadCollisionThisFrame = hadCollisionThisFrame || stepResult.hadCollision;

      const pedestrianStepSeconds = pedestrianPerformance
        ? getHomeDrivePedestrianSimulationStepSeconds(pedestrianPerformance)
        : FIXED_STEP_SECONDS;

      pedestrianAccumulatorRef.current += FIXED_STEP_SECONDS;

      while (pedestrianAccumulatorRef.current >= pedestrianStepSeconds) {
        pedestrianTickIndexRef.current += 1;

        tickPedestriansStep(
          pedestriansRef,
          crosswalksRef,
          runtimeRef.current,
          pedestrianStepSeconds,
          pedestrianTickIndexRef.current,
          pedestrianPerformance,
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
