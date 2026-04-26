import {
  blendHomeDriveAngleDeg,
  chooseHomeDriveUsableRoadHeadingDeg,
  clampHomeDriveWorldNumber,
  findClosestHomeDrivePointOnRoad,
  getHomeDrivePointDistance,
  getHomeDrivePointLocalToHeading,
  getHomeDriveTurnSideFromAngle,
  getShortestHomeDriveAngleDeg,
} from "./homeDrive.worldGeometry";
import type {
  HomeDriveNearestRoadResult,
  HomeDriveSnapRoadConfig,
  HomeDriveSnapRoadResult,
  HomeDriveWorldCarState,
  HomeDriveWorldDistrict,
  HomeDriveWorldIntersection,
  HomeDriveWorldLandmark,
  HomeDriveWorldMap,
  HomeDriveWorldPoint,
  HomeDriveWorldRoad,
  HomeDriveWorldRoadContext,
} from "./homeDrive.worldTypes";

const DEFAULT_SNAP_CONFIG: HomeDriveSnapRoadConfig = {
  enabled: true,
  snapDistanceMeters: 46,
  offRoadAllowed: true,
  headingSnapStrength: 0.012,
  maxHeadingSnapDeg: 28,
};

export function getHomeDriveWorldRoadById(
  map: Pick<HomeDriveWorldMap, "roads">,
  roadId?: string,
): HomeDriveWorldRoad | undefined {
  if (!roadId) {
    return undefined;
  }

  return map.roads.find((road) => road.id === roadId);
}

export function getHomeDriveWorldDistrictById(
  map: Pick<HomeDriveWorldMap, "districts">,
  districtId?: string,
): HomeDriveWorldDistrict | undefined {
  if (!districtId) {
    return undefined;
  }

  return map.districts.find((district) => district.id === districtId);
}

export function getNearestHomeDriveWorldDistrict(
  map: Pick<HomeDriveWorldMap, "districts">,
  point: HomeDriveWorldPoint,
): HomeDriveWorldDistrict | undefined {
  let nearest: HomeDriveWorldDistrict | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const district of map.districts) {
    const distance = getHomeDrivePointDistance(point, district.center);

    if (distance < nearestDistance) {
      nearest = district;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function findNearestHomeDriveWorldRoad(
  map: Pick<HomeDriveWorldMap, "roads">,
  point: HomeDriveWorldPoint,
  carHeadingDeg = 0,
): HomeDriveNearestRoadResult | undefined {
  let nearest: HomeDriveNearestRoadResult | undefined;

  map.roads.forEach((road, roadIndex) => {
    const closest = findClosestHomeDrivePointOnRoad(road, point, roadIndex);

    if (!closest) {
      return;
    }

    const usableHeadingDeg = chooseHomeDriveUsableRoadHeadingDeg(
      closest.segmentHeadingDeg,
      carHeadingDeg,
      road.bidirectional,
    );

    const candidate: HomeDriveNearestRoadResult = {
      road,
      roadIndex,
      segmentIndex: closest.segmentIndex,
      segmentStart: closest.segmentStart,
      segmentEnd: closest.segmentEnd,
      closestPoint: closest.closestPoint,
      distanceMeters: closest.distanceMeters,
      signedDistanceMeters: closest.signedDistanceMeters,
      segmentProgress: closest.segmentProgress,
      roadProgress: closest.roadProgress,
      segmentHeadingDeg: closest.segmentHeadingDeg,
      usableHeadingDeg,
      roadLengthMeters: closest.roadLengthMeters,
      isInsideRoad: closest.distanceMeters <= road.width * 0.5,
      side:
        Math.abs(closest.signedDistanceMeters) <= 0.75
          ? "center"
          : closest.signedDistanceMeters < 0
            ? "left"
            : "right",
    };

    if (!nearest || candidate.distanceMeters < nearest.distanceMeters) {
      nearest = candidate;
    }
  });

  return nearest;
}

export function createInitialHomeDriveWorldCarState(
  map: HomeDriveWorldMap,
): HomeDriveWorldCarState {
  const spawnRoad = getHomeDriveWorldRoadById(map, map.spawn.roadId);
  const districtId = spawnRoad?.districtId;

  return {
    x: map.spawn.position.x,
    y: map.spawn.position.y,
    headingDeg: map.spawn.headingDeg,
    speedKmh: map.spawn.speedKmh,
    steering: 0,
    currentRoadId: map.spawn.roadId,
    currentDistrictId: districtId,
    odometerMeters: 0,
    offRoadMeters: 0,
  };
}

export function clampHomeDriveCarToWorldBounds(
  car: HomeDriveWorldCarState,
  map: Pick<HomeDriveWorldMap, "worldBounds">,
): HomeDriveWorldCarState {
  return {
    ...car,
    x: clampHomeDriveWorldNumber(
      car.x,
      map.worldBounds.minX,
      map.worldBounds.maxX,
    ),
    y: clampHomeDriveWorldNumber(
      car.y,
      map.worldBounds.minY,
      map.worldBounds.maxY,
    ),
  };
}

export function snapHomeDriveCarToRoad(
  map: Pick<HomeDriveWorldMap, "roads" | "districts" | "worldBounds">,
  car: HomeDriveWorldCarState,
  config: Partial<HomeDriveSnapRoadConfig> = {},
): HomeDriveSnapRoadResult {
  const resolvedConfig = {
    ...DEFAULT_SNAP_CONFIG,
    ...config,
  };
  const nearestRoad = findNearestHomeDriveWorldRoad(
    map,
    { x: car.x, y: car.y },
    car.headingDeg,
  );

  if (!nearestRoad || !resolvedConfig.enabled) {
    return {
      car: clampHomeDriveCarToWorldBounds(car, map),
      nearestRoad,
      snapped: false,
      distanceToRoadMeters: nearestRoad?.distanceMeters ?? Number.POSITIVE_INFINITY,
    };
  }

  const shouldSnap =
    nearestRoad.distanceMeters <= resolvedConfig.snapDistanceMeters ||
    !resolvedConfig.offRoadAllowed;

  if (!shouldSnap) {
    const boundedCar = clampHomeDriveCarToWorldBounds(
      {
        ...car,
        currentRoadId: undefined,
        currentDistrictId: getNearestHomeDriveWorldDistrict(map, car)
          ?.id,
        offRoadMeters: car.offRoadMeters + nearestRoad.distanceMeters,
      },
      map,
    );

    return {
      car: boundedCar,
      nearestRoad,
      snapped: false,
      distanceToRoadMeters: nearestRoad.distanceMeters,
    };
  }

  const headingDelta = Math.abs(
    getShortestHomeDriveAngleDeg(car.headingDeg, nearestRoad.usableHeadingDeg),
  );
  const headingSnapProgress =
    headingDelta <= resolvedConfig.maxHeadingSnapDeg
      ? resolvedConfig.headingSnapStrength
      : resolvedConfig.headingSnapStrength * 0.32;

  const snappedCar = clampHomeDriveCarToWorldBounds(
    {
      ...car,
      x: nearestRoad.closestPoint.x,
      y: nearestRoad.closestPoint.y,
      headingDeg: blendHomeDriveAngleDeg(
        car.headingDeg,
        nearestRoad.usableHeadingDeg,
        headingSnapProgress,
      ),
      currentRoadId: nearestRoad.road.id,
      currentDistrictId: nearestRoad.road.districtId,
      offRoadMeters: 0,
    },
    map,
  );

  return {
    car: snappedCar,
    nearestRoad,
    snapped: true,
    distanceToRoadMeters: nearestRoad.distanceMeters,
  };
}

export function getNearbyHomeDriveWorldLandmarks(
  map: Pick<HomeDriveWorldMap, "landmarks">,
  point: HomeDriveWorldPoint,
  radiusMeters = 220,
): readonly HomeDriveWorldLandmark[] {
  return map.landmarks
    .map((landmark) => ({
      landmark,
      distance: getHomeDrivePointDistance(point, landmark.position),
    }))
    .filter((entry) => entry.distance <= Math.max(radiusMeters, entry.landmark.radius))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.landmark);
}

export function getCurrentHomeDriveWorldLandmark(
  map: Pick<HomeDriveWorldMap, "landmarks">,
  point: HomeDriveWorldPoint,
): HomeDriveWorldLandmark | undefined {
  return map.landmarks.find((landmark) => {
    const distance = getHomeDrivePointDistance(point, landmark.position);

    return distance <= landmark.radius;
  });
}

export function getHomeDriveIntersectionsAhead(
  map: Pick<HomeDriveWorldMap, "roads">,
  car: HomeDriveWorldCarState,
  options: Readonly<{
    radiusMeters?: number;
    maxForwardMeters?: number;
    minForwardMeters?: number;
    currentRoadId?: string;
  }> = {},
): readonly HomeDriveWorldIntersection[] {
  const radiusMeters = options.radiusMeters ?? 38;
  const maxForwardMeters = options.maxForwardMeters ?? 170;
  const minForwardMeters = options.minForwardMeters ?? -12;
  const currentRoadId = options.currentRoadId ?? car.currentRoadId;

  if (!currentRoadId) {
    return [];
  }

  const currentRoad = getHomeDriveWorldRoadById(map, currentRoadId);

  if (!currentRoad) {
    return [];
  }

  const intersections: HomeDriveWorldIntersection[] = [];

  for (const targetRoad of map.roads) {
    if (targetRoad.id === currentRoad.id) {
      continue;
    }

    for (const currentPoint of currentRoad.points) {
      const closestOnTarget = findClosestHomeDrivePointOnRoad(
        targetRoad,
        currentPoint,
      );

      if (!closestOnTarget || closestOnTarget.distanceMeters > radiusMeters) {
        continue;
      }

      const local = getHomeDrivePointLocalToHeading(
        closestOnTarget.closestPoint,
        { x: car.x, y: car.y },
        car.headingDeg,
      );

      if (
        local.forwardMeters < minForwardMeters ||
        local.forwardMeters > maxForwardMeters
      ) {
        continue;
      }

      const angleDeg = getShortestHomeDriveAngleDeg(
        car.headingDeg,
        closestOnTarget.segmentHeadingDeg,
      );
      const id = `${currentRoad.id}:${targetRoad.id}:${Math.round(
        closestOnTarget.closestPoint.x,
      )}:${Math.round(closestOnTarget.closestPoint.y)}`;

      if (intersections.some((intersection) => intersection.id === id)) {
        continue;
      }

      intersections.push({
        id,
        roadId: currentRoad.id,
        roadLabel: currentRoad.label,
        targetRoadId: targetRoad.id,
        targetRoadLabel: targetRoad.label,
        position: closestOnTarget.closestPoint,
        distanceMeters: Math.max(0, local.forwardMeters),
        angleDeg,
        turnSide: getHomeDriveTurnSideFromAngle(angleDeg),
      });
    }
  }

  return intersections.sort((a, b) => a.distanceMeters - b.distanceMeters);
}


export type HomeDriveTurnCandidateRoad = Readonly<{
  road: HomeDriveWorldRoad;
  roadId: string;
  roadLabel: string;
  turnSide: "left" | "right";
  targetHeadingDeg: number;
  snapPoint: HomeDriveWorldPoint;
  distanceMeters: number;
  forwardMeters: number;
  lateralMeters: number;
  angleDeg: number;
  score: number;
}>;

function getTurnSideFromSteer(
  steer: number,
): "left" | "right" | undefined {
  if (steer <= -0.42) {
    return "left";
  }

  if (steer >= 0.42) {
    return "right";
  }

  return undefined;
}

function getBestTargetRoadHeadingForTurn(
  carHeadingDeg: number,
  roadHeadingDeg: number,
  requestedSide: "left" | "right",
): Readonly<{ headingDeg: number; angleDeg: number }> | undefined {
  const candidates = [roadHeadingDeg, roadHeadingDeg + 180].map((headingDeg) => {
    const angleDeg = getShortestHomeDriveAngleDeg(carHeadingDeg, headingDeg);

    return {
      headingDeg,
      angleDeg,
      absAngleDeg: Math.abs(angleDeg),
      side: angleDeg < 0 ? "left" : "right",
    };
  });

  return candidates
    .filter((candidate) => {
      if (candidate.side !== requestedSide) {
        return false;
      }

      /*
        Abaixo de ~22 graus é quase uma continuação da mesma rua.
        Acima de ~150 graus é retorno, não uma dobra natural.
      */
      return candidate.absAngleDeg >= 22 && candidate.absAngleDeg <= 150;
    })
    .sort((a, b) => {
      const aTurnQuality = Math.abs(a.absAngleDeg - 78);
      const bTurnQuality = Math.abs(b.absAngleDeg - 78);

      return aTurnQuality - bTurnQuality;
    })[0];
}

export function findHomeDriveTurnCandidateRoad(
  map: Pick<HomeDriveWorldMap, "roads">,
  car: HomeDriveWorldCarState,
  steer: number,
  options: Readonly<{
    currentRoadId?: string;
    maxDistanceMeters?: number;
    maxForwardMeters?: number;
    maxLateralMeters?: number;
  }> = {},
): HomeDriveTurnCandidateRoad | undefined {
  const requestedSide = getTurnSideFromSteer(steer);

  if (!requestedSide) {
    return undefined;
  }

  const currentRoadId = options.currentRoadId ?? car.currentRoadId;
  const maxDistanceMeters = options.maxDistanceMeters ?? 72;
  const maxForwardMeters = options.maxForwardMeters ?? 92;
  const maxLateralMeters = options.maxLateralMeters ?? 58;
  const candidates: HomeDriveTurnCandidateRoad[] = [];

  for (const targetRoad of map.roads) {
    if (targetRoad.id === currentRoadId) {
      continue;
    }

    const closest = findClosestHomeDrivePointOnRoad(
      targetRoad,
      { x: car.x, y: car.y },
    );

    if (!closest) {
      continue;
    }

    const local = getHomeDrivePointLocalToHeading(
      closest.closestPoint,
      { x: car.x, y: car.y },
      car.headingDeg,
    );

    if (closest.distanceMeters > maxDistanceMeters) {
      continue;
    }

    if (local.forwardMeters < -18 || local.forwardMeters > maxForwardMeters) {
      continue;
    }

    if (Math.abs(local.rightMeters) > maxLateralMeters) {
      continue;
    }

    /*
      Preferimos a orientação da rua que de fato corresponde ao lado do volante.
      Em rua bidirecional, usar apenas chooseHomeDriveUsableRoadHeadingDeg
      pode escolher o sentido oposto e transformar uma esquerda em direita.
    */
    const headingCandidate = getBestTargetRoadHeadingForTurn(
      car.headingDeg,
      closest.segmentHeadingDeg,
      requestedSide,
    );

    if (!headingCandidate) {
      continue;
    }

    const sidePenalty =
      requestedSide === "left"
        ? Math.max(0, local.rightMeters) * 0.28
        : Math.max(0, -local.rightMeters) * 0.28;
    const forwardPenalty = Math.abs(local.forwardMeters - 18) * 0.18;
    const anglePenalty = Math.abs(Math.abs(headingCandidate.angleDeg) - 78) * 0.22;
    const distancePenalty = closest.distanceMeters;
    const score =
      distancePenalty +
      sidePenalty +
      forwardPenalty +
      anglePenalty -
      Math.abs(steer) * 12;

    candidates.push({
      road: targetRoad,
      roadId: targetRoad.id,
      roadLabel: targetRoad.label,
      turnSide: requestedSide,
      targetHeadingDeg: headingCandidate.headingDeg,
      snapPoint: closest.closestPoint,
      distanceMeters: closest.distanceMeters,
      forwardMeters: local.forwardMeters,
      lateralMeters: local.rightMeters,
      angleDeg: headingCandidate.angleDeg,
      score,
    });
  }

  return candidates.sort((a, b) => a.score - b.score)[0];
}


export function resolveHomeDriveWorldRoadContext(
  map: HomeDriveWorldMap,
  car: HomeDriveWorldCarState,
): HomeDriveWorldRoadContext {
  const nearestRoad = findNearestHomeDriveWorldRoad(
    map,
    { x: car.x, y: car.y },
    car.headingDeg,
  );
  const currentRoad = nearestRoad?.road ?? getHomeDriveWorldRoadById(
    map,
    car.currentRoadId,
  );
  const currentDistrict =
    getHomeDriveWorldDistrictById(map, currentRoad?.districtId) ??
    getHomeDriveWorldDistrictById(map, car.currentDistrictId) ??
    getNearestHomeDriveWorldDistrict(map, car);
  const nearbyLandmarks = getNearbyHomeDriveWorldLandmarks(map, car, 260);
  const currentLandmark = getCurrentHomeDriveWorldLandmark(map, car);
  const intersectionsAhead = getHomeDriveIntersectionsAhead(map, car, {
    radiusMeters: map.gameplay.intersectionRadiusMeters,
    currentRoadId: currentRoad?.id,
  });

  return {
    nearestRoad,
    currentRoad,
    currentDistrict,
    currentLandmark,
    nearbyLandmarks,
    intersectionsAhead,
  };
}
