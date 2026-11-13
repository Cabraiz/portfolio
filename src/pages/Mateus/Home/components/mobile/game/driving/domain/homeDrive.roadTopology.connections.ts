// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadTopology.connections.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadVector,
} from "./homeDrive.worldMap.types";
import type {
  HomeDriveRoadEndpointRef,
  HomeDriveRoadTopologyConnectionKind,
  HomeDriveRoadPriority,
  HomeDriveRoadJunction,
  HomeDriveRoadTopologyConnection,
  HomeDriveRoadThroughRef,
} from "./homeDrive.roadTopology.types";
import {
  dotDirections,
  getRoadTags,
  negateVector,
  multiplyVector,
  clamp,
  THROUGH_ENTRY_T_PADDING,
  THROUGH_ROAD_MIN_T,
  THROUGH_ROAD_MAX_T,
} from "./homeDrive.roadTopology.priority";

function getEndpointConnectionKind(
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadEndpointRef,
  turnDot: number,
): HomeDriveRoadTopologyConnectionKind {
  if (source.road.roadId === target.road.roadId) {
    return "continuation";
  }

  return turnDot >= 0.86 ? "continuation" : "turn";
}

function getConnectionScore(
  sourceIncomingDirection: HomeDriveRoadVector,
  targetOutgoingDirection: HomeDriveRoadVector,
  targetPriority: HomeDriveRoadPriority,
  targetRoad: HomeDriveGeneratedRoadSegment,
): Readonly<{
  turnDot: number;
  score: number;
}> {
  const turnDot = dotDirections(sourceIncomingDirection, targetOutgoingDirection);
  const tags = getRoadTags(targetRoad);

  let score = targetPriority.score * 0.22 + turnDot * 460;

  if (turnDot < -0.42) {
    score -= 360;
  }

  if (turnDot > 0.92) {
    score += 90;
  }

  if (tags.includes("connector")) {
    score += 42;
  }

  if (tags.includes("local-no-cross")) {
    score -= 120;
  }

  if (tags.includes("safe-endcap")) {
    score -= 260;
  }

  if (targetRoad.kind === "service") {
    score -= 90;
  }

  return {
    turnDot,
    score,
  };
}

function createEndpointToEndpointConnection(
  junction: HomeDriveRoadJunction,
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadEndpointRef,
): HomeDriveRoadTopologyConnection | null {
  if (source.road.id === target.road.id) {
    return null;
  }

  const toDirectionSign: 1 | -1 = target.side === "from" ? 1 : -1;

  if (!target.road.bidirectional && toDirectionSign === -1) {
    return null;
  }

  const sourceIncomingDirection = negateVector(source.directionAwayFromJunction);
  const targetOutgoingDirection = target.directionAwayFromJunction;

  const { turnDot, score } = getConnectionScore(
    sourceIncomingDirection,
    targetOutgoingDirection,
    target.priority,
    target.road,
  );

  return {
    id: `${source.cutKey}->${target.cutKey}`,
    junctionKey: junction.key,

    fromSegmentId: source.road.id,
    fromRoadId: source.road.roadId,
    fromEndpointSide: source.side,
    fromEndpointCutKey: source.cutKey,

    toSegmentId: target.road.id,
    toRoadId: target.road.roadId,
    toRoad: target.road,
    toEndpointSide: target.side,
    toT: target.side === "from" ? 0 : 1,
    toDirectionSign,

    turnDot,
    score,
    kind: getEndpointConnectionKind(source, target, turnDot),
  };
}

function createEndpointToThroughConnections(
  junction: HomeDriveRoadJunction,
  source: HomeDriveRoadEndpointRef,
  target: HomeDriveRoadThroughRef,
): readonly HomeDriveRoadTopologyConnection[] {
  if (source.road.id === target.road.id) {
    return [];
  }

  const sourceIncomingDirection = negateVector(source.directionAwayFromJunction);

  const allowedDirectionSigns: readonly (1 | -1)[] = target.road.bidirectional
    ? [1, -1]
    : [1];

  return allowedDirectionSigns.map((toDirectionSign) => {
    const targetOutgoingDirection = multiplyVector(
      target.road.direction,
      toDirectionSign,
    );

    const { turnDot, score } = getConnectionScore(
      sourceIncomingDirection,
      targetOutgoingDirection,
      target.priority,
      target.road,
    );

    const paddedT = clamp(
      target.t + THROUGH_ENTRY_T_PADDING * toDirectionSign,
      THROUGH_ROAD_MIN_T,
      THROUGH_ROAD_MAX_T,
    );

    return {
      id: `${source.cutKey}->${target.road.id}:through:${toDirectionSign}`,
      junctionKey: junction.key,

      fromSegmentId: source.road.id,
      fromRoadId: source.road.roadId,
      fromEndpointSide: source.side,
      fromEndpointCutKey: source.cutKey,

      toSegmentId: target.road.id,
      toRoadId: target.road.roadId,
      toRoad: target.road,
      toEndpointSide: null,
      toT: paddedT,
      toDirectionSign,

      turnDot,
      score,
      kind: "through",
    };
  });
}

export function buildConnectionsForJunction(
  junction: HomeDriveRoadJunction,
): readonly HomeDriveRoadTopologyConnection[] {
  if (junction.type === "terminal") {
    return [];
  }

  return junction.endpoints.flatMap((source) => {
    const endpointConnections = junction.endpoints
      .map((target) =>
        createEndpointToEndpointConnection(junction, source, target),
      )
      .filter(
        (
          connection,
        ): connection is HomeDriveRoadTopologyConnection =>
          connection !== null,
      );

    const throughConnections = junction.throughRoads.flatMap((throughRoad) =>
      createEndpointToThroughConnections(junction, source, throughRoad),
    );

    return [...endpointConnections, ...throughConnections].sort(
      (first, second) => second.score - first.score,
    );
  });
}

export function appendToMapArray<Key, Value>(
  map: Map<Key, Value[]>,
  key: Key,
  value: Value,
): void {
  const currentValues = map.get(key);

  if (!currentValues) {
    map.set(key, [value]);
    return;
  }

  currentValues.push(value);
}
