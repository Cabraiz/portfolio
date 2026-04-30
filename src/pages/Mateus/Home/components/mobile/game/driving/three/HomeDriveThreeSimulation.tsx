// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation.tsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import {
  syncHomeDriveCrosswalkOccupanciesFromPedestrians,
  tickHomeDriveCrosswalks,
  type HomeDriveCrosswalkRuntimeState,
} from "../domain/crosswalks";

import { resolveHomeDriveTrafficCollisions } from "../domain/homeDrive.collision";
import { mergeHomeDriveImpactStates } from "../domain/homeDrive.impact";
import { tickHomeDrivePhysics } from "../domain/homeDrive.physics";
import { tickHomeDriveTraffic } from "../domain/homeDrive.traffic";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import {
  tickHomeDrivePedestrians,
  type HomeDrivePedestrianRuntimeState,
} from "../domain/pedestrians";
import type { HomeDrivePedestrianPerformanceProfile } from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import { getHomeDrivePedestrianSimulationStepSeconds } from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../domain/homeDrive.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeSimulationProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  pedestriansRef?: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  crosswalksRef?: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile;
  enabled?: boolean;

  /**
   * Usado apenas para atualizar overlays React em baixa frequência.
   * Não deve ser chamado a cada frame.
   */
  publishRuntimeSnapshot?: () => void;

  /**
   * Frequência de sincronização React para UI.
   * 8-12 Hz é suficiente para bússola sem causar stutter.
   */
  snapshotHz?: number;
}>;

const FIXED_STEP_SECONDS = 1 / 60;
const MAX_ACCUMULATED_SECONDS = 0.12;
const MAX_STEPS_PER_FRAME = 5;
const DEFAULT_SNAPSHOT_HZ = 10;

function sanitizeDeltaSeconds(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return 0;
  }

  return Math.min(deltaSeconds, MAX_ACCUMULATED_SECONDS);
}

function tickPedestriansStep(
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState> | undefined,
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState> | undefined,
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
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState> | undefined,
): HomeDriveRuntimeState {
  if (!trafficRef) {
    return nextRuntime;
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
    return nextRuntime;
  }

  return {
    ...nextRuntime,
    car: collisionResolution.car,
    impact: mergeHomeDriveImpactStates(
      nextRuntime.impact,
      collisionResolution.impact,
    ),
  };
}

function tickSimulationStep(
  runtime: HomeDriveRuntimeState,
  input: HomeDriveInputState,
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState> | undefined,
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState> | undefined,
): HomeDriveRuntimeState {
  if (crosswalksRef) {
    crosswalksRef.current = tickHomeDriveCrosswalks(
      crosswalksRef.current,
      FIXED_STEP_SECONDS,
    );
  }

  const physicsRuntime = tickHomeDrivePhysics(runtime, input, FIXED_STEP_SECONDS);

  return tickTrafficAndCollisionsStep(
    physicsRuntime,
    trafficRef,
    crosswalksRef,
  );
}

export default function HomeDriveThreeSimulation({
  runtimeRef,
  inputRef,
  trafficRef,
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

    while (
      accumulatorRef.current >= FIXED_STEP_SECONDS &&
      steps < MAX_STEPS_PER_FRAME
    ) {
      runtimeRef.current = tickSimulationStep(
        runtimeRef.current,
        inputRef.current,
        trafficRef,
        crosswalksRef,
      );

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

    /*
      Se o browser travou muito e acumulou mais que o limite,
      descartamos o excedente. Isso evita o efeito "teleportar"
      ou o jogo tentar simular atraso demais de uma vez.
    */
    if (steps >= MAX_STEPS_PER_FRAME) {
      accumulatorRef.current = 0;
      pedestrianAccumulatorRef.current = 0;
    }

    if (!publishRuntimeSnapshot) {
      return;
    }

    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 20));
    const snapshotIntervalSeconds = 1 / safeSnapshotHz;

    snapshotAccumulatorRef.current += deltaSeconds;

    if (snapshotAccumulatorRef.current < snapshotIntervalSeconds) {
      return;
    }

    snapshotAccumulatorRef.current = 0;
    publishRuntimeSnapshot();
  });

  return null;
}
