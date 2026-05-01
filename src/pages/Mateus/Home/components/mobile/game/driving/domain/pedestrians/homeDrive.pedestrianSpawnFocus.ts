// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSpawnFocus.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";
import {
  HOME_DRIVE_PEDESTRIAN_CROWD_TUNING,
  getHomeDrivePedestrianDistanceMeters,
} from "./homeDrive.pedestrianCrowdTuning";

export type HomeDrivePedestrianSpawnFocusOptions = Readonly<{
  center?: HomeDriveVector2;
  radiusMeters?: number;
  pedestrianRatio?: number;
  maxPedestrians?: number;
}>;

export type HomeDrivePedestrianSpawnFocusResult = Readonly<{
  enabled: boolean;
  distanceMeters: number;
  normalizedDistance: number;
  weight: number;
  priorityBoost: number;
  insideHardRadius: boolean;
  insideSoftRadius: boolean;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const ratio = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);

  return ratio * ratio * (3 - 2 * ratio);
}

function getDistanceToSegmentMeters(
  point: HomeDriveVector2,
  from: HomeDriveVector2,
  to: HomeDriveVector2,
): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared <= 0.000001) {
    return getHomeDrivePedestrianDistanceMeters(point, from);
  }

  const t = clamp(
    ((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared,
    0,
    1,
  );

  return getHomeDrivePedestrianDistanceMeters(point, {
    x: from.x + dx * t,
    z: from.z + dz * t,
  });
}

export function normalizeHomeDrivePedestrianSpawnFocusOptions(
  options: HomeDrivePedestrianSpawnFocusOptions = {},
): Required<HomeDrivePedestrianSpawnFocusOptions> & Readonly<{ enabled: boolean }> {
  const center = options.center ?? { x: 0, z: 0 };
  const radiusMeters = Math.max(
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.minRadiusMeters,
    options.radiusMeters ??
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.defaultRadiusMeters,
  );
  const pedestrianRatio = clamp(
    options.pedestrianRatio ??
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.defaultPedestrianRatio,
    0,
    0.92,
  );
  const maxPedestrians = Math.max(
    0,
    Math.floor(
      options.maxPedestrians ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.maxPedestriansLandscape,
    ),
  );

  return {
    enabled: Boolean(options.center) && pedestrianRatio > 0 && maxPedestrians > 0,
    center,
    radiusMeters,
    pedestrianRatio,
    maxPedestrians,
  };
}

export function getHomeDrivePedestrianZoneDistanceToSpawnFocus(
  zone: HomeDrivePedestrianSidewalkZone,
  center: HomeDriveVector2,
): number {
  /**
   * Usa distância até o segmento da calçada, não só até o centro.
   * Isso é essencial para ruas compridas: o carro pode estar perto de uma ponta
   * mesmo quando o centro da zona está longe.
   */
  return getDistanceToSegmentMeters(center, zone.from, zone.to);
}

export function getHomeDrivePedestrianSpawnFocusForZone(
  zone: HomeDrivePedestrianSidewalkZone,
  options: HomeDrivePedestrianSpawnFocusOptions = {},
): HomeDrivePedestrianSpawnFocusResult {
  const normalizedOptions = normalizeHomeDrivePedestrianSpawnFocusOptions(options);

  if (!normalizedOptions.enabled) {
    return {
      enabled: false,
      distanceMeters: Number.POSITIVE_INFINITY,
      normalizedDistance: Number.POSITIVE_INFINITY,
      weight: 0,
      priorityBoost: 0,
      insideHardRadius: false,
      insideSoftRadius: false,
    };
  }

  const distanceMeters = getHomeDrivePedestrianZoneDistanceToSpawnFocus(
    zone,
    normalizedOptions.center,
  );
  const normalizedDistance = distanceMeters / normalizedOptions.radiusMeters;
  const hardRatio = HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.nearZoneDistanceMultiplier;
  const softRatio = 1;
  const insideHardRadius = normalizedDistance <= hardRatio;
  const insideSoftRadius = normalizedDistance <= softRatio;
  const falloff = 1 - smoothstep(hardRatio, softRatio, normalizedDistance);
  const weight = clamp(insideHardRadius ? 1 : falloff, 0, 1);

  return {
    enabled: true,
    distanceMeters,
    normalizedDistance,
    weight,
    priorityBoost: weight * HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.priorityBoost,
    insideHardRadius,
    insideSoftRadius,
  };
}

export function shouldReserveHomeDrivePedestrianSlotForSpawnFocus(
  acceptedFocusPedestrians: number,
  acceptedTotalPedestrians: number,
  options: HomeDrivePedestrianSpawnFocusOptions = {},
): boolean {
  const normalizedOptions = normalizeHomeDrivePedestrianSpawnFocusOptions(options);

  if (!normalizedOptions.enabled) {
    return false;
  }

  if (acceptedFocusPedestrians >= normalizedOptions.maxPedestrians) {
    return false;
  }

  const targetFocusCount = Math.floor(
    Math.max(1, acceptedTotalPedestrians + 1) * normalizedOptions.pedestrianRatio,
  );

  return acceptedFocusPedestrians <= targetFocusCount;
}

export function getHomeDrivePedestrianSpawnFocusProgressPaddingRatio(
  zone: HomeDrivePedestrianSidewalkZone,
): number {
  const paddingMeters =
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.nearSlotProgressPaddingMeters;

  return clamp(paddingMeters / Math.max(1, zone.lengthMeters), 0.04, 0.32);
}
