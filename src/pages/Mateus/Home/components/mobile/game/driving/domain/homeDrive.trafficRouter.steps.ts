// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficRouter.steps.ts
// Cálculo de cada passo de via.

import { getHomeDriveRoadTopologyConnectionsFromEndpoint } from "./homeDrive.roadTopology";
import type {
  HomeDriveRoadEndpointSide,
  HomeDriveRoadTopology,
  HomeDriveRoadTopologyConnection,
} from "./homeDrive.roadTopology";
import { resolveHomeDriveTrafficSafeDirectionSign } from "./homeDrive.trafficDirection";
import {
  normalizeHomeDriveTrafficLaneIndex,
  resolveHomeDriveTrafficLane,
} from "./homeDrive.trafficLanes";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficRoutableVehicle,
  HomeDriveTrafficRoadStepInput,
  HomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter.types";
import {
  MIN_SEGMENT_LENGTH_METERS,
  ENDPOINT_ENTRY_T_PADDING,
  clamp01,
  getStableRouteSeed,
  getExitEndpointSide,
  getFallbackDirectionFromEndpoint,
  getEndpointT,
  getOvershootMeters,
  chooseTrafficConnection,
} from "./homeDrive.trafficRouter.connections";

function getResolvedLaneForRoad(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  laneIndex: number,
): Readonly<{
  laneIndex: number;
  laneOffsetMeters: number;
}> {
  const safeDirectionSign = resolveHomeDriveTrafficSafeDirectionSign(
    road,
    directionSign,
  );

  const normalizedLaneIndex = normalizeHomeDriveTrafficLaneIndex(
    road,
    safeDirectionSign,
    laneIndex,
  );

  const lane = resolveHomeDriveTrafficLane(
    road,
    safeDirectionSign,
    normalizedLaneIndex,
  );

  return {
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
  };
}

export function getNormalizedTrafficRoadStep(
  step: HomeDriveTrafficRoadStep,
): HomeDriveTrafficRoadStep {
  const safeDirectionSign = resolveHomeDriveTrafficSafeDirectionSign(
    step.road,
    step.directionSign,
  );

  const lane = getResolvedLaneForRoad(
    step.road,
    safeDirectionSign,
    step.laneIndex,
  );

  return {
    ...step,
    t: clamp01(step.t),
    directionSign: safeDirectionSign,
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
  };
}

function getSameRoadFallbackStep(
  vehicle: HomeDriveTrafficRoutableVehicle,
  road: HomeDriveGeneratedRoadSegment,
  endpointSide: HomeDriveRoadEndpointSide,
  overshootMeters: number,
): HomeDriveTrafficRoadStep {
  const directionSign = resolveHomeDriveTrafficSafeDirectionSign(
    road,
    getFallbackDirectionFromEndpoint(endpointSide),
  );

  const entryT = getEndpointT(endpointSide);

  const overshootT =
    road.length <= MIN_SEGMENT_LENGTH_METERS
      ? 0
      : Math.min(overshootMeters / road.length, 0.12);

  const lane = getResolvedLaneForRoad(
    road,
    directionSign,
    vehicle.laneIndex,
  );

  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.segmentId,
    t: clamp01(entryT + directionSign * overshootT),
    directionSign,
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
    routed: true,
  };
}

function getInitialCurrentStep(
  vehicle: HomeDriveTrafficRoutableVehicle,
  road: HomeDriveGeneratedRoadSegment,
  nextT: number,
): HomeDriveTrafficRoadStep {
  const directionSign = resolveHomeDriveTrafficSafeDirectionSign(
    road,
    vehicle.directionSign,
  );

  const lane = getResolvedLaneForRoad(
    road,
    directionSign,
    vehicle.laneIndex,
  );

  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.previousSegmentId ?? null,
    t: clamp01(nextT),
    directionSign,
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
    routed: false,
  };
}

function getStepFromConnection(
  vehicle: HomeDriveTrafficRoutableVehicle,
  connection: HomeDriveRoadTopologyConnection,
  overshootMeters: number,
): HomeDriveTrafficRoadStep {
  const road = connection.toRoad;
  const directionSign = resolveHomeDriveTrafficSafeDirectionSign(
    road,
    connection.toDirectionSign,
  );

  const overshootT =
    road.length <= MIN_SEGMENT_LENGTH_METERS ? 0 : overshootMeters / road.length;

  let nextT = connection.toT + directionSign * overshootT;

  if (connection.toEndpointSide === "from") {
    nextT = Math.max(nextT, ENDPOINT_ENTRY_T_PADDING);
  }

  if (connection.toEndpointSide === "to") {
    nextT = Math.min(nextT, 1 - ENDPOINT_ENTRY_T_PADDING);
  }

  const lane = getResolvedLaneForRoad(
    road,
    directionSign,
    vehicle.laneIndex,
  );

  return {
    road,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: vehicle.segmentId,
    t: nextT,
    directionSign,
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
    routed: true,
  };
}

export function resolveOneTrafficRoadStep(
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
