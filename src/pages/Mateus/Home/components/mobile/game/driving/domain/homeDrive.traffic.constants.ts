// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.constants.ts

import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";

/**
 * 4x do teto antigo:
 * antes: 176
 * agora: 704
 */
export const DEFAULT_MAX_TRAFFIC_VEHICLES = 520;

/**
 * Permite popular ruas um pouco menores.
 */
export const DEFAULT_MIN_ROAD_LENGTH_METERS = 64;

/**
 * Densidade alta, mas ainda controlada pelo roadChance e pelo espaçamento.
 */
export const DEFAULT_TRAFFIC_DENSITY = 2.15;

/**
 * Aumenta o tamanho visual dos carros.
 *
 * 1.00 = tamanho antigo
 * 1.35 = maior, mas ainda normal
 * 1.65 = grande
 * 2.00+ = grotesco
 */
export const TRAFFIC_VEHICLE_SIZE_MULTIPLIER = 1.25;

/**
 * Antes estava alto demais para 4x tráfego.
 *
 * Quanto menor, mais slots por rua.
 * 0.42 deixa a rua bem mais populada sem ficar 100% congestionada.
 */
export const TRAFFIC_VEHICLE_SPACING_MULTIPLIER = 0.62;

/**
 * A colisão já cresce porque usa width/length escalados.
 * Este multiplicador deixa a hitbox um pouco mais coerente com o visual grande.
 */
export const TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER = 1.08;

export const IMPACT_OFFSET_DECAY_PER_SECOND = 3.1;
export const IMPACT_VELOCITY_DECAY_PER_SECOND = 4.35;
export const IMPACT_ROTATION_DECAY_PER_SECOND = 5.2;
export const IMPACT_ANGULAR_DECAY_PER_SECOND = 4.6;

export const DEFAULT_TRAFFIC_SPEED_RECOVERY_MPS2 = 6.4;
export const MIN_TRAFFIC_CRUISE_SPEED_MPS = 6;
export const MAX_TRAFFIC_CRUISE_SPEED_MPS = 26;

export const JUNCTION_COOLDOWN_SECONDS = 0.34;
export const MIN_ROAD_LENGTH_METERS = 0.000001;

export const TRAFFIC_CROSSWALK_LOOKAHEAD_METERS = 58;
export const TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS = 9.5;
export const TRAFFIC_CROSSWALK_MAX_FULL_STOP_SECONDS = 3.8;
export const TRAFFIC_CROSSWALK_CREEP_SPEED_FACTOR = 0.18;
export const TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS = 3.85;
export const TRAFFIC_LANE_CHANGE_COMPLETE_EPSILON_METERS = 0.09;
export const TRAFFIC_LANE_CHANGE_COMPLETE_COOLDOWN_SECONDS = 1.1;

export const TRAFFIC_RECYCLE_PLACEMENT_ATTEMPTS = 18;
export const TRAFFIC_RECYCLE_MIN_WORLD_GAP_METERS = 13.5;
export const TRAFFIC_RECYCLE_TARGET_T_MARGIN = 0.08;
export const TRAFFIC_CONGESTION_T_MARGIN = 0.024;
export const TRAFFIC_CONGESTION_STUCK_SPEED_RECOVERY_RATIO = 0.72;
export const TRAFFIC_CONGESTION_STUCK_RECOVERY_MIN_MPS = 3.2;

export type CrosswalkYieldResolution = Readonly<{
  speedFactor: number;
  crosswalkId: string | null;
}>;

export type TrafficSpeedProfile = Readonly<{
  minFactor: number;
  maxFactor: number;
  minMps: number;
  maxMps: number;
  accelerationMinMps2: number;
  accelerationMaxMps2: number;
  jitterMps: number;
}>;

export type TrafficVehicleCandidate = Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  priority: number;
  segmentLengthMeters: number;
}>;

export type TrafficVehicleDimensions = Readonly<{
  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
}>;
