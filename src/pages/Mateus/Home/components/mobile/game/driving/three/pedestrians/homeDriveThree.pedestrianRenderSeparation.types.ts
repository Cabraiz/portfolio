// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderSeparation.types.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";

export type HomeDriveThreePedestrianRenderSeparationSourceEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  distanceMeters?: number;
  distanceSquared?: number;
  visibilityRank?: number;
}>;

export type HomeDriveThreePedestrianRenderSeparationConfig = Readonly<{
  /** Liga/desliga separaÃ§Ã£o visual sem mexer na simulaÃ§Ã£o lÃ³gica ou no commit. */
  enabled?: boolean;

  /** Tamanho da cÃ©lula usada para procurar sobreposiÃ§Ã£o local. */
  cellSizeMeters?: number;

  /** DistÃ¢ncia visual mÃ­nima desejada entre raÃ­zes de pedestres. */
  minSeparationMeters?: number;

  /** Offset mÃ¡ximo permitido para nÃ£o tirar a pessoa da calÃ§ada visualmente. */
  maxOffsetMeters?: number;

  /** Quantidade de tentativas em anÃ©is ao redor da posiÃ§Ã£o original. */
  candidateCount?: number;

  /** Quanto a separaÃ§Ã£o enfraquece no fim do raio mÃ©dio. */
  distanceFadeStartMeters?: number;

  /** DistÃ¢ncia mÃ¡xima considerada para manter separaÃ§Ã£o ativa. */
  distanceFadeEndMeters?: number;
}>;

export type HomeDriveThreePedestrianRenderOffset = Readonly<{
  x: number;
  z: number;
  magnitudeMeters: number;
  collisionCount: number;
}>;

export type HomeDriveThreePedestrianRenderSeparationFrame = Readonly<{
  offsetsByAgentId: ReadonlyMap<string, HomeDriveThreePedestrianRenderOffset>;
  separatedCount: number;
  maxOffsetMeters: number;
}>;

export type HomeDriveThreePedestrianRenderSeparationCandidate = Readonly<{
  agentId: string;
  x: number;
  z: number;
  distanceMeters: number;
  visibilityRank: number;
  originalIndex: number;
}>;
