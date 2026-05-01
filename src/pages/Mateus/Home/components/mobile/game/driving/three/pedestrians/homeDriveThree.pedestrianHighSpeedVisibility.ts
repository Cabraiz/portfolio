// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianHighSpeedVisibility.ts

import type {
  HomeDriveThreePedestrianHighSpeedVisibilityConfig,
  HomeDriveThreePedestrianHighSpeedVisibilityPlan,
} from "./homeDriveThree.pedestrianHighSpeedVisibility.types";

const HIGH_SPEED_START_MPS = 22;
const HIGH_SPEED_FULL_MPS = 38.9;
const DEFAULT_LEAD_SECONDS = 9.2;
const DEFAULT_RADIUS_CAP_METERS = 880;
const DEFAULT_CONE_RADIANS = 0.98;
const DEFAULT_EXTRA_ENTRY_RATIO = 0.36;
const DEFAULT_STAGING_LEAD_SECONDS = 8.4;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getHighSpeedIntensity(speedMps: number): number {
  return clamp(
    (speedMps - HIGH_SPEED_START_MPS) /
      Math.max(0.0001, HIGH_SPEED_FULL_MPS - HIGH_SPEED_START_MPS),
    0,
    1,
  );
}

export function createHomeDriveThreePedestrianHighSpeedVisibilityPlan(
  config: HomeDriveThreePedestrianHighSpeedVisibilityConfig,
): HomeDriveThreePedestrianHighSpeedVisibilityPlan {
  const enabled = config.enabled ?? true;
  const speedMps = Math.max(0, config.activeSpeedMps ?? 0);
  const speedKmh = speedMps * 3.6;
  const intensity = enabled ? getHighSpeedIntensity(speedMps) : 0;
  const isHighSpeed = intensity > 0;
  const visibleRadiusMeters = Math.max(0, config.visibleRadiusMeters);
  const mediumDetailRadiusMeters = Math.max(
    0,
    config.mediumDetailRadiusMeters,
  );
  const baseQueryRadiusMeters = Math.max(
    visibleRadiusMeters,
    mediumDetailRadiusMeters,
  );
  const leadSeconds = Math.max(
    1.2,
    config.leadSeconds ?? DEFAULT_LEAD_SECONDS,
  );
  const radiusCapMeters = Math.max(
    baseQueryRadiusMeters,
    config.radiusCapMeters ?? DEFAULT_RADIUS_CAP_METERS,
  );
  const emergencyRadiusMeters = Math.max(
    baseQueryRadiusMeters,
    config.frontEmergencyStealDistanceMeters ?? 0,
  );
  const predictiveMeters = speedMps * leadSeconds * 1.72;
  const frontPrewarmRadiusMeters = isHighSpeed
    ? clamp(
        Math.max(baseQueryRadiusMeters, emergencyRadiusMeters, predictiveMeters),
        baseQueryRadiusMeters,
        radiusCapMeters,
      )
    : baseQueryRadiusMeters;
  const coneRadians = clamp(
    config.coneRadians ?? DEFAULT_CONE_RADIANS,
    0.34,
    Math.PI * 0.76,
  );
  const extraEntryRatio = clamp(
    config.extraEntryRatio ?? DEFAULT_EXTRA_ENTRY_RATIO,
    0,
    0.82,
  );
  const baseMaxVisible = Math.max(0, Math.floor(config.maxVisiblePedestrians));
  const maxVisualPrewarmPedestrians = isHighSpeed
    ? Math.max(
        baseMaxVisible,
        Math.ceil(baseMaxVisible * (1 + extraEntryRatio * intensity)),
      )
    : baseMaxVisible;

  return {
    enabled,
    isHighSpeed,
    speedMps,
    speedKmh,
    intensity,
    visualQueryRadiusMeters: Math.max(
      baseQueryRadiusMeters,
      frontPrewarmRadiusMeters,
    ),
    frontPrewarmRadiusMeters,
    frontPrewarmConeRadians: coneRadians,
    maxVisualPrewarmPedestrians,
    stagingLeadSeconds: Math.max(
      config.stagingLeadSeconds ?? DEFAULT_STAGING_LEAD_SECONDS,
      leadSeconds * 0.82,
    ),
  };
}
