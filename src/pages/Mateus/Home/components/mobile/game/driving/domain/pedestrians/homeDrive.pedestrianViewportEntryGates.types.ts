// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportEntryGates.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianViewportOccupancyBandKey } from "./homeDrive.pedestrianViewportOccupancy.types";

export type HomeDrivePedestrianViewportEntryGateKey =
  | "safe-entry-left"
  | "safe-entry-right"
  | "safe-entry-far-edge";

export type HomeDrivePedestrianViewportEntryGateRejectReason =
  | "none"
  | "behind-camera"
  | "too-close"
  | "too-far"
  | "center-cone"
  | "unsafe-lateral"
  | "relaxed-side"
  | "relaxed-far-edge"
  | "last-resort-visible";

export type HomeDrivePedestrianViewportEntryGateConfig = Readonly<{
  /**
   * Minimum forward distance where a recycled resident can be teleported.
   * Prevents people from popping into the windshield/center of attention.
   */
  minForwardMeters: number;
  maxForwardMeters: number;

  /**
   * Blocks the center of the camera until this forward distance.
   * Slots inside this area must be side-gates, not direct center births.
   */
  centerBlockForwardMeters: number;
  centerBlockAbsLateralMeters: number;

  /**
   * Side gates must be sufficiently lateral.
   */
  sideMinAbsLateralMeters: number;
  sideMaxAbsLateralMeters: number;

  /**
   * Far-edge gates may be closer to center, because they enter from the top of
   * the visual range instead of popping in the middle of the screen.
   */
  farEdgeMinForwardMeters: number;

  /**
   * When true, the gate may relax from strict side/far-edge only into a
   * controlled last-resort visible slot. This prevents the resident pool from
   * starving when the generated road/camera geometry does not offer enough
   * mathematically perfect side gates.
   */
  allowRelaxedFallback: boolean;

  debug: boolean;
}>;

export type HomeDrivePedestrianViewportEntryGateSlotLike = Readonly<{
  position: HomeDriveVector2;
  forwardMeters: number;
  lateralMeters: number;
  distanceMeters: number;
  viewportBand?: HomeDrivePedestrianViewportOccupancyBandKey;
}>;

export type HomeDrivePedestrianViewportEntryGateResult = Readonly<{
  allowed: boolean;
  gateKey: HomeDrivePedestrianViewportEntryGateKey | null;
  rejectReason: HomeDrivePedestrianViewportEntryGateRejectReason;
  score: number;
}>;
