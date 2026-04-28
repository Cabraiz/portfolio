import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { resolveHomeDriveTrafficCollisions } from "../domain/homeDrive.collision";
import { tickHomeDrivePhysics } from "../domain/homeDrive.physics";
import { tickHomeDriveTraffic } from "../domain/homeDrive.traffic";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../domain/homeDrive.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveRuntimeImpactState = Readonly<{
  cameraShake: number;
  collisionImpulse: number;
  lastCollisionAt: number;
}>;

type HomeDriveRuntimeWithImpact = HomeDriveRuntimeState & {
  impact?: HomeDriveRuntimeImpactState;
};

export type HomeDriveThreeSimulationProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;
  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
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

const IMPACT_SHAKE_DECAY_PER_SECOND = 4.8;
const IMPACT_IMPULSE_DECAY_PER_SECOND = 6.2;

function sanitizeDeltaSeconds(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return 0;
  }

  return Math.min(deltaSeconds, MAX_ACCUMULATED_SECONDS);
}

function getRuntimeImpact(
  runtime: HomeDriveRuntimeState,
): HomeDriveRuntimeImpactState {
  const runtimeWithImpact = runtime as HomeDriveRuntimeWithImpact;

  return (
    runtimeWithImpact.impact ?? {
      cameraShake: 0,
      collisionImpulse: 0,
      lastCollisionAt: -999,
    }
  );
}

function decayValue(
  value: number,
  decayPerSecond: number,
  deltaSeconds: number,
): number {
  if (value <= 0) {
    return 0;
  }

  const nextValue = value * Math.exp(-decayPerSecond * deltaSeconds);

  return nextValue < 0.0001 ? 0 : nextValue;
}

function withRuntimeImpact(
  runtime: HomeDriveRuntimeState,
  impact: HomeDriveRuntimeImpactState,
): HomeDriveRuntimeState {
  return {
    ...runtime,
    impact,
  } as HomeDriveRuntimeState;
}

function tickRuntimeImpact(
  runtime: HomeDriveRuntimeState,
  deltaSeconds: number,
): HomeDriveRuntimeImpactState {
  const impact = getRuntimeImpact(runtime);

  return {
    cameraShake: decayValue(
      impact.cameraShake,
      IMPACT_SHAKE_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    collisionImpulse: decayValue(
      impact.collisionImpulse,
      IMPACT_IMPULSE_DECAY_PER_SECOND,
      deltaSeconds,
    ),
    lastCollisionAt: impact.lastCollisionAt,
  };
}

function tickSimulationStep(
  runtime: HomeDriveRuntimeState,
  input: HomeDriveInputState,
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState> | undefined,
): HomeDriveRuntimeState {
  const nextRuntime = tickHomeDrivePhysics(runtime, input, FIXED_STEP_SECONDS);
  const decayedImpact = tickRuntimeImpact(nextRuntime, FIXED_STEP_SECONDS);

  if (!trafficRef) {
    return withRuntimeImpact(nextRuntime, decayedImpact);
  }

  const nextTraffic = tickHomeDriveTraffic(
    trafficRef.current,
    FIXED_STEP_SECONDS,
  );

  const collisionResolution = resolveHomeDriveTrafficCollisions(
    nextRuntime.car,
    nextTraffic,
    nextRuntime.elapsedSeconds,
  );

  trafficRef.current = collisionResolution.traffic;

  if (collisionResolution.events.length <= 0) {
    return withRuntimeImpact(nextRuntime, decayedImpact);
  }

  return withRuntimeImpact(
    {
      ...nextRuntime,
      car: collisionResolution.car,
    },
    {
      cameraShake: Math.max(
        decayedImpact.cameraShake,
        collisionResolution.cameraShake,
      ),
      collisionImpulse: Math.max(
        decayedImpact.collisionImpulse,
        collisionResolution.collisionImpulse,
      ),
      lastCollisionAt: nextRuntime.elapsedSeconds,
    },
  );
}

export default function HomeDriveThreeSimulation({
  runtimeRef,
  inputRef,
  trafficRef,
  enabled = true,
  publishRuntimeSnapshot,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeSimulationProps) {
  const accumulatorRef = useRef(0);
  const snapshotAccumulatorRef = useRef(0);

  useFrame((_, rawDeltaSeconds) => {
    if (!enabled) {
      accumulatorRef.current = 0;
      snapshotAccumulatorRef.current = 0;
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
      );

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
