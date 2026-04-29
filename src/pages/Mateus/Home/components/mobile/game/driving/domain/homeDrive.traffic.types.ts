// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.types.ts

import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";

export type HomeDriveTrafficVehicleKind =
  | "compact"
  | "hatch"
  | "sedan"
  | "sport"
  | "wagon"
  | "suv"
  | "taxi"
  | "police"
  | "van"
  | "pickup"
  | "delivery"
  | "truck"
  | "microbus"
  | "bus";

export type HomeDriveTrafficVehicleColorKey =
  | "white"
  | "silver"
  | "red"
  | "blue"
  | "yellow"
  | "black"
  | "green"
  | "orange"
  | "purple"
  | "brown"
  | "beige"
  | "cyan"
  | "darkRed"
  | "darkBlue"
  | "lime"
  | "cream"
  | "charcoal";

export type HomeDriveTrafficVector2 = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveTrafficVehicle = Readonly<{
  id: string;
  kind: HomeDriveTrafficVehicleKind;
  colorKey: HomeDriveTrafficVehicleColorKey;

  roadId: string;
  segmentId: string;
  segmentIndex: number;

  /**
   * Segmento anterior usado pelo roteador para reduzir U-turn idiota
   * em cruzamentos.
   */
  previousSegmentId: string | null;

  /**
   * Seed estável por veículo. Mantém as decisões de rota consistentes
   * sem deixar todos os carros escolherem a mesma saída.
   */
  routeSeed: number;

  /**
   * Cooldown curto depois de trocar de segmento. Ajuda a suavizar
   * decisões em cruzamentos e evita troca dupla visualmente estranha.
   */
  junctionCooldownSeconds: number;

  /**
   * Valor normalizado dentro do segmento de rua.
   * 0 = início do segmento, 1 = fim do segmento.
   */
  t: number;

  /**
   * 1 anda no sentido do segmento.
   * -1 anda no sentido contrário.
   */
  directionSign: HomeDriveTrafficDirectionSign;

  /**
   * Índice da faixa dentro do conjunto de faixas disponíveis para o sentido.
   * Em rua bidirecional, cada sentido usa apenas o seu lado da via.
   */
  laneIndex: number;

  /**
   * Offset lateral final, em metros, no eixo road.normal.
   * Esse valor é derivado de directionSign + laneIndex.
   */
  laneOffsetMeters: number;

  position: HomeDriveVector2;
  headingRad: number;

  /**
   * Velocidade instantânea usada para deslocar o NPC na rua.
   * Pode ser afetada temporariamente, mas deve recuperar até cruiseSpeedMps.
   */
  speedMps: number;

  /**
   * Velocidade normal/alvo do NPC.
   * Colisão visual não deve destruir este valor.
   */
  cruiseSpeedMps: number;

  /**
   * Aceleração de recuperação até cruiseSpeedMps.
   */
  speedRecoveryMps2: number;

  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
  collisionRadiusMeters: number;

  variant: number;
  damage: number;

  /**
   * Pequeno deslocamento temporário ao bater.
   * No tick atual ele também entra em position, então renderizadores devem evitar somar duas vezes.
   */
  impactOffset: HomeDriveTrafficVector2;
  impactVelocity: HomeDriveTrafficVector2;

  /**
   * Rotação visual temporária para a pancada parecer grotesca.
   */
  visualRollRad: number;
  visualPitchRad: number;
  visualYawOffsetRad: number;
  impactAngularVelocityRadps: number;

  lastCollisionAt: number;
}>;

export type HomeDriveTrafficRuntimeState = Readonly<{
  vehicles: readonly HomeDriveTrafficVehicle[];
  elapsedSeconds: number;
  lastCollisionAt: number;
}>;

export type HomeDriveTrafficGenerationOptions = Readonly<{
  maxVehicles?: number;
  minRoadLengthMeters?: number;
  density?: number;
}>;

export type HomeDriveTrafficTickOptions = Readonly<{
  enabled?: boolean;
}>;

export type HomeDriveTrafficCollisionEvent = Readonly<{
  id: string;
  vehicleId: string;
  position: HomeDriveVector2;
  normal: HomeDriveTrafficVector2;
  relativeSpeedMps: number;
  impulse: number;
  occurredAt: number;
}>;
