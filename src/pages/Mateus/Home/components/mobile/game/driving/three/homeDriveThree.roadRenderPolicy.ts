// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.roadRenderPolicy.ts

import type { HomeDriveGeneratedRoadSegment } from "../domain/homeDrive.worldMap.types";
import type { HomeDriveThreeRoadBandKind } from "./homeDriveThree.types";
import type {
	HomeDriveThreeRoadEndpointRef,
	HomeDriveThreeRoadEndpointSide,
	HomeDriveThreeRoadJunction,
} from "./homeDriveThree.roadTopology";
import {
	type HomeDriveThreeRoadRenderRole,
	type HomeDriveThreeRoadMouthPolicy,
	type HomeDriveThreeEndpointVisualTrimPolicy,
	ROAD_MOUTH_Y,
	ROAD_MOUTH_RENDER_ORDER,
	MIN_ROAD_MOUTH_LENGTH_METERS,
	MAX_ROAD_MOUTH_LENGTH_METERS,
	MIN_ROAD_MOUTH_HALF_WIDTH_METERS,
	MAX_ROAD_MOUTH_HALF_WIDTH_METERS,
	TERMINAL_TRIM_BY_KIND,
	ASPHALT_NO_TRIM_METERS,
	DOMINANT_CONTINUATION_TRIM_BY_KIND,
	EQUIVALENT_JUNCTION_TRIM_BY_KIND,
	MINOR_JUNCTION_TRIM_BY_KIND,
	SUBORDINATE_JUNCTION_TRIM_BY_KIND,
} from "./homeDriveThree.roadRenderPolicy.config";
import {
	clamp,
	getRoadMouthLengthByKind,
	getRoadMouthRoleLengthMultiplier,
	getRoadMouthRoleWidthMultiplier,
	shouldKeepRoadContinuousAtJunction,
	getRoadRenderRoleAtJunction,
	getRoadMouthReasonForRole,
	getEndpointSideWidthBias,
} from "./homeDriveThree.roadRenderPolicy.roles";
export type {
	HomeDriveThreeRoadRenderRole,
	HomeDriveThreeRoadMouthReason,
	HomeDriveThreeRoadMouthPolicy,
	HomeDriveThreeEndpointVisualTrimPolicy,
} from "./homeDriveThree.roadRenderPolicy.config";

export function shouldCreateHomeDriveThreeIntersectionPad(
  _junction: HomeDriveThreeRoadJunction,
): boolean {
  return false;
}

export function getHomeDriveThreeRoadRenderRole(
  road: HomeDriveGeneratedRoadSegment,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeRoadRenderRole {
  return getRoadRenderRoleAtJunction(road, junction);
}

/*
  RoadMouths ficam desativadas no novo modelo.
  O encontro visual passa a ser responsabilidade exclusiva dos junction tiles.
*/
export function shouldCreateHomeDriveThreeRoadMouthForEndpoint(
  _endpoint: HomeDriveThreeRoadEndpointRef,
  _junction: HomeDriveThreeRoadJunction,
): boolean {
  return false;
}

export function getHomeDriveThreeRoadMouthPolicy(
  endpoint: HomeDriveThreeRoadEndpointRef,
  junction: HomeDriveThreeRoadJunction,
): HomeDriveThreeRoadMouthPolicy {
  if (junction.type === "terminal") {
    return {
      enabled: false,
      reason: "disabled",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  if (junction.type === "continuation") {
    return {
      enabled: false,
      reason: "continuation",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  if (shouldKeepRoadContinuousAtJunction(endpoint.road, junction)) {
    return {
      enabled: false,
      reason: "dominant-road",
      lengthMeters: 0,
      nearHalfWidthMeters: 0,
      farHalfWidthMeters: 0,
      y: ROAD_MOUTH_Y,
      renderOrder: ROAD_MOUTH_RENDER_ORDER,
    };
  }

  const role = getHomeDriveThreeRoadRenderRole(endpoint.road, junction);
  const reason = getRoadMouthReasonForRole(role);
  const widthBias = getEndpointSideWidthBias(endpoint.side);
  const roleLengthMultiplier = getRoadMouthRoleLengthMultiplier(role);
  const roleWidthMultiplier = getRoadMouthRoleWidthMultiplier(role);

  const baseLength = getRoadMouthLengthByKind(endpoint.road);
  const lengthMeters = clamp(
    baseLength * roleLengthMultiplier,
    MIN_ROAD_MOUTH_LENGTH_METERS,
    MAX_ROAD_MOUTH_LENGTH_METERS,
  );

  const roadHalfWidth = Math.max(1.5, endpoint.road.width / 2);
  const nearHalfWidthMeters = clamp(
    roadHalfWidth * roleWidthMultiplier * widthBias,
    MIN_ROAD_MOUTH_HALF_WIDTH_METERS,
    MAX_ROAD_MOUTH_HALF_WIDTH_METERS,
  );

  const farHalfWidthMeters = clamp(
    nearHalfWidthMeters * 0.68,
    MIN_ROAD_MOUTH_HALF_WIDTH_METERS * 0.72,
    MAX_ROAD_MOUTH_HALF_WIDTH_METERS * 0.78,
  );

  return {
    enabled: false,
    reason,
    lengthMeters,
    nearHalfWidthMeters,
    farHalfWidthMeters,
    y: ROAD_MOUTH_Y,
    renderOrder: ROAD_MOUTH_RENDER_ORDER,
  };
}

export function getHomeDriveThreeEndpointVisualTrimPolicy(
  road: HomeDriveGeneratedRoadSegment,
  _side: HomeDriveThreeRoadEndpointSide,
  kind: HomeDriveThreeRoadBandKind,
  junction: HomeDriveThreeRoadJunction | null,
): HomeDriveThreeEndpointVisualTrimPolicy {
  const role = getHomeDriveThreeRoadRenderRole(road, junction);

  if (!junction) {
    return {
      role,
      trimMeters: TERMINAL_TRIM_BY_KIND[kind],
    };
  }

  /*
    Regra mais importante:
    asfalto nunca corta em junction. Isso impede grama aparecer no encontro.
    O junction tile cobre T/+ por cima.
  */
  if (kind === "asphalt") {
    return {
      role,
      trimMeters: ASPHALT_NO_TRIM_METERS,
    };
  }

  if (shouldKeepRoadContinuousAtJunction(road, junction)) {
    return {
      role,
      trimMeters: 0,
    };
  }

  switch (role) {
    case "dominant-road-continuation":
      return {
        role,
        trimMeters: DOMINANT_CONTINUATION_TRIM_BY_KIND[kind],
      };

    case "dominant-road-edge":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.24 + SUBORDINATE_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "equivalent-junction":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.38 + EQUIVALENT_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "minor-junction":
      return {
        role,
        trimMeters:
          junction.maxRoadWidth * 0.3 + MINOR_JUNCTION_TRIM_BY_KIND[kind],
      };

    case "terminal":
    default:
      return {
        role,
        trimMeters: TERMINAL_TRIM_BY_KIND[kind],
      };
  }
}
