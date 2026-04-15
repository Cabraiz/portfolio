// src/pages/Mateus/Portfolio/domain/worldGlobe/worldGlobe.markers.ts

import type {
  GlobeGeoPoint,
  GlobeMarkerModel,
  GlobeRgbColor,
  GlobeMutableRgbColor,
  GlobeMutableLatLngTuple,
} from "./worldGlobe.types";

import {
  DEFAULT_ORIGIN_RING_COLOR,
  DEFAULT_ORIGIN_CORE_COLOR,
  DEFAULT_TARGET_RING_COLOR,
  DEFAULT_TARGET_CORE_COLOR,
} from "./worldGlobe.constants";

/**
 * Helpers internos
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
 * 🔵 REGRA DE NEGÓCIO DOS PONTOS
 */
export function buildMarkerModels(
  origin: GlobeGeoPoint,
  location: GlobeGeoPoint,
  compact: boolean
): GlobeMarkerModel[] {
  const originRingSize = compact ? 0.118 : 0.104;
  const originCoreSize = compact ? 0.042 : 0.038;

  const targetRingSize = compact ? 0.138 : 0.122;
  const targetCoreSize = compact ? 0.052 : 0.046;

  return [
    // ORIGIN
    {
      location: toLocationTuple(origin),
      size: originRingSize,
      color: resolvePointColor(
        DEFAULT_ORIGIN_RING_COLOR,
        DEFAULT_ORIGIN_RING_COLOR
      ),
    },
    {
      location: toLocationTuple(origin),
      size: originCoreSize,
      color: resolvePointColor(
        DEFAULT_ORIGIN_CORE_COLOR,
        DEFAULT_ORIGIN_CORE_COLOR
      ),
    },

    // DESTINATION
    {
      location: toLocationTuple(location),
      size: targetRingSize,
      color: resolvePointColor(
        DEFAULT_TARGET_RING_COLOR,
        DEFAULT_TARGET_RING_COLOR
      ),
    },
    {
      location: toLocationTuple(location),
      size: targetCoreSize,
      color: resolvePointColor(
        DEFAULT_TARGET_CORE_COLOR,
        DEFAULT_TARGET_CORE_COLOR
      ),
    },
  ];
}
