// src/pages/Mateus/Home/components/mobile/game/driving/domain/missions/homeDrive.mission.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDriveMissionDestinationId = string;

export type HomeDriveMissionStatus = "active" | "completed";

export type HomeDriveMissionDestinationKind =
  | "coast"
  | "culture"
  | "events"
  | "stadium"
  | "nightlife"
  | "resort";

export type HomeDriveMissionDestinationSourcePosition = Readonly<{
  /**
   * Eixo horizontal do mapa virtual.
   * negativo = oeste
   * positivo = leste
   */
  x: number;

  /**
   * Eixo frontal do mapa virtual.
   * negativo = litoral/orla
   * positivo = cidade/interior
   *
   * No runtime 3D isso vira z.
   */
  y: number;
}>;

export type HomeDriveMissionDestinationSource = Readonly<{
  id: HomeDriveMissionDestinationId;
  label: string;
  districtId: string;
  roadId: string;
  kind: HomeDriveMissionDestinationKind;
  position: HomeDriveMissionDestinationSourcePosition;
  radiusMeters: number;
  imageSrc: string;
  description?: string;
}>;

export type HomeDriveMissionDestination = Readonly<{
  id: HomeDriveMissionDestinationId;
  label: string;
  districtId: string;
  roadId: string;
  kind: HomeDriveMissionDestinationKind;

  /**
   * Posição normalizada para o jogo.
   * source.position.y vira position.z.
   */
  position: HomeDriveVector2;

  /**
   * Mantém a posição original do JSON para debug/edição.
   */
  sourcePosition: HomeDriveMissionDestinationSourcePosition;

  radiusMeters: number;
  imageSrc: string;
  description?: string;
}>;

export type HomeDriveMissionRoute = Readonly<{
  seed: number;
  destinationIds: readonly HomeDriveMissionDestinationId[];
}>;

export type HomeDriveMissionRuntimeState = Readonly<{
  status: HomeDriveMissionStatus;
  seed: number;
  routeDestinationIds: readonly HomeDriveMissionDestinationId[];
  activeIndex: number;
  completedDestinationIds: readonly HomeDriveMissionDestinationId[];
  activeInsideSeconds: number;
  startedAtSeconds: number;
  lastCheckInAtSeconds: number | null;
  completedAtSeconds: number | null;
}>;

export type HomeDriveMissionRuntimeTickInput = Readonly<{
  runtime: HomeDriveMissionRuntimeState;
  carPosition: HomeDriveVector2;
  elapsedSeconds: number;
  destinations?: readonly HomeDriveMissionDestination[];
  checkInHoldSeconds?: number;
}>;

export type HomeDriveMissionRuntimeTickResult = Readonly<{
  runtime: HomeDriveMissionRuntimeState;
  activeDestination: HomeDriveMissionDestination | null;
  checkedInDestination: HomeDriveMissionDestination | null;
  distanceMeters: number | null;
  isInsideCheckInRadius: boolean;
  checkInProgress: number;
}>;

export type HomeDriveMissionCompassTarget = Readonly<{
  destinationId: HomeDriveMissionDestinationId;
  label: string;
  imageSrc: string;
  distanceMeters: number;
  distanceLabel: string;
  relativeAngleRad: number;
  absoluteAngleRad: number;
  directionX: number;
  directionZ: number;
  isInsideCheckInRadius: boolean;
  checkInProgress: number;
  isBehind: boolean;
}>;

export type HomeDriveMissionCompassResolveInput = Readonly<{
  runtime: HomeDriveMissionRuntimeState;
  carPosition: HomeDriveVector2;
  carHeadingRad: number;
  destinations?: readonly HomeDriveMissionDestination[];
  checkInHoldSeconds?: number;
}>;
