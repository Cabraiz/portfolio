// src/pages/Mateus/Home/components/mobile/game/driving/domain/crosswalks/homeDrive.crosswalks.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";

export type HomeDriveCrosswalkSignalPhase =
  | "walk"
  | "wait"
  | "danger"
  | "off";

export type HomeDriveCrosswalkKind =
  | "zebra"
  | "double-zebra"
  | "avenue-zebra"
  | "school"
  | "commercial";

export type HomeDriveCrosswalkSide = -1 | 1;

export type HomeDriveCrosswalkPedestrianDirection = -1 | 1;

export type HomeDriveCrosswalk = Readonly<{
  id: string;
  roadId: string;
  segmentId: string;
  segmentIndex: number;
  districtId: string;
  roadKind: HomeDriveGeneratedRoadSegment["kind"];

  kind: HomeDriveCrosswalkKind;
  signalPhase: HomeDriveCrosswalkSignalPhase;

  /**
   * Centro da faixa no eixo da rua.
   */
  position: HomeDriveVector2;

  /**
   * Direção longitudinal da rua.
   */
  roadDirection: HomeDriveVector2;

  /**
   * Normal lateral da rua.
   */
  roadNormal: HomeDriveVector2;

  /**
   * Comprimento no eixo da rua.
   * Em zebra crossing, é a espessura visual da faixa ao longo da pista.
   */
  lengthMeters: number;

  /**
   * Largura atravessando a rua/calçada a calçada.
   */
  widthMeters: number;

  /**
   * Largura real do asfalto.
   */
  roadWidthMeters: number;

  /**
   * Margem fora da pista para iniciar/terminar a travessia na calçada.
   */
  sidewalkReachMeters: number;

  /**
   * Quantidade de listras brancas.
   */
  stripeCount: number;

  /**
   * Largura longitudinal de cada listra.
   */
  stripeLengthMeters: number;

  /**
   * Largura lateral de cada listra.
   */
  stripeWidthMeters: number;

  /**
   * Offset normalizado 0..1 dentro do segmento.
   */
  t: number;

  /**
   * Ponto no lado -normal da rua.
   */
  sideA: HomeDriveVector2;

  /**
   * Ponto no lado +normal da rua.
   */
  sideB: HomeDriveVector2;

  /**
   * Seed determinística para variação visual/comportamental.
   */
  seed: number;

  /**
   * Força de uso por pedestres.
   */
  pedestrianDemand: number;

  /**
   * Sinaliza se carros devem dar preferência quando houver pedestre atravessando.
   */
  hasYieldControl: boolean;
}>;

export type HomeDriveCrosswalkPedestrianOccupancy = Readonly<{
  pedestrianId: string;
  crosswalkId: string;
  direction: HomeDriveCrosswalkPedestrianDirection;
  progress: number;
  startedAtSeconds: number;
  estimatedDurationSeconds: number;
}>;

export type HomeDriveCrosswalkRuntimeState = Readonly<{
  crosswalks: readonly HomeDriveCrosswalk[];
  occupancies: readonly HomeDriveCrosswalkPedestrianOccupancy[];
  elapsedSeconds: number;
}>;

export type HomeDriveCrosswalkGenerationOptions = Readonly<{
  maxCrosswalks?: number;
  minRoadLengthMeters?: number;
  density?: number;
  seed?: number;
}>;

export type HomeDriveCrosswalkTickOptions = Readonly<{
  enabled?: boolean;
}>;

export type HomeDriveCrosswalkSignalTiming = Readonly<{
  walkSeconds: number;
  waitSeconds: number;
  dangerSeconds: number;
  offsetSeconds: number;
}>;

export type HomeDriveCrosswalkQueryResult = Readonly<{
  crosswalk: HomeDriveCrosswalk;
  distanceMeters: number;
  side: HomeDriveCrosswalkSide;
}>;
