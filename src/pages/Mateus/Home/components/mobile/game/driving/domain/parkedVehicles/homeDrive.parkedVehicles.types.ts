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
   * Quando true, o carro estacionado já recebeu a pancada física principal.
   * A colisão é one-shot para impedir repetir impulso no mesmo carro.
   */
  hasBeenHit: boolean;

  /**
   * Lado local atingido do veículo. -1 = esquerda, 1 = direita.
   * Usado para posicionar a chapa amassada no lado certo.
   */
  damageSide: HomeDriveParkedVehicleSide;

  /**
   * Posição longitudinal local do dano em metros.
   * Valor positivo fica mais perto da frente do veículo.
   */
  damageLocalZ: number;

  /**
   * Deslocamento visual/físico aplicado após colisão.
   * Depois da primeira pancada ele permanece afastado da vaga original.
   */
  impactOffset: HomeDriveVector2;

  /**
   * Velocidade residual usada para animar o primeiro afastamento.
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


