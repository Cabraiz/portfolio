// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficAwareness.types.ts

import type {
  HomeDriveTrafficLaneChangeDirection,
  HomeDriveTrafficTurnSignal,
} from "./homeDrive.traffic.types";

export type HomeDriveTrafficAwarenessBlockReason =
  | "none"
  | "follow"
  | "emergency"
  | "lane-change"
  | "stabilized";

export type HomeDriveTrafficAwarenessDecision = Readonly<{
  speedFactor: number;
  targetLaneIndex: number;
  targetLaneOffsetMeters: number;
  laneChangeDirection: HomeDriveTrafficLaneChangeDirection;
  turnSignal: HomeDriveTrafficTurnSignal;
  brakeLightIntensity: number;
  followingVehicleId: string | null;
  blockReason: HomeDriveTrafficAwarenessBlockReason;
}>;

export type HomeDriveTrafficAwarenessSnapshot = Readonly<{
  decisionsByVehicleId: ReadonlyMap<string, HomeDriveTrafficAwarenessDecision>;
}>;
