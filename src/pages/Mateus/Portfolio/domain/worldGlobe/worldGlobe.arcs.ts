// src/pages/Mateus/Portfolio/domain/worldGlobe/worldGlobe.arcs.ts

import type {
  GlobeGeoPoint,
  GlobeArcModel,
  GlobeRgbColor,
  GlobeMutableRgbColor,
  GlobeMutableLatLngTuple,
} from "./worldGlobe.types";

import { DEFAULT_ARC_COLOR } from "./worldGlobe.constants";

/**
 * Helpers
 */

function resolvePointColor(
  color: GlobeRgbColor | undefined,
  fallback: GlobeRgbColor
): GlobeMutableRgbColor {
  const [r, g, b] = color ?? fallback;
  return [r, g, b];
}

function toLocationTuple(
  point: Pick<GlobeGeoPoint, "lat" | "lng">
): GlobeMutableLatLngTuple {
  return [point.lat, point.lng];
}

/**
 * 🟣 REGRA DE NEGÓCIO DAS LINHAS
 */
export function buildArcModels(
  origin: GlobeGeoPoint,
  location: GlobeGeoPoint,
  showConnectionArc: boolean
): GlobeArcModel[] {
  if (!showConnectionArc) return [];

  const isSamePoint =
    Math.abs(origin.lat - location.lat) < 0.0001 &&
    Math.abs(origin.lng - location.lng) < 0.0001;

  if (isSamePoint) return [];

  return [
    {
      from: toLocationTuple(origin),
      to: toLocationTuple(location),
      color: resolvePointColor(DEFAULT_ARC_COLOR, DEFAULT_ARC_COLOR),
    },
  ];
}
