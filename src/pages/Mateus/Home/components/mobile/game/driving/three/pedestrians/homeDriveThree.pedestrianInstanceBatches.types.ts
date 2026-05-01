// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstanceBatches.types.ts

import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRole,
} from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianDetailLevel } from "./HomeDriveThreePedestrianAgent";

export type HomeDriveThreePedestrianInstancedRigDetailLevel =
  | "medium"
  | "proxy";

export type HomeDriveThreePedestrianInstancedRigEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  detailLevel: HomeDriveThreePedestrianInstancedRigDetailLevel;
  distanceSquared?: number;
  distanceMeters?: number;
  visibilityRank?: number;

  /** Ordem original antes da normalização. Ajuda o pool visual a manter estabilidade. */
  sourceIndex?: number;

  /** Chave estável usada para desempate sem depender somente de distância. */
  stableKey: string;

  /** Prioridade menor = mais importante para permanecer no pool residente. */
  poolPriority: number;
}>;

export type HomeDriveThreePedestrianInstanceBatchKey =
  | `${HomeDrivePedestrianRole}:${HomeDriveThreePedestrianInstancedRigDetailLevel}`
  | `generic:${HomeDriveThreePedestrianInstancedRigDetailLevel}`;

export type HomeDriveThreePedestrianInstanceBatch = Readonly<{
  key: HomeDriveThreePedestrianInstanceBatchKey;
  role: HomeDrivePedestrianRole | "generic";
  detailLevel: HomeDriveThreePedestrianInstancedRigDetailLevel;
  entries: readonly HomeDriveThreePedestrianInstancedRigEntry[];
}>;

export type HomeDriveThreePedestrianInstanceBatchOptions = Readonly<{
  maxInstances?: number;
  preferNearest?: boolean;

  /** Quando true, o desempate final sempre preserva agent.id para reduzir churn visual. */
  preferStableAgentOrder?: boolean;
}>;

export type HomeDriveThreePedestrianInstanceSourceEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  detailLevel: HomeDriveThreePedestrianDetailLevel | string;
  distanceSquared?: number;
  distanceMeters?: number;
  visibilityRank?: number;
}>;
