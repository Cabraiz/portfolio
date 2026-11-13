// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadRenderPolicy.config.ts

import type { HomeDriveThreeRoadBandKind } from "./homeDriveThree.types";

export type HomeDriveThreeRoadRenderRole =
  | "terminal"
  | "dominant-road-continuation"
  | "dominant-road-edge"
  | "equivalent-junction"
  | "minor-junction";

export type HomeDriveThreeRoadMouthReason =
  | "disabled"
  | "continuation"
  | "dominant-road"
  | "subordinate-road-mouth"
  | "equivalent-road-mouth"
  | "minor-road-mouth"
  | "decorative-suppressed";

export type HomeDriveThreeRoadMouthPolicy = Readonly<{
  enabled: boolean;
  reason: HomeDriveThreeRoadMouthReason;
  lengthMeters: number;
  nearHalfWidthMeters: number;
  farHalfWidthMeters: number;
  y: number;
  renderOrder: number;
}>;

export type HomeDriveThreeEndpointVisualTrimPolicy = Readonly<{
  trimMeters: number;
  role: HomeDriveThreeRoadRenderRole;
}>;

export const ROAD_MOUTH_Y = 0.125;
export const ROAD_MOUTH_RENDER_ORDER = 4;

export const MAX_EQUIVALENT_SCORE_DELTA = 180;
export const DOMINANT_EDGE_ALIGNMENT_DOT = 0.9;

export const DOMINANT_CORRIDOR_ALIGNMENT_DOT = 0.94;
export const DOMINANT_CORRIDOR_PRIORITY_DELTA = 300;
export const DOMINANT_CORRIDOR_MIN_WIDTH_RATIO = 0.66;

export const MIN_ROAD_MOUTH_LENGTH_METERS = 5.4;
export const MAX_ROAD_MOUTH_LENGTH_METERS = 12.2;
export const MIN_ROAD_MOUTH_HALF_WIDTH_METERS = 2.1;
export const MAX_ROAD_MOUTH_HALF_WIDTH_METERS = 6.8;

export const TERMINAL_TRIM_BY_KIND: Readonly<Record<HomeDriveThreeRoadBandKind, number>> =
  {
    asphalt: 0,
    "sidewalk-left": 2.6,
    "sidewalk-right": 2.6,
    curb: 3.4,
    "lane-mark": 9.2,
  };

/*
  Com junction tiles, o asfalto não deve mais ser cortado.
  Quem resolve T/+ visualmente é o tile renderizado por cima.
*/
export const ASPHALT_NO_TRIM_METERS = 0;

export const DOMINANT_CONTINUATION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 9,
  "sidewalk-right": 9,
  curb: 8,
  "lane-mark": 14,
};

export const EQUIVALENT_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 18,
  "sidewalk-right": 18,
  curb: 15,
  "lane-mark": 22,
};

export const MINOR_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 11,
  "sidewalk-right": 11,
  curb: 9.5,
  "lane-mark": 15,
};

export const SUBORDINATE_JUNCTION_TRIM_BY_KIND: Readonly<
  Record<HomeDriveThreeRoadBandKind, number>
> = {
  asphalt: ASPHALT_NO_TRIM_METERS,
  "sidewalk-left": 9,
  "sidewalk-right": 9,
  curb: 7.6,
  "lane-mark": 13.5,
};
