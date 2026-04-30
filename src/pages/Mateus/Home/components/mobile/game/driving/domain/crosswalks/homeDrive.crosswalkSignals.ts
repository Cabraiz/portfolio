// src/pages/Mateus/Home/components/mobile/game/driving/domain/crosswalks/homeDrive.crosswalkSignals.ts

import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkSignalPhase,
  HomeDriveCrosswalkSignalTiming,
} from "./homeDrive.crosswalks.types";

const DEFAULT_SIGNAL_TIMING: HomeDriveCrosswalkSignalTiming = Object.freeze({
  walkSeconds: 8.5,
  waitSeconds: 13.5,
  dangerSeconds: 3.2,
  offsetSeconds: 0,
});

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getCrosswalkTimingMultiplier(crosswalk: HomeDriveCrosswalk): number {
  switch (crosswalk.kind) {
    case "avenue-zebra":
      return 1.24;

    case "school":
      return 1.16;

    case "commercial":
      return 1.08;

    case "double-zebra":
      return 1.04;

    case "zebra":
    default:
      return 1;
  }
}

export function getHomeDriveCrosswalkSignalTiming(
  crosswalk: HomeDriveCrosswalk,
): HomeDriveCrosswalkSignalTiming {
  if (crosswalk.signalPhase === "off") {
    return {
      walkSeconds: 0,
      waitSeconds: 999999,
      dangerSeconds: 0,
      offsetSeconds: 0,
    };
  }

  const multiplier = getCrosswalkTimingMultiplier(crosswalk);
  const seedOffset = clamp01(crosswalk.seed) * 9.5;

  return {
    walkSeconds: DEFAULT_SIGNAL_TIMING.walkSeconds * multiplier,
    waitSeconds: DEFAULT_SIGNAL_TIMING.waitSeconds * multiplier,
    dangerSeconds: DEFAULT_SIGNAL_TIMING.dangerSeconds * multiplier,
    offsetSeconds: seedOffset,
  };
}

export function resolveHomeDriveCrosswalkSignalPhase(
  crosswalk: HomeDriveCrosswalk,
  elapsedSeconds: number,
): HomeDriveCrosswalkSignalPhase {
  if (crosswalk.signalPhase === "off") {
    return "off";
  }

  if (!crosswalk.hasYieldControl) {
    return "walk";
  }

  const timing = getHomeDriveCrosswalkSignalTiming(crosswalk);
  const cycleSeconds =
    timing.walkSeconds + timing.waitSeconds + timing.dangerSeconds;

  if (cycleSeconds <= 0.0001) {
    return "walk";
  }

  const cycleTime =
    ((elapsedSeconds + timing.offsetSeconds) % cycleSeconds + cycleSeconds) %
    cycleSeconds;

  if (cycleTime < timing.walkSeconds) {
    return "walk";
  }

  if (cycleTime < timing.walkSeconds + timing.dangerSeconds) {
    return "danger";
  }

  return "wait";
}

export function canHomeDrivePedestrianEnterCrosswalk(
  crosswalk: HomeDriveCrosswalk,
  elapsedSeconds: number,
): boolean {
  const phase = resolveHomeDriveCrosswalkSignalPhase(crosswalk, elapsedSeconds);

  return phase === "walk";
}

export function shouldHomeDriveTrafficYieldAtCrosswalk(
  crosswalk: HomeDriveCrosswalk,
  elapsedSeconds: number,
  hasPedestrianOccupancy: boolean,
): boolean {
  if (!crosswalk.hasYieldControl) {
    return hasPedestrianOccupancy;
  }

  const phase = resolveHomeDriveCrosswalkSignalPhase(crosswalk, elapsedSeconds);

  return hasPedestrianOccupancy || phase === "walk" || phase === "danger";
}

export function getHomeDriveCrosswalkSignalProgress(
  crosswalk: HomeDriveCrosswalk,
  elapsedSeconds: number,
): number {
  if (crosswalk.signalPhase === "off") {
    return 0;
  }

  const timing = getHomeDriveCrosswalkSignalTiming(crosswalk);
  const cycleSeconds =
    timing.walkSeconds + timing.waitSeconds + timing.dangerSeconds;

  if (cycleSeconds <= 0.0001) {
    return 0;
  }

  const cycleTime =
    ((elapsedSeconds + timing.offsetSeconds) % cycleSeconds + cycleSeconds) %
    cycleSeconds;

  return cycleTime / cycleSeconds;
}
