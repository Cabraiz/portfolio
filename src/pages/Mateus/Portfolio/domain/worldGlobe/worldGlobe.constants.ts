// src/pages/Mateus/Portfolio/domain/worldGlobe/worldGlobe.constants.ts

import type { GlobeGeoPoint, GlobeRgbColor } from "./worldGlobe.types";

export const DEFAULT_ORIGIN: GlobeGeoPoint = {
  lat: -3.7319,
  lng: -38.5267,
};

export const DEFAULT_BASE_COLOR: GlobeRgbColor = [0.094, 0.133, 0.212];
export const DEFAULT_GLOW_COLOR: GlobeRgbColor = [0.165, 0.847, 0.945];

export const DEFAULT_ORIGIN_RING_COLOR: GlobeRgbColor = [0.64, 0.78, 0.96];
export const DEFAULT_ORIGIN_CORE_COLOR: GlobeRgbColor = [0.9, 0.96, 1];

export const DEFAULT_TARGET_RING_COLOR: GlobeRgbColor = [0.29, 0.9, 0.95];
export const DEFAULT_TARGET_CORE_COLOR: GlobeRgbColor = [0.9, 1, 1];

export const DEFAULT_ARC_COLOR: GlobeRgbColor = [0.15, 0.88, 0.96];

export const MIN_VALID_STAGE_WIDTH = 140;
export const MIN_VALID_STAGE_HEIGHT = 180;

export const FOCUS_LONGITUDE_BIAS_RAD = 0;
export const FOCUS_THETA_BIAS_RAD = 0;
