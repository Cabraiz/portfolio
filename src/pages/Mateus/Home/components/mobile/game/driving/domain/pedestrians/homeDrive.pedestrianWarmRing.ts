// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianWarmRing.ts

import type {
  HomeDrivePedestrianWarmRingConfig,
  HomeDrivePedestrianWarmRingSectorKey,
  HomeDrivePedestrianWarmRingSnapshot,
  HomeDrivePedestrianWarmRingZone,
} from "./homeDrive.pedestrianWarmRing.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

const DEFAULT_BASE_RADIUS_METERS = 860;
const DEFAULT_FRONT_BIAS_METERS = 900;
const DEFAULT_SPEED_RADIUS_MULTIPLIER = 52;
const DEFAULT_SIDE_RADIUS_METERS = 560;
const DEFAULT_REAR_RADIUS_METERS = 190;
const DEFAULT_MAX_ZONE_COUNT = 188;
const DEFAULT_MIN_ZONE_LENGTH_METERS = 8;
const HIGH_SPEED_START_MPS = 22;
const EXTREME_SPEED_MPS = 32;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getHighSpeedIntensity(speedMps: number): number {
  return clamp((speedMps - HIGH_SPEED_START_MPS) / 18, 0, 1);
}

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return Math.sqrt(dx * dx + dz * dz);
}

function getWarmRingSectorKey(params: Readonly<{
  forwardMeters: number;
  lateralMeters: number;
  frontRadiusMeters: number;
  sideRadiusMeters: number;
  rearRadiusMeters: number;
}>): HomeDrivePedestrianWarmRingSectorKey | null {
  if (params.forwardMeters >= 0) {
    if (
      params.forwardMeters <= params.frontRadiusMeters &&
      Math.abs(params.lateralMeters) <= params.sideRadiusMeters
    ) {
      return params.forwardMeters >= params.frontRadiusMeters * 0.52
        ? "front-far"
        : "front";
    }

    return null;
  }

  if (
    Math.abs(params.forwardMeters) <= params.rearRadiusMeters &&
    Math.abs(params.lateralMeters) <= params.sideRadiusMeters * 0.72
  ) {
    return "rear";
  }

  if (
    Math.abs(params.forwardMeters) <= params.sideRadiusMeters * 0.68 &&
    Math.abs(params.lateralMeters) <= params.sideRadiusMeters
  ) {
    return "side";
  }

  return null;
}

function getZoneScore(params: Readonly<{
  sectorKey: HomeDrivePedestrianWarmRingSectorKey;
  distanceMeters: number;
  forwardMeters: number;
  lateralMeters: number;
  zoneLengthMeters: number;
  activeSpeedMps: number;
}>): number {
  const highSpeedIntensity = getHighSpeedIntensity(params.activeSpeedMps);
  const sectorBias: Record<HomeDrivePedestrianWarmRingSectorKey, number> = {
    front: -82 - highSpeedIntensity * 22,
    "front-far": -76 - highSpeedIntensity * 48,
    side: 92 + highSpeedIntensity * 30,
    rear: 178 + highSpeedIntensity * 64,
  };
  const lateralPenalty = Math.abs(params.lateralMeters) * (0.34 + highSpeedIntensity * 0.08);
  const lengthBonus = Math.min(48, params.zoneLengthMeters * 0.09);

  return (
    sectorBias[params.sectorKey] +
    params.distanceMeters +
    lateralPenalty -
    lengthBonus +
    Math.max(0, -params.forwardMeters) * 0.14
  );
}

function createEmptySnapshot(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  config: HomeDrivePedestrianWarmRingConfig,
): HomeDrivePedestrianWarmRingSnapshot {
  const activeHeadingRad = config.activeHeadingRad ?? 0;
  const activeSpeedMps = Math.max(0, config.activeSpeedMps ?? 0);
  const elapsedSeconds = Math.max(0, config.elapsedSeconds ?? 0);
  const baseRadiusMeters = Math.max(
    96,
    config.baseRadiusMeters ?? DEFAULT_BASE_RADIUS_METERS,
  );

  return {
    id: [
      Math.round(config.activeCenter.x),
      Math.round(config.activeCenter.z),
      Math.round(activeHeadingRad * 1000),
      Math.round(activeSpeedMps * 10),
      zones.length,
    ].join(":"),
    enabled: false,
    activeCenter: config.activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds,
    radiusMeters: baseRadiusMeters,
    frontRadiusMeters: baseRadiusMeters,
    sideRadiusMeters: Math.max(80, config.sideRadiusMeters ?? DEFAULT_SIDE_RADIUS_METERS),
    rearRadiusMeters: Math.max(40, config.rearRadiusMeters ?? DEFAULT_REAR_RADIUS_METERS),
    warmZones: [],
    warmZoneIds: [],
    sectorCounts: {
      front: 0,
      "front-far": 0,
      side: 0,
      rear: 0,
    },
    recommendedPopulateRadiusMeters: baseRadiusMeters,
    recommendedLocalZoneSearchRadiusMeters: baseRadiusMeters,
    recommendedKeepAliveRadiusMeters: baseRadiusMeters * 1.65,
    recommendedSpawnBudgetBoost: 0,
    recommendedVisualPrewarmRadiusMeters: baseRadiusMeters,
  };
}

export function createHomeDrivePedestrianWarmRingSnapshot(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  config: HomeDrivePedestrianWarmRingConfig,
): HomeDrivePedestrianWarmRingSnapshot {
  if (!config.enabled || zones.length <= 0) {
    return createEmptySnapshot(zones, config);
  }

  const activeHeadingRad = config.activeHeadingRad ?? 0;
  const activeSpeedMps = Math.max(0, config.activeSpeedMps ?? 0);
  const highSpeedIntensity = getHighSpeedIntensity(activeSpeedMps);
  const elapsedSeconds = Math.max(0, config.elapsedSeconds ?? 0);
  const baseRadiusMeters = Math.max(
    96,
    config.baseRadiusMeters ?? DEFAULT_BASE_RADIUS_METERS,
  );
  const speedRadiusMultiplier = Math.max(
    0,
    config.speedRadiusMultiplier ?? DEFAULT_SPEED_RADIUS_MULTIPLIER,
  );
  const frontBiasMeters = Math.max(
    0,
    config.frontBiasMeters ?? DEFAULT_FRONT_BIAS_METERS,
  );
  const speedBoostMeters = activeSpeedMps * speedRadiusMultiplier * (1 + highSpeedIntensity * 0.16);
  const logicalFrontCapMeters = baseRadiusMeters <= 820 ? 2250 : 3050;
  const visualPrewarmCapMeters = baseRadiusMeters <= 820 ? 860 : 1120;
  const frontRadiusMeters = clamp(
    baseRadiusMeters + frontBiasMeters + speedBoostMeters,
    baseRadiusMeters,
    activeSpeedMps >= EXTREME_SPEED_MPS
      ? logicalFrontCapMeters
      : Math.min(logicalFrontCapMeters, baseRadiusMeters * 3.05),
  );
  const sideRadiusMeters = Math.max(
    80,
    (config.sideRadiusMeters ?? DEFAULT_SIDE_RADIUS_METERS) * (1 + highSpeedIntensity * 0.06),
  );
  const rearRadiusMeters = Math.max(
    40,
    config.rearRadiusMeters ?? DEFAULT_REAR_RADIUS_METERS,
  );
  const maxZoneCount = Math.max(
    8,
    Math.floor((config.maxZoneCount ?? DEFAULT_MAX_ZONE_COUNT) * (1 + highSpeedIntensity * 0.12)),
  );
  const minZoneLengthMeters = Math.max(
    0,
    config.minZoneLengthMeters ?? DEFAULT_MIN_ZONE_LENGTH_METERS,
  );

  const forwardX = Math.sin(activeHeadingRad);
  const forwardZ = Math.cos(activeHeadingRad);
  const rightX = Math.cos(activeHeadingRad);
  const rightZ = -Math.sin(activeHeadingRad);

  const warmZones = zones
    .map<HomeDrivePedestrianWarmRingZone | null>((zone) => {
      if (zone.lengthMeters < minZoneLengthMeters) {
        return null;
      }

      const dx = zone.center.x - config.activeCenter.x;
      const dz = zone.center.z - config.activeCenter.z;
      const forwardMeters = dx * forwardX + dz * forwardZ;
      const lateralMeters = dx * rightX + dz * rightZ;
      const distanceMeters = getDistanceMeters(zone.center, config.activeCenter);
      const sectorKey = getWarmRingSectorKey({
        forwardMeters,
        lateralMeters,
        frontRadiusMeters,
        sideRadiusMeters,
        rearRadiusMeters,
      });

      if (!sectorKey) {
        return null;
      }

      return {
        zone,
        zoneId: zone.id,
        sectorKey,
        distanceMeters,
        forwardMeters,
        lateralMeters,
        score: getZoneScore({
          sectorKey,
          distanceMeters,
          forwardMeters,
          lateralMeters,
          zoneLengthMeters: zone.lengthMeters,
          activeSpeedMps,
        }),
        visualPriority:
          sectorKey === "front"
            ? 0
            : sectorKey === "front-far"
              ? 0.12
              : sectorKey === "side"
                ? 2.2
                : 4.4,
        prewarmWeight: Math.max(
          sectorKey === "front" || sectorKey === "front-far" ? 0.78 : 0.32,
          1 - distanceMeters / Math.max(1, frontRadiusMeters + sideRadiusMeters),
        ),
      };
    })
    .filter((zone): zone is HomeDrivePedestrianWarmRingZone => Boolean(zone))
    .sort((first, second) => {
      if (Math.abs(first.score - second.score) > 0.0001) {
        return first.score - second.score;
      }

      return first.zoneId.localeCompare(second.zoneId);
    })
    .slice(0, maxZoneCount);

  const sectorCounts: Record<HomeDrivePedestrianWarmRingSectorKey, number> = {
    front: 0,
    "front-far": 0,
    side: 0,
    rear: 0,
  };

  warmZones.forEach((zone) => {
    sectorCounts[zone.sectorKey] += 1;
  });

  const warmZoneIds = warmZones
    .map((zone) => zone.zoneId)
    .sort((first, second) => first.localeCompare(second));
  const radiusMeters = Math.max(frontRadiusMeters, sideRadiusMeters, rearRadiusMeters);
  const planId = [
    Math.round(config.activeCenter.x / 8),
    Math.round(config.activeCenter.z / 8),
    Math.round(activeHeadingRad * 64),
    Math.round(activeSpeedMps * 4),
    warmZoneIds.length,
    Math.round(elapsedSeconds * 2),
  ].join(":");
  const visualRadiusMeters = clamp(
    Math.max(baseRadiusMeters, frontRadiusMeters * 0.42, activeSpeedMps * 19),
    baseRadiusMeters,
    visualPrewarmCapMeters,
  );

  return {
    id: planId,
    enabled: true,
    activeCenter: config.activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    elapsedSeconds,
    radiusMeters,
    frontRadiusMeters,
    sideRadiusMeters,
    rearRadiusMeters,
    warmZones,
    warmZoneIds,
    sectorCounts,
    recommendedPopulateRadiusMeters: Math.max(baseRadiusMeters, frontRadiusMeters * 0.82),
    recommendedLocalZoneSearchRadiusMeters: Math.max(
      radiusMeters,
      frontRadiusMeters + sideRadiusMeters * 0.64,
    ),
    recommendedKeepAliveRadiusMeters: Math.max(
      radiusMeters * (1.62 + highSpeedIntensity * 0.18),
      frontRadiusMeters + rearRadiusMeters,
    ),
    recommendedSpawnBudgetBoost: Math.min(360, Math.max(0, warmZones.length * (2.05 + highSpeedIntensity * 0.42))),
    recommendedVisualPrewarmRadiusMeters: visualRadiusMeters,
  };
}
