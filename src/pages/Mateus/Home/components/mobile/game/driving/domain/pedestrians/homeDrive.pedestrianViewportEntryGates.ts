// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportEntryGates.ts

import type {
  HomeDrivePedestrianViewportEntryGateConfig,
  HomeDrivePedestrianViewportEntryGateKey,
  HomeDrivePedestrianViewportEntryGateResult,
  HomeDrivePedestrianViewportEntryGateSlotLike,
} from "./homeDrive.pedestrianViewportEntryGates.types";

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function createHomeDrivePedestrianViewportEntryGateConfig(
  partial: Partial<HomeDrivePedestrianViewportEntryGateConfig> = {},
): HomeDrivePedestrianViewportEntryGateConfig {
  const minForwardMeters = Math.max(54, partial.minForwardMeters ?? 140);
  const maxForwardMeters = Math.max(
    minForwardMeters + 96,
    partial.maxForwardMeters ?? 620,
  );
  const centerBlockForwardMeters = Math.max(
    minForwardMeters,
    partial.centerBlockForwardMeters ?? 240,
  );
  const centerBlockAbsLateralMeters = Math.max(
    24,
    partial.centerBlockAbsLateralMeters ?? 82,
  );
  const sideMinAbsLateralMeters = Math.max(
    Math.max(24, centerBlockAbsLateralMeters * 0.58),
    partial.sideMinAbsLateralMeters ?? 92,
  );
  const sideMaxAbsLateralMeters = Math.max(
    sideMinAbsLateralMeters + 24,
    partial.sideMaxAbsLateralMeters ?? 340,
  );
  const farEdgeMinForwardMeters = clamp(
    partial.farEdgeMinForwardMeters ?? centerBlockForwardMeters,
    minForwardMeters,
    maxForwardMeters,
  );

  return {
    minForwardMeters,
    maxForwardMeters,
    centerBlockForwardMeters,
    centerBlockAbsLateralMeters,
    sideMinAbsLateralMeters,
    sideMaxAbsLateralMeters,
    farEdgeMinForwardMeters,
    allowRelaxedFallback: partial.allowRelaxedFallback ?? true,
    debug: partial.debug ?? false,
  };
}

export function getHomeDrivePedestrianViewportEntryGateResult(
  slot: HomeDrivePedestrianViewportEntryGateSlotLike,
  config: HomeDrivePedestrianViewportEntryGateConfig,
): HomeDrivePedestrianViewportEntryGateResult {
  const forwardMeters = Number.isFinite(slot.forwardMeters) ? slot.forwardMeters : 0;
  const lateralMeters = Number.isFinite(slot.lateralMeters) ? slot.lateralMeters : 0;
  const distanceMeters = Number.isFinite(slot.distanceMeters) ? slot.distanceMeters : 0;
  const absoluteLateralMeters = Math.abs(lateralMeters);

  if (forwardMeters < 0) {
    return {
      allowed: false,
      gateKey: null,
      rejectReason: "behind-camera",
      score: -10000,
    };
  }

  /*
   * Hard block only for very close births. The old gate rejected too much here
   * and could leave the resident pool with zero usable slots.
   */
  const hardMinForwardMeters = Math.max(34, config.minForwardMeters * 0.48);
  const hardMinDistanceMeters = Math.max(34, config.minForwardMeters * 0.42);

  if (forwardMeters < hardMinForwardMeters || distanceMeters < hardMinDistanceMeters) {
    return {
      allowed: false,
      gateKey: null,
      rejectReason: "too-close",
      score: -9000 - Math.abs(forwardMeters - config.minForwardMeters),
    };
  }

  if (forwardMeters > config.maxForwardMeters) {
    if (config.allowRelaxedFallback && forwardMeters <= config.maxForwardMeters + 180) {
      return {
        allowed: true,
        gateKey: "safe-entry-far-edge",
        rejectReason: "relaxed-far-edge",
        score: 2600 - Math.abs(forwardMeters - config.maxForwardMeters) * 0.62,
      };
    }

    return {
      allowed: false,
      gateKey: null,
      rejectReason: "too-far",
      score: -7000 - Math.abs(forwardMeters - config.maxForwardMeters),
    };
  }

  const isCenterCone =
    forwardMeters <= config.centerBlockForwardMeters &&
    absoluteLateralMeters < config.centerBlockAbsLateralMeters;

  const isSideGate =
    absoluteLateralMeters >= config.sideMinAbsLateralMeters &&
    absoluteLateralMeters <= config.sideMaxAbsLateralMeters;

  if (isSideGate) {
    const gateKey: HomeDrivePedestrianViewportEntryGateKey =
      lateralMeters < 0 ? "safe-entry-left" : "safe-entry-right";

    return {
      allowed: true,
      gateKey,
      rejectReason: "none",
      score:
        5000 +
        Math.min(180, forwardMeters) * 0.24 -
        Math.abs(absoluteLateralMeters - config.sideMinAbsLateralMeters) * 0.18,
    };
  }

  if (forwardMeters >= config.farEdgeMinForwardMeters) {
    return {
      allowed: true,
      gateKey: "safe-entry-far-edge",
      rejectReason: "none",
      score:
        4200 +
        Math.min(260, forwardMeters - config.farEdgeMinForwardMeters) * 0.32 -
        absoluteLateralMeters * 0.08,
    };
  }

  /*
   * Relaxed fallback: still avoids the windshield/very-near pop-in, but does
   * not let the slot pipeline return zero when road geometry is narrow or the
   * current street lacks enough side sidewalks.
   */
  if (config.allowRelaxedFallback && !isCenterCone) {
    const gateKey: HomeDrivePedestrianViewportEntryGateKey =
      lateralMeters < 0 ? "safe-entry-left" : "safe-entry-right";

    return {
      allowed: true,
      gateKey,
      rejectReason: "relaxed-side",
      score:
        2700 +
        Math.min(160, forwardMeters) * 0.18 -
        Math.abs(config.sideMinAbsLateralMeters - absoluteLateralMeters) * 0.36,
    };
  }

  if (config.allowRelaxedFallback && forwardMeters >= config.centerBlockForwardMeters * 0.72) {
    return {
      allowed: true,
      gateKey: "safe-entry-far-edge",
      rejectReason: "last-resort-visible",
      score:
        1800 +
        Math.min(180, forwardMeters - config.centerBlockForwardMeters * 0.72) * 0.18 -
        absoluteLateralMeters * 0.1,
    };
  }

  return {
    allowed: false,
    gateKey: null,
    rejectReason: isCenterCone ? "center-cone" : "unsafe-lateral",
    score: -6000 - Math.abs(config.sideMinAbsLateralMeters - absoluteLateralMeters),
  };
}

export function isHomeDrivePedestrianViewportEntryGateSlotAllowed(
  slot: HomeDrivePedestrianViewportEntryGateSlotLike,
  config: HomeDrivePedestrianViewportEntryGateConfig,
): boolean {
  return getHomeDrivePedestrianViewportEntryGateResult(slot, config).allowed;
}
