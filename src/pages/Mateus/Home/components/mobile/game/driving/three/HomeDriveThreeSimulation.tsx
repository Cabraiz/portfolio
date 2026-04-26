// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation.tsx

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";

import { tickHomeDrivePhysics } from "../domain/homeDrive.physics";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../domain/homeDrive.types";

export type HomeDriveThreeSimulationProps = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
  inputRef: MutableRefObject<HomeDriveInputState>;
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

export default function HomeDriveThreeSimulation({
  runtimeRef,
  inputRef,
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
      runtimeRef.current = tickHomeDrivePhysics(
        runtimeRef.current,
        inputRef.current,
        FIXED_STEP_SECONDS,
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
