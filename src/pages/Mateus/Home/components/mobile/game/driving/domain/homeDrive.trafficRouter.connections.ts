// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficRouter.connections.ts
// Escolha de conexão entre vias.

import type {
  HomeDriveRoadEndpointSide,
  HomeDriveRoadTopologyConnection,
} from "./homeDrive.roadTopology";
import { canHomeDriveTrafficUseRoadDirection } from "./homeDrive.trafficDirection";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type { HomeDriveTrafficRoutableVehicle } from "./homeDrive.trafficRouter.types";

export const MAX_ROUTE_HOPS_PER_TICK = 6;
export const MIN_SEGMENT_LENGTH_METERS = 0.000001;
export const ENDPOINT_ENTRY_T_PADDING = 0.012;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function hashStringToUnit(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

export function getStableRouteSeed(
  vehicle: HomeDriveTrafficRoutableVehicle,
  routeSeed = 0,
): number {
  if (
    typeof vehicle.routeSeed === "number" &&
    Number.isFinite(vehicle.routeSeed)
  ) {
    return vehicle.routeSeed + routeSeed;
  }

  return routeSeed;
}

export function getExitEndpointSide(nextT: number): HomeDriveRoadEndpointSide | null {
  if (nextT > 1) {
    return "to";
  }

  if (nextT < 0) {
    return "from";
  }

  return null;
}

export function getFallbackDirectionFromEndpoint(
  endpointSide: HomeDriveRoadEndpointSide,
): HomeDriveTrafficDirectionSign {
  return endpointSide === "to" ? -1 : 1;
}

export function getEndpointT(endpointSide: HomeDriveRoadEndpointSide): number {
  return endpointSide === "from" ? 0 : 1;
}

export function getOvershootMeters(
  road: HomeDriveGeneratedRoadSegment,
  nextT: number,
): number {
  if (road.length <= MIN_SEGMENT_LENGTH_METERS) {
    return 0;
  }

  if (nextT > 1) {
    return (nextT - 1) * road.length;
  }

  if (nextT < 0) {
    return Math.abs(nextT) * road.length;
  }

  return 0;
}

function isReverseConnectionToPreviousSegment(
  connection: HomeDriveRoadTopologyConnection,
  vehicle: HomeDriveTrafficRoutableVehicle,
): boolean {
  return (
    typeof vehicle.previousSegmentId === "string" &&
    vehicle.previousSegmentId.length > 0 &&
    connection.toSegmentId === vehicle.previousSegmentId
  );
}

function isConnectionDirectionAllowed(
  connection: HomeDriveRoadTopologyConnection,
): boolean {
  return canHomeDriveTrafficUseRoadDirection(
    connection.toRoad,
    connection.toDirectionSign,
  );
}

function getConnectionSelectionScore(
  connection: HomeDriveRoadTopologyConnection,
  vehicle: HomeDriveTrafficRoutableVehicle,
  routeSeed: number,
  connectionIndex: number,
): number {
  const jitter = hashStringToUnit(
    `${vehicle.id}:${connection.id}:${routeSeed}:${connectionIndex}`,
  );

  let score = connection.score + jitter * 14;

  if (isReverseConnectionToPreviousSegment(connection, vehicle)) {
    score -= 220;
  }

  if (connection.toSegmentId === vehicle.segmentId) {
    score -= 260;
  }

  if (connection.turnDot < -0.36) {
    score -= 180;
  }

  if (connection.kind === "continuation") {
    score += 28;
  }

  if (connection.kind === "through") {
    score -= 12;
  }

  return score;
}

export function chooseTrafficConnection(
  connections: readonly HomeDriveRoadTopologyConnection[],
  vehicle: HomeDriveTrafficRoutableVehicle,
  routeSeed: number,
): HomeDriveRoadTopologyConnection | null {
  const viableConnections = connections.filter(isConnectionDirectionAllowed);

  if (viableConnections.length === 0) {
    return null;
  }

  const rankedConnections = viableConnections
    .map((connection, index) => ({
      connection,
      score: getConnectionSelectionScore(
        connection,
        vehicle,
        routeSeed,
        index,
      ),
    }))
    .sort((first, second) => second.score - first.score);

  return rankedConnections[0]?.connection ?? null;
}
