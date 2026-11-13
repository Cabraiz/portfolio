// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSidewalks.density.ts
// Densidade de pedestres por tipo de via.

import { clamp } from "./homeDrive.pedestrianRandom";

export const DEFAULT_PEDESTRIAN_DENSITY = 1;
const ROAD_KIND_DENSITY_CAPS: Readonly<Record<string, number>> = Object.freeze({
  commercial: 1.42,
  coastal: 1.26,
  avenue: 1.16,
  street: 0.94,
  ring: 0.72,
  service: 0.48,
});

export function clampHomeDrivePedestrianCrowdDensity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PEDESTRIAN_DENSITY;
  }

  return clamp(value, 0.18, 2.4);
}

export function getHomeDrivePedestrianRoadDensityCap(roadKind: string): number {
  return ROAD_KIND_DENSITY_CAPS[roadKind] ?? 0.88;
}

export function getHomeDrivePedestrianTargetSpacingMeters(roadKind: string): number {
  switch (roadKind) {
    case "commercial":
      return 4.8;
    case "coastal":
      return 5.4;
    case "avenue":
      return 5.8;
    case "street":
      return 6.6;
    case "ring":
      return 7.4;
    case "service":
      return 8.2;
    default:
      return 6.8;
  }
}
