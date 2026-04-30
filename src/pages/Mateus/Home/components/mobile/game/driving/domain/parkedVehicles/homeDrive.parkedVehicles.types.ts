// src/pages/Mateus/Home/components/mobile/game/driving/domain/parkedVehicles/homeDrive.parkedVehicles.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveVehicleModelKey,
  HomeDriveVehiclePaintKey,
} from "../vehicles";

export type HomeDriveParkedVehicleSide = -1 | 1;

export type HomeDriveParkedVehicleMode =
  | "curb-parallel"
  | "half-sidewalk"
  | "sidewalk-invasive"
  | "driveway-front"
  | "delivery-stop";

export type HomeDriveParkedVehicle = Readonly<{
  id: string;
  roadId: string;
  segmentId: string;
  segmentIndex: number;
  districtId: string;
  roadKind: string;

  modelKey: HomeDriveVehicleModelKey;
  paintKey: HomeDriveVehiclePaintKey;
  mode: HomeDriveParkedVehicleMode;

  position: HomeDriveVector2;
  headingRad: number;
  side: HomeDriveParkedVehicleSide;

  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;

  /**
   * Hitbox circular de gameplay.
   * Não precisa ser igual à geometria visual; deve ser estável e previsível.
   */
  collisionRadiusMeters: number;

  /**
   * Massa aproximada para colisão.
   * Usado para calcular quanto o carro parado se move ao ser atingido.
   */
  massKg: number;

  /**
   * 0 = intacto
   * 1 = muito danificado
   */
  damage: number;

  /**
   * Deslocamento transitório aplicado após colisão.
   * A posição base continua sendo a vaga original.
   */
  impactOffset: HomeDriveVector2;

  /**
   * Velocidade transitória do impacto.
   */
  impactVelocity: HomeDriveVector2;

  /**
   * Rotação visual transitória.
   */
  visualRollRad: number;
  visualPitchRad: number;
  visualYawOffsetRad: number;
  impactAngularVelocityRadps: number;

  /**
   * Usado para cooldown de colisão.
   */
  lastCollisionAt: number;

  t: number;
  seed: number;
}>;

export type HomeDriveParkedVehicleRuntimeState = Readonly<{
  vehicles: readonly HomeDriveParkedVehicle[];
  seed: number;
}>;

export type HomeDriveParkedVehicleGenerationOptions = Readonly<{
  enabled?: boolean;
  maxVehicles?: number;
  density?: number;
  minRoadLengthMeters?: number;
  maxRoads?: number;
  seed?: number;
}>;

export type HomeDriveParkedVehicleQueryResult = Readonly<{
  vehicle: HomeDriveParkedVehicle;
  distanceMeters: number;
}>;
