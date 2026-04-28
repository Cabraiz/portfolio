// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficRouter.ts

import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import {
  buildHomeDriveRoadTopology,
  getHomeDriveRoadEndpointCutKey,
  getHomeDriveRoadTopologyConnectionsFromEndpoint,
  type HomeDriveRoadEndpointSide,
  type HomeDriveRoadTopology,
  type HomeDriveRoadTopologyConnection,
} from "./homeDrive.roadTopology";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";

export type HomeDriveTrafficRoutableVehicle = Pick<
  HomeDriveTrafficVehicle,
  | "id"
  | "segmentId"
  | "roadId"
  | "segmentIndex"
  | "t"
  | "directionSign"
  | "laneOffsetMeters"
> &
  Readonly<{
    speedMps?: number;
    previousSegmentId?: string | null;
    routeSeed?: number;
  }>;

export type HomeDriveTrafficRoadStepInput = Readonly<{
  roads: readonly HomeDriveGeneratedRoadSegment[];
  topology?: HomeDriveRoadTopology;
  vehicle: HomeDriveTrafficRoutableVehicle;
  currentRoad: HomeDriveGeneratedRoadSegment;
  nextT: number;
  routeSeed?: number;
}>;

export type HomeDriveTrafficRoadStep = Readonly<{
  road: HomeDriveGeneratedRoadSegment;
  roadId: string;
  segmentId: string;
  segmentIndex: number;
  previousSegmentId: string | null;
  t: number;
  directionSign: 1 | -1;
  laneOffsetMeters: number;
  routed: boolean;
}>;

const MAX_ROUTE_HOPS_PER_TICK = 6;
const MIN_SEGMENT_LENGTH_METERS = 0.000001;
const ENDPOINT_ENTRY_T_PADDING = 0.012;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
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

function getStableRouteSeed(
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

function getExitEndpointSide(nextT: number): HomeDriveRoadEndpointSide | null {
  if (nextT > 1) {
    return "to";
  }

  if (nextT < 0) {
    return "from";
  }

  return null;
}

function getFallbackDirectionFromEndpoint(
  endpointSide: HomeDriveRoadEndpointSide,
): 1 | -1 {
  return endpointSide === "to" ? -1 : 1;
}

function getEndpointT(endpointSide: HomeDriveRoadEndpointSide): number {
  return endpointSide === "from" ? 0 : 1;
}

function getOvershootMeters(
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
  if (connection.toDirectionSign === 1) {
    return true;
  }

  return connection.toRoad.bidirectional;
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

function chooseTrafficConnection(
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

function clampLaneOffsetToRoad(
  laneOffsetMeters: number,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const halfRoadWidth = road.width / 2;
  const safeHalfWidth = Math.max(0.45, halfRoadWidth - 1.05);

  return clamp(laneOffsetMeters, -safeHalfWidth, safeHalfWidth);
}

function getSameRoadFallbackStep(
  vehicle: HomeDriveTrafficRoutableVehicle,
  road: HomeDriveGeneratedRoadSegment,
  endpointSide: HomeDriveRoadEndpointSide,
  overshootMeters: number,
): HomeDriveTrafficRoadStep {
  const directionSign = getFallbackDirectionFromEndpoint(endpointSide);
  const entryT = getEndpointT(endpointSide);

  const overshootT =
    road.length <= MIN_SEGMENT_LENGTH_METERS
      ? 0
      : Math.min(overshootMeters / road.length, 0.12);

  const t = clamp01(entryT + directionSign * overshootT);

  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.segmentId,
    t,
    directionSign,
    laneOffsetMeters: clampLaneOffsetToRoad(vehicle.laneOffsetMeters, road),
    routed: true,
  };
}

function getInitialCurrentStep(
  vehicle: HomeDriveTrafficRoutableVehicle,
  road: HomeDriveGeneratedRoadSegment,
  nextT: number,
): HomeDriveTrafficRoadStep {
  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.previousSegmentId ?? null,
    t: clamp01(nextT),
    directionSign: vehicle.directionSign,
    laneOffsetMeters: clampLaneOffsetToRoad(vehicle.laneOffsetMeters, road),
    routed: false,
  };
}

function getStepFromConnection(
  vehicle: HomeDriveTrafficRoutableVehicle,
  connection: HomeDriveRoadTopologyConnection,
  overshootMeters: number,
): HomeDriveTrafficRoadStep {
  const road = connection.toRoad;

  const overshootT =
    road.length <= MIN_SEGMENT_LENGTH_METERS ? 0 : overshootMeters / road.length;

  let nextT = connection.toT + connection.toDirectionSign * overshootT;

  if (connection.toEndpointSide === "from") {
    nextT = Math.max(nextT, ENDPOINT_ENTRY_T_PADDING);
  }

  if (connection.toEndpointSide === "to") {
    nextT = Math.min(nextT, 1 - ENDPOINT_ENTRY_T_PADDING);
  }

  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.segmentId,
    t: nextT,
    directionSign: connection.toDirectionSign,
    laneOffsetMeters: clampLaneOffsetToRoad(vehicle.laneOffsetMeters, road),
    routed: true,
  };
}

function resolveOneTrafficRoadStep(
  input: HomeDriveTrafficRoadStepInput,
  topology: HomeDriveRoadTopology,
): HomeDriveTrafficRoadStep {
  const endpointSide = getExitEndpointSide(input.nextT);

  if (!endpointSide) {
    return getInitialCurrentStep(input.vehicle, input.currentRoad, input.nextT);
  }

  const overshootMeters = getOvershootMeters(input.currentRoad, input.nextT);

  const connections = getHomeDriveRoadTopologyConnectionsFromEndpoint(
    topology,
    input.currentRoad,
    endpointSide,
  );

  const selectedConnection = chooseTrafficConnection(
    connections,
    input.vehicle,
    getStableRouteSeed(input.vehicle, input.routeSeed),
  );

  if (!selectedConnection) {
    return getSameRoadFallbackStep(
      input.vehicle,
      input.currentRoad,
      endpointSide,
      overshootMeters,
    );
  }

  return getStepFromConnection(input.vehicle, selectedConnection, overshootMeters);
}

export function resolveHomeDriveTrafficRoadStep(
  input: HomeDriveTrafficRoadStepInput,
): HomeDriveTrafficRoadStep {
  const topology = input.topology ?? buildHomeDriveRoadTopology(input.roads);

  let step = resolveOneTrafficRoadStep(input, topology);

  for (let hopIndex = 0; hopIndex < MAX_ROUTE_HOPS_PER_TICK; hopIndex += 1) {
    const endpointSide = getExitEndpointSide(step.t);

    if (!endpointSide) {
      return {
        ...step,
        t: clamp01(step.t),
        laneOffsetMeters: clampLaneOffsetToRoad(
          step.laneOffsetMeters,
          step.road,
        ),
      };
    }

    step = resolveOneTrafficRoadStep(
      {
        roads: input.roads,
        topology,
        currentRoad: step.road,
        nextT: step.t,
        routeSeed: (input.routeSeed ?? 0) + hopIndex + 1,
        vehicle: {
          id: input.vehicle.id,
          roadId: step.roadId,
          segmentId: step.segmentId,
          segmentIndex: step.segmentIndex,
          previousSegmentId: step.previousSegmentId,
          t: step.t,
          directionSign: step.directionSign,
          laneOffsetMeters: step.laneOffsetMeters,
          routeSeed: input.vehicle.routeSeed,
          speedMps: input.vehicle.speedMps,
        },
      },
      topology,
    );
  }

  return {
    ...step,
    t: clamp01(step.t),
    laneOffsetMeters: clampLaneOffsetToRoad(step.laneOffsetMeters, step.road),
  };
}

export function getHomeDriveTrafficPositionOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
  laneOffsetMeters: number,
): HomeDriveWorldPosition {
  const clampedT = clamp01(t);
  const clampedLaneOffset = clampLaneOffsetToRoad(laneOffsetMeters, road);

  return {
    x:
      road.from.x +
      (road.to.x - road.from.x) * clampedT +
      road.normal.x * clampedLaneOffset,
    z:
      road.from.z +
      (road.to.z - road.from.z) * clampedT +
      road.normal.z * clampedLaneOffset,
  };
}

export function getHomeDriveTrafficHeadingOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: 1 | -1,
): number {
  return road.angleRad + (directionSign === -1 ? Math.PI : 0);
}

export function hasHomeDriveTrafficRouteFromEndpoint(
  topology: HomeDriveRoadTopology,
  road: HomeDriveGeneratedRoadSegment,
  endpointSide: HomeDriveRoadEndpointSide,
): boolean {
  const cutKey = getHomeDriveRoadEndpointCutKey(road, endpointSide);

  return (topology.connectionsByEndpointCutKey.get(cutKey)?.length ?? 0) > 0;
}
