// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPrewarm.ts

import type {
  HomeDrivePedestrianPrewarmOptions,
  HomeDrivePedestrianPrewarmPlan,
} from "./homeDrive.pedestrianPrewarm.types";

const DEFAULT_PREWARM_FRAMES = 12;
const DEFAULT_PREWARM_LEAD_SECONDS = 10.5;
const DEFAULT_PREWARM_FRONT_METERS = 2200;
const DEFAULT_PREWARM_MIN_READY_PEDESTRIANS = 620;
const DEFAULT_PREWARM_SPAWN_BUDGET_MULTIPLIER = 3.15;
const HIGH_SPEED_START_MPS = 22;
const EXTREME_SPEED_MPS = 32;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getHighSpeedPrewarmIntensity(speedMps: number): number {
  return clamp((speedMps - HIGH_SPEED_START_MPS) / 18, 0, 1);
}

function getPredictiveLeadMeters(speedMps: number, leadSeconds: number): number {
  const intensity = getHighSpeedPrewarmIntensity(speedMps);
  const multiplier = speedMps >= EXTREME_SPEED_MPS ? 5.4 : 3.8 + intensity * 1.1;

  return speedMps * leadSeconds * multiplier;
}

function countReadyPedestrians(options: HomeDrivePedestrianPrewarmOptions): number {
  const activeHeadingRad = options.activeHeadingRad ?? 0;
  const forwardX = Math.sin(activeHeadingRad);
  const forwardZ = Math.cos(activeHeadingRad);
  const rightX = Math.cos(activeHeadingRad);
  const rightZ = -Math.sin(activeHeadingRad);
  const speed = Math.max(0, options.activeSpeedMps);
  const intensity = getHighSpeedPrewarmIntensity(speed);
  const warmRing = options.warmRingSnapshot;
  const frontMeters = Math.max(
    options.populateRadiusMeters,
    options.frontMeters ?? DEFAULT_PREWARM_FRONT_METERS,
    warmRing?.recommendedVisualPrewarmRadiusMeters ?? 0,
  );
  const sideMeters = Math.max(90, frontMeters * (0.48 + intensity * 0.1));
  const radialRadiusMeters = Math.max(
    options.populateRadiusMeters,
    warmRing?.recommendedPopulateRadiusMeters ?? 0,
    speed >= HIGH_SPEED_START_MPS
      ? Math.min(frontMeters * 0.72, options.populateRadiusMeters * 3.15)
      : options.populateRadiusMeters,
  );
  const radialRadiusSquared = radialRadiusMeters * radialRadiusMeters;

  return options.agents.reduce((total, agent) => {
    const radialReady =
      getDistanceSquared(agent.position, options.activeCenter) <=
      radialRadiusSquared;

    if (radialReady) {
      return total + 1;
    }

    const dx = agent.position.x - options.activeCenter.x;
    const dz = agent.position.z - options.activeCenter.z;
    const forwardMeters = dx * forwardX + dz * forwardZ;
    const lateralMeters = Math.abs(dx * rightX + dz * rightZ);
    const frontReady =
      forwardMeters >= -16 &&
      forwardMeters <= frontMeters &&
      lateralMeters <= sideMeters;

    return frontReady ? total + 1 : total;
  }, 0);
}

export function createHomeDrivePedestrianPrewarmPlan(
  options: HomeDrivePedestrianPrewarmOptions,
): HomeDrivePedestrianPrewarmPlan {
  const enabled = options.enabled ?? true;
  const speed = Math.max(0, options.activeSpeedMps);
  const highSpeedIntensity = getHighSpeedPrewarmIntensity(speed);
  const prewarmFrames = Math.max(
    1,
    Math.floor(options.prewarmFrames ?? DEFAULT_PREWARM_FRAMES),
  );
  const leadSeconds = Math.max(
    0.8,
    options.leadSeconds ?? DEFAULT_PREWARM_LEAD_SECONDS,
  );
  const baseFrontMeters = Math.max(
    options.populateRadiusMeters,
    options.frontMeters ?? DEFAULT_PREWARM_FRONT_METERS,
  );
  const minReadyPedestrians = Math.max(
    0,
    Math.floor(
      options.minReadyPedestrians ?? DEFAULT_PREWARM_MIN_READY_PEDESTRIANS,
    ),
  );
  const spawnBudgetMultiplier = Math.max(
    1,
    options.spawnBudgetMultiplier ?? DEFAULT_PREWARM_SPAWN_BUDGET_MULTIPLIER,
  );
  const warmRing = options.warmRingSnapshot;
  const highSpeedFrontCapMeters = Math.max(
    baseFrontMeters,
    speed >= EXTREME_SPEED_MPS ? baseFrontMeters * 1.18 : baseFrontMeters * 1.08,
    warmRing?.frontRadiusMeters ?? 0,
  );

  const speedLeadMeters = getPredictiveLeadMeters(speed, leadSeconds);
  const frameLeadMeters = speed * prewarmFrames * (1.8 + highSpeedIntensity * 0.9);
  const effectiveFrontLookaheadMeters = clamp(
    Math.max(
      baseFrontMeters,
      speedLeadMeters,
      frameLeadMeters,
      warmRing?.recommendedVisualPrewarmRadiusMeters ?? 0,
    ),
    options.populateRadiusMeters,
    Math.max(highSpeedFrontCapMeters, baseFrontMeters),
  );
  const readyPedestrianCount = countReadyPedestrians({
    ...options,
    frontMeters: effectiveFrontLookaheadMeters,
  });
  const speedBoost = clamp(1 + speed / 15 + highSpeedIntensity * 0.55, 1, 3.35);
  const frontBoost = speed >= HIGH_SPEED_START_MPS ? 1.46 + highSpeedIntensity * 0.28 : 1;
  const effectivePopulateRadiusMeters = Math.max(
    options.populateRadiusMeters,
    effectiveFrontLookaheadMeters * 0.86,
    warmRing?.recommendedPopulateRadiusMeters ?? 0,
    warmRing?.recommendedVisualPrewarmRadiusMeters ?? 0,
  );
  const effectiveLocalZoneSearchRadiusMeters = Math.max(
    options.localZoneSearchRadiusMeters,
    effectiveFrontLookaheadMeters * 1.18,
    effectivePopulateRadiusMeters * 1.16,
    warmRing?.recommendedLocalZoneSearchRadiusMeters ?? 0,
  );
  const effectiveKeepAliveRadiusMeters = Math.max(
    options.keepAliveRadiusMeters,
    effectiveLocalZoneSearchRadiusMeters * (1.5 + highSpeedIntensity * 0.22),
    warmRing?.recommendedKeepAliveRadiusMeters ?? 0,
  );
  const effectiveMaxSpawnPerRefresh = Math.max(
    options.maxSpawnPerRefresh,
    Math.ceil(options.maxSpawnPerRefresh * spawnBudgetMultiplier * speedBoost),
    Math.ceil(
      (options.maxSpawnPerRefresh + (warmRing?.recommendedSpawnBudgetBoost ?? 0)) *
        frontBoost,
    ),
  );
  const effectiveMinPedestriansNearPlayer = Math.max(
    options.minPedestriansNearPlayer,
    minReadyPedestrians,
    speed >= HIGH_SPEED_START_MPS
      ? Math.ceil(minReadyPedestrians * (1.08 + highSpeedIntensity * 0.16))
      : minReadyPedestrians,
  );
  const highSpeedReadyFloor = Math.ceil(
    effectiveMinPedestriansNearPlayer * (0.72 + highSpeedIntensity * 0.12),
  );
  const shouldForceRepopulate =
    enabled &&
    (readyPedestrianCount < minReadyPedestrians ||
      (speed >= HIGH_SPEED_START_MPS && readyPedestrianCount < highSpeedReadyFloor));

  return {
    enabled,
    readyPedestrianCount,
    minReadyPedestrians,
    shouldForceRepopulate,
    effectivePopulateRadiusMeters,
    effectiveLocalZoneSearchRadiusMeters,
    effectiveKeepAliveRadiusMeters,
    effectiveMaxSpawnPerRefresh,
    effectiveMinPedestriansNearPlayer,
    effectiveFrontLookaheadMeters,
  };
}
