// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportOccupancy.types.ts

export type HomeDrivePedestrianViewportOccupancyBandKey =
  | "visible-near"
  | "visible-mid"
  | "visible-far"
  | "side-left"
  | "side-right";

export type HomeDrivePedestrianViewportOccupancyBand = Readonly<{
  key: HomeDrivePedestrianViewportOccupancyBandKey;
  minForwardMeters: number;
  maxForwardMeters: number;
  minAbsLateralMeters: number;
  maxAbsLateralMeters: number;
  preferredLateralSign?: -1 | 1;
  targetCount: number;
  priority: number;
}>;

export type HomeDrivePedestrianViewportOccupancyConfig = Readonly<{
  enabled: boolean;
  forceAllAgentsIntoViewport: boolean;
  maxTeleportsPerTick: number;
  nearMinMeters: number;
  nearMaxMeters: number;
  nearCount: number;
  midMinMeters: number;
  midMaxMeters: number;
  midCount: number;
  farMinMeters: number;
  farMaxMeters: number;
  farCount: number;
  sideMinForwardMeters: number;
  sideMaxForwardMeters: number;
  sideLateralMinMeters: number;
  sideLateralMaxMeters: number;
  sideCount: number;
  minSpacingMeters: number;
  debug: boolean;
}>;

export type HomeDrivePedestrianViewportOccupancyPlan = Readonly<{
  id: string;
  bands: readonly HomeDrivePedestrianViewportOccupancyBand[];
  totalTargetCount: number;
  maxForwardMeters: number;
  maxAbsLateralMeters: number;
}>;
