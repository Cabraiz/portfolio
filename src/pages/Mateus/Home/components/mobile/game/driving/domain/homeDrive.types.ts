// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.types.ts

import type { HomeDriveRuntimeImpactState } from "./homeDrive.impact";
import type {
  HomeDriveCameraRoadProjection,
  HomeDriveVisibleRoadSegment as WorldMapVisibleRoadSegment,
  HomeDriveWorldPosition as WorldMapPosition,
} from "./homeDrive.worldMap.types";

export type HomeDriveVector2 = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveCarState = Readonly<{
  position: HomeDriveVector2;
  headingRad: number;
  speedMps: number;
  steerAngleRad: number;
}>;

export type HomeDriveInputState = Readonly<{
  steering: number;
  throttle: number;
  brake: number;
}>;

export type HomeDriveRuntimeState = Readonly<{
  car: HomeDriveCarState;
  elapsedSeconds: number;

  /**
   * Estado transitório de colisão/impacto.
   * Opcional para manter compatibilidade com initial states antigos.
   */
  impact?: HomeDriveRuntimeImpactState;
}>;

export type HomeDriveViewportMetrics = Readonly<{
  width: number;
  height: number;
  dpr: number;
  isPortrait: boolean;
}>;

export type HomeDriveCameraState = Readonly<{
  position: HomeDriveVector2;
  headingRad: number;
  speedFactor: number;
  rollDeg: number;
  pitchDeg: number;
  horizonRatio: number;
}>;

export type HomeDriveTerrainObjectType = "tree" | "bush" | "rock" | "marker";

export type HomeDriveTerrainObject = Readonly<{
  id: string;
  type: HomeDriveTerrainObjectType;
  position: HomeDriveVector2;
  sizeMeters: number;
  rotationDeg: number;
  variant: number;
}>;

export type HomeDriveTerrainTile = Readonly<{
  id: string;
  origin: HomeDriveVector2;
  tone: number;
}>;

export type HomeDriveProjectedObject = Readonly<{
  source: HomeDriveTerrainObject;
  screenX: number;
  screenY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  widthPx: number;
  heightPx: number;
}>;

/**
 * Aliases do world-map para o módulo HomeDrive.
 * Mantém o motor livre, mas permite renderizar ruas vindas do JSON.
 *
 * Importante:
 * não declare `export type HomeDriveWorldPosition = HomeDriveWorldPosition`,
 * porque isso cria referência circular com o mesmo nome.
 */
export type HomeDriveWorldPosition = WorldMapPosition;

export type HomeDriveVisibleRoadSegment = WorldMapVisibleRoadSegment;

export type HomeDriveProjectedRoadSegment = HomeDriveCameraRoadProjection;

export type HomeDriveTerrainState = Readonly<{
  tiles: readonly HomeDriveTerrainTile[];
  objects: readonly HomeDriveTerrainObject[];
  roadSegments: readonly HomeDriveProjectedRoadSegment[];
}>;

export type HomeDriveRoadRenderTone =
  | "boulevard"
  | "urban-core"
  | "avenue"
  | "corridor"
  | string;

export type HomeDriveRoadRenderDescriptor = Readonly<{
  id: string;
  roadId: string;
  label: string;
  kind: string;
  roadTone: HomeDriveRoadRenderTone;
  laneCount: number;
  widthMeters: number;
  lengthMeters: number;
  distanceToCar: number;
  centerForward: number;
  centerRight: number;
  angleRad: number;
}>;
