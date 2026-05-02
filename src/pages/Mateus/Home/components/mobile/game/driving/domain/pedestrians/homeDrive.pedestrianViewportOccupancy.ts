// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportOccupancy.ts

import type {
  HomeDrivePedestrianViewportOccupancyBand,
  HomeDrivePedestrianViewportOccupancyConfig,
  HomeDrivePedestrianViewportOccupancyPlan,
} from "./homeDrive.pedestrianViewportOccupancy.types";

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeCount(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function normalizeBand(band: HomeDrivePedestrianViewportOccupancyBand): HomeDrivePedestrianViewportOccupancyBand {
  const minForwardMeters = Math.max(0, band.minForwardMeters);
  const maxForwardMeters = Math.max(minForwardMeters + 4, band.maxForwardMeters);
  const minAbsLateralMeters = Math.max(0, band.minAbsLateralMeters);
  const maxAbsLateralMeters = Math.max(minAbsLateralMeters + 2, band.maxAbsLateralMeters);

  return {
    ...band,
    minForwardMeters,
    maxForwardMeters,
    minAbsLateralMeters,
    maxAbsLateralMeters,
    targetCount: normalizeCount(band.targetCount),
    priority: Number.isFinite(band.priority) ? band.priority : 0,
  };
}

export function createHomeDrivePedestrianViewportOccupancyPlan(
  config: HomeDrivePedestrianViewportOccupancyConfig,
): HomeDrivePedestrianViewportOccupancyPlan {
  const sideTotal = normalizeCount(config.sideCount);
  const sideLeftCount = Math.floor(sideTotal / 2);
  const sideRightCount = sideTotal - sideLeftCount;

  /*
   * Anti-pop-in rule:
   * Resident agents may be kept inside the render radius, but new/recycled
   * positions cannot be born in the center of the camera. These safe bands
   * push occupancy to side gates or to the far visual edge so pedestrians
   * enter naturally instead of appearing in front of the car.
   */
  const safeNearMinMeters = Math.max(config.nearMinMeters, 150);
  const safeNearMaxMeters = Math.max(safeNearMinMeters + 64, config.nearMaxMeters, 240);
  const safeMidMinMeters = Math.max(config.midMinMeters, safeNearMaxMeters);
  const safeMidMaxMeters = Math.max(safeMidMinMeters + 76, config.midMaxMeters, 360);
  const safeFarMinMeters = Math.max(config.farMinMeters, safeMidMaxMeters);
  const safeFarMaxMeters = Math.max(safeFarMinMeters + 92, config.farMaxMeters, 520);
  const safeSideMinForwardMeters = Math.max(config.sideMinForwardMeters, safeNearMinMeters);
  const safeSideMaxForwardMeters = Math.max(config.sideMaxForwardMeters, safeFarMaxMeters);
  const safeSideLateralMinMeters = Math.max(config.sideLateralMinMeters, 104);
  const safeSideLateralMaxMeters = Math.max(config.sideLateralMaxMeters, safeSideLateralMinMeters + 80);

  const bands = [
    normalizeBand({
      key: "visible-near",
      minForwardMeters: safeNearMinMeters,
      maxForwardMeters: safeNearMaxMeters,
      minAbsLateralMeters: safeSideLateralMinMeters,
      maxAbsLateralMeters: Math.max(safeSideLateralMinMeters + 40, safeSideLateralMaxMeters * 0.82),
      targetCount: config.nearCount,
      priority: 500,
    }),
    normalizeBand({
      key: "visible-mid",
      minForwardMeters: safeMidMinMeters,
      maxForwardMeters: safeMidMaxMeters,
      minAbsLateralMeters: Math.max(82, safeSideLateralMinMeters * 0.76),
      maxAbsLateralMeters: Math.max(128, safeSideLateralMaxMeters * 0.86),
      targetCount: config.midCount,
      priority: 420,
    }),
    normalizeBand({
      key: "visible-far",
      minForwardMeters: safeFarMinMeters,
      maxForwardMeters: safeFarMaxMeters,
      minAbsLateralMeters: Math.max(54, safeSideLateralMinMeters * 0.54),
      maxAbsLateralMeters: Math.max(156, safeSideLateralMaxMeters),
      targetCount: config.farCount,
      priority: 360,
    }),
    normalizeBand({
      key: "side-left",
      minForwardMeters: safeSideMinForwardMeters,
      maxForwardMeters: safeSideMaxForwardMeters,
      minAbsLateralMeters: safeSideLateralMinMeters,
      maxAbsLateralMeters: safeSideLateralMaxMeters,
      preferredLateralSign: -1,
      targetCount: sideLeftCount,
      priority: 300,
    }),
    normalizeBand({
      key: "side-right",
      minForwardMeters: safeSideMinForwardMeters,
      maxForwardMeters: safeSideMaxForwardMeters,
      minAbsLateralMeters: safeSideLateralMinMeters,
      maxAbsLateralMeters: safeSideLateralMaxMeters,
      preferredLateralSign: 1,
      targetCount: sideRightCount,
      priority: 300,
    }),
  ].filter((band) => band.targetCount > 0);

  const maxForwardMeters = bands.reduce(
    (maxValue, band) => Math.max(maxValue, band.maxForwardMeters),
    0,
  );
  const maxAbsLateralMeters = bands.reduce(
    (maxValue, band) => Math.max(maxValue, band.maxAbsLateralMeters),
    0,
  );

  return {
    id: [
      "viewport-occupancy",
      Math.round(config.nearMaxMeters),
      Math.round(config.midMaxMeters),
      Math.round(config.farMaxMeters),
      bands.reduce((total, band) => total + band.targetCount, 0),
    ].join(":"),
    bands,
    totalTargetCount: bands.reduce((total, band) => total + band.targetCount, 0),
    maxForwardMeters,
    maxAbsLateralMeters,
  };
}

export function normalizeHomeDrivePedestrianViewportOccupancyConfig(
  partial: Partial<HomeDrivePedestrianViewportOccupancyConfig>,
  fallback: HomeDrivePedestrianViewportOccupancyConfig,
): HomeDrivePedestrianViewportOccupancyConfig {
  return {
    enabled: partial.enabled ?? fallback.enabled,
    forceAllAgentsIntoViewport:
      partial.forceAllAgentsIntoViewport ?? fallback.forceAllAgentsIntoViewport,
    maxTeleportsPerTick: Math.max(
      1,
      Math.floor(partial.maxTeleportsPerTick ?? fallback.maxTeleportsPerTick),
    ),
    nearMinMeters: Math.max(0, partial.nearMinMeters ?? fallback.nearMinMeters),
    nearMaxMeters: Math.max(
      (partial.nearMinMeters ?? fallback.nearMinMeters) + 12,
      partial.nearMaxMeters ?? fallback.nearMaxMeters,
    ),
    nearCount: normalizeCount(partial.nearCount ?? fallback.nearCount),
    midMinMeters: Math.max(0, partial.midMinMeters ?? fallback.midMinMeters),
    midMaxMeters: Math.max(
      (partial.midMinMeters ?? fallback.midMinMeters) + 12,
      partial.midMaxMeters ?? fallback.midMaxMeters,
    ),
    midCount: normalizeCount(partial.midCount ?? fallback.midCount),
    farMinMeters: Math.max(0, partial.farMinMeters ?? fallback.farMinMeters),
    farMaxMeters: Math.max(
      (partial.farMinMeters ?? fallback.farMinMeters) + 12,
      partial.farMaxMeters ?? fallback.farMaxMeters,
    ),
    farCount: normalizeCount(partial.farCount ?? fallback.farCount),
    sideMinForwardMeters: Math.max(
      0,
      partial.sideMinForwardMeters ?? fallback.sideMinForwardMeters,
    ),
    sideMaxForwardMeters: Math.max(
      (partial.sideMinForwardMeters ?? fallback.sideMinForwardMeters) + 12,
      partial.sideMaxForwardMeters ?? fallback.sideMaxForwardMeters,
    ),
    sideLateralMinMeters: Math.max(
      0,
      partial.sideLateralMinMeters ?? fallback.sideLateralMinMeters,
    ),
    sideLateralMaxMeters: Math.max(
      (partial.sideLateralMinMeters ?? fallback.sideLateralMinMeters) + 4,
      partial.sideLateralMaxMeters ?? fallback.sideLateralMaxMeters,
    ),
    sideCount: normalizeCount(partial.sideCount ?? fallback.sideCount),
    minSpacingMeters: clamp(
      partial.minSpacingMeters ?? fallback.minSpacingMeters,
      0,
      24,
    ),
    debug: partial.debug ?? fallback.debug,
  };
}
