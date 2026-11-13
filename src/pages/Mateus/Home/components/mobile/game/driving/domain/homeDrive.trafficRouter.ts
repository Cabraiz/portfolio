// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficRouter.ts

import {
  buildHomeDriveRoadTopology,
  getHomeDriveRoadEndpointCutKey,
} from "./homeDrive.roadTopology";
import type { HomeDriveRoadEndpointSide, HomeDriveRoadTopology } from "./homeDrive.roadTopology";
import {
  getHomeDriveTrafficHeadingRadians,
  getHomeDriveTrafficLanePositionAtProgress,
} from "./homeDrive.trafficLanes";
import type { HomeDriveTrafficDirectionSign } from "./homeDrive.trafficLanes";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import type {
  HomeDriveTrafficRoadStepInput,
  HomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter.types";
import {
  MAX_ROUTE_HOPS_PER_TICK,
  clamp01,
  getExitEndpointSide,
} from "./homeDrive.trafficRouter.connections";
import {
  getNormalizedTrafficRoadStep,
  resolveOneTrafficRoadStep,
} from "./homeDrive.trafficRouter.steps";
export type {
  HomeDriveTrafficRoutableVehicle,
  HomeDriveTrafficRoadStepInput,
  HomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter.types";

export function resolveHomeDriveTrafficRoadStep(
  input: HomeDriveTrafficRoadStepInput,
): HomeDriveTrafficRoadStep {
  const topology = input.topology ?? buildHomeDriveRoadTopology(input.roads);

  let step = resolveOneTrafficRoadStep(input, topology);

  for (let hopIndex = 0; hopIndex < MAX_ROUTE_HOPS_PER_TICK; hopIndex += 1) {
    const endpointSide = getExitEndpointSide(step.t);

    if (!endpointSide) {
      return getNormalizedTrafficRoadStep(step);
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
          laneIndex: step.laneIndex,
          laneOffsetMeters: step.laneOffsetMeters,
          routeSeed: input.vehicle.routeSeed,
          speedMps: input.vehicle.speedMps,
        },
      },
      topology,
    );
  }

  return getNormalizedTrafficRoadStep(step);
}

export function getHomeDriveTrafficPositionOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
  laneOffsetMeters: number,
): HomeDriveWorldPosition {
  return getHomeDriveTrafficLanePositionAtProgress(
    road,
    clamp01(t),
    laneOffsetMeters,
  );
}

export function getHomeDriveTrafficHeadingOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): number {
  return getHomeDriveTrafficHeadingRadians(road, directionSign);
}

export function hasHomeDriveTrafficRouteFromEndpoint(
  topology: HomeDriveRoadTopology,
  road: HomeDriveGeneratedRoadSegment,
  endpointSide: HomeDriveRoadEndpointSide,
): boolean {
  const cutKey = getHomeDriveRoadEndpointCutKey(road, endpointSide);

  return (topology.connectionsByEndpointCutKey.get(cutKey)?.length ?? 0) > 0;
}
