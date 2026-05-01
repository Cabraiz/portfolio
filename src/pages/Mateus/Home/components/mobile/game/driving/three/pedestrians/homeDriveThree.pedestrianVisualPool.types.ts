// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisualPool.types.ts

import type { HomeDriveThreePedestrianInstancedRigEntry } from "./homeDriveThree.pedestrianInstanceBatches.types";

export type HomeDriveThreePedestrianVisualPoolVector2 = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveThreePedestrianVisualPoolSlot = {
  slotIndex: number;
  agentId: string | null;
  entry: HomeDriveThreePedestrianInstancedRigEntry | null;
  assignedAtSeconds: number;
  lastSeenSeconds: number;
  retainedUntilSeconds: number;
  colorSignature: string;
  matrixSignature: string;
  dirtyColor: boolean;
  dirtyMatrix: boolean;

  /**
   * Marca se o slot foi preparado fora da visão útil antes de entrar no cone
   * frontal. Slots staged podem continuar visíveis quando entram no cone; slots
   * novos não podem nascer diretamente dentro dele.
   */
  stagedOutsideVisibleCone: boolean;

  /** Último instante em que o slot recebeu um agente diferente. */
  lastTeleportSeconds: number;
};

export type HomeDriveThreePedestrianVisualPoolState = {
  capacity: number;
  slots: HomeDriveThreePedestrianVisualPoolSlot[];
  agentSlotMap: Map<string, number>;
};

export type HomeDriveThreePedestrianVisualPoolUpdateOptions = Readonly<{
  entries: readonly HomeDriveThreePedestrianInstancedRigEntry[];
  capacity: number;
  elapsedSeconds: number;

  /**
   * Compatibilidade com patches anteriores.
   * Quando `normalRetainSeconds` não vier, este valor vira a retenção normal.
   */
  retainSeconds?: number;

  /** Retenção normal para baixa/média velocidade. */
  normalRetainSeconds?: number;

  /** Retenção curta quando o carro está rápido. */
  fastRetainSeconds?: number;

  /** Centro, direção e velocidade do carro. */
  activeCenter?: HomeDriveThreePedestrianVisualPoolVector2 | null;
  activeHeadingRad?: number;
  activeSpeedMps?: number;

  /** Modo emergencial frontal. */
  frontEmergencyEnabled?: boolean;
  frontEmergencySpeedMps?: number;
  frontEmergencyStealDistanceMeters?: number;
  frontEmergencyReserveRatio?: number;
  maxEmergencyStealsPerFrame?: number;

  /**
   * Bloqueio de teleporte visível.
   * Quando false, agente novo não pode nascer diretamente dentro do cone frontal
   * útil. Ele precisa primeiro receber slot em staging, fora desse cone.
   */
  allowVisibleTeleport?: boolean;
  visibleTeleportBlockMeters?: number;
  visibleTeleportConeRadians?: number;

  /**
   * Staging: reserva uma parte do pool para agentes à frente, mas ainda fora do
   * cone frontal útil. Isso cria pessoas prontas antes de a câmera alcançá-las.
   */
  stagingSize?: number;
  stagingLeadSeconds?: number;
  maxStagingUpdatesPerFrame?: number;
  maxVisibleStealsPerFrame?: number;

  /** Permite substituir staging antigo fora do cone por candidato frontal melhor. */
  allowStagingReplacement?: boolean;
  stagingReplacementMinScoreDelta?: number;
}>;

export type HomeDriveThreePedestrianVisualPoolUpdateResult = Readonly<{
  state: HomeDriveThreePedestrianVisualPoolState;
  activeSlotIndices: readonly number[];
  dirtyColorSlotIndices: readonly number[];
  dirtyMatrixSlotIndices: readonly number[];
  releasedSlotIndices: readonly number[];
  emergencyStealSlotIndices: readonly number[];
  skippedVisibleTeleportAgentIds: readonly string[];
}>;
