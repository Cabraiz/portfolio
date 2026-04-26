import type {
  HomeDriveWorldPoint,
  HomeDriveWorldRoad,
} from "./homeDrive.worldTypes";

export const HOME_DRIVE_DEG_TO_RAD = Math.PI / 180;
export const HOME_DRIVE_RAD_TO_DEG = 180 / Math.PI;

export function clampHomeDriveWorldNumber(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function lerpHomeDriveWorldNumber(
  start: number,
  end: number,
  progress: number,
): number {
  return start + (end - start) * clampHomeDriveWorldNumber(progress, 0, 1);
}

export function smoothstepHomeDriveWorld(progress: number): number {
  const value = clampHomeDriveWorldNumber(progress, 0, 1);

  return value * value * (3 - 2 * value);
}

export function normalizeHomeDriveAngleDeg(angleDeg: number): number {
  if (!Number.isFinite(angleDeg)) {
    return 0;
  }

  const normalized = angleDeg % 360;

  return normalized < 0 ? normalized + 360 : normalized;
}

export function getShortestHomeDriveAngleDeg(
  fromDeg: number,
  toDeg: number,
): number {
  const from = normalizeHomeDriveAngleDeg(fromDeg);
  const to = normalizeHomeDriveAngleDeg(toDeg);
  const delta = ((to - from + 540) % 360) - 180;

  return delta;
}

export function blendHomeDriveAngleDeg(
  fromDeg: number,
  toDeg: number,
  progress: number,
): number {
  const delta = getShortestHomeDriveAngleDeg(fromDeg, toDeg);

  return normalizeHomeDriveAngleDeg(
    fromDeg + delta * clampHomeDriveWorldNumber(progress, 0, 1),
  );
}

export function getHomeDrivePointDistanceSquared(
  a: HomeDriveWorldPoint,
  b: HomeDriveWorldPoint,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return dx * dx + dy * dy;
}

export function getHomeDrivePointDistance(
  a: HomeDriveWorldPoint,
  b: HomeDriveWorldPoint,
): number {
  return Math.sqrt(getHomeDrivePointDistanceSquared(a, b));
}

/*
  Convenção do mundo:
  - headingDeg 0   => olhando para +Y
  - headingDeg 90  => olhando para +X
  - headingDeg 180 => olhando para -Y
  - headingDeg 270 => olhando para -X
*/
export function getHomeDriveHeadingDegBetweenPoints(
  from: HomeDriveWorldPoint,
  to: HomeDriveWorldPoint,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return 0;
  }

  return normalizeHomeDriveAngleDeg(
    Math.atan2(dx, dy) * HOME_DRIVE_RAD_TO_DEG,
  );
}

export function getHomeDriveForwardVectorFromHeading(
  headingDeg: number,
): HomeDriveWorldPoint {
  const radians = normalizeHomeDriveAngleDeg(headingDeg) * HOME_DRIVE_DEG_TO_RAD;

  return {
    x: Math.sin(radians),
    y: Math.cos(radians),
  };
}

export function getHomeDriveRightVectorFromHeading(
  headingDeg: number,
): HomeDriveWorldPoint {
  const radians = normalizeHomeDriveAngleDeg(headingDeg) * HOME_DRIVE_DEG_TO_RAD;

  return {
    x: Math.cos(radians),
    y: -Math.sin(radians),
  };
}

export function getHomeDrivePointFromHeadingDistance(
  origin: HomeDriveWorldPoint,
  headingDeg: number,
  distanceMeters: number,
): HomeDriveWorldPoint {
  const forward = getHomeDriveForwardVectorFromHeading(headingDeg);

  return {
    x: origin.x + forward.x * distanceMeters,
    y: origin.y + forward.y * distanceMeters,
  };
}

export type HomeDriveLocalPoint = Readonly<{
  rightMeters: number;
  forwardMeters: number;
}>;

export function getHomeDrivePointLocalToHeading(
  point: HomeDriveWorldPoint,
  origin: HomeDriveWorldPoint,
  headingDeg: number,
): HomeDriveLocalPoint {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const forward = getHomeDriveForwardVectorFromHeading(headingDeg);
  const right = getHomeDriveRightVectorFromHeading(headingDeg);

  return {
    rightMeters: dx * right.x + dy * right.y,
    forwardMeters: dx * forward.x + dy * forward.y,
  };
}

export type HomeDriveSegmentProjection = Readonly<{
  point: HomeDriveWorldPoint;
  progress: number;
  distanceMeters: number;
  signedDistanceMeters: number;
  headingDeg: number;
}>;

export function projectHomeDrivePointOnSegment(
  point: HomeDriveWorldPoint,
  segmentStart: HomeDriveWorldPoint,
  segmentEnd: HomeDriveWorldPoint,
): HomeDriveSegmentProjection {
  const segmentX = segmentEnd.x - segmentStart.x;
  const segmentY = segmentEnd.y - segmentStart.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared <= 0.000001) {
    return {
      point: segmentStart,
      progress: 0,
      distanceMeters: getHomeDrivePointDistance(point, segmentStart),
      signedDistanceMeters: 0,
      headingDeg: 0,
    };
  }

  const pointX = point.x - segmentStart.x;
  const pointY = point.y - segmentStart.y;
  const rawProgress =
    (pointX * segmentX + pointY * segmentY) / segmentLengthSquared;
  const progress = clampHomeDriveWorldNumber(rawProgress, 0, 1);
  const projectedPoint = {
    x: segmentStart.x + segmentX * progress,
    y: segmentStart.y + segmentY * progress,
  };
  const headingDeg = getHomeDriveHeadingDegBetweenPoints(
    segmentStart,
    segmentEnd,
  );

  /*
    Distância lateral no referencial do segmento.
    Positivo = lado direito do segmento.
    Negativo = lado esquerdo.
  */
  const local = getHomeDrivePointLocalToHeading(
    point,
    projectedPoint,
    headingDeg,
  );

  return {
    point: projectedPoint,
    progress,
    distanceMeters: getHomeDrivePointDistance(point, projectedPoint),
    signedDistanceMeters: local.rightMeters,
    headingDeg,
  };
}

export function getHomeDriveRoadLengthMeters(
  road: Pick<HomeDriveWorldRoad, "points">,
): number {
  let length = 0;

  for (let index = 1; index < road.points.length; index += 1) {
    length += getHomeDrivePointDistance(
      road.points[index - 1],
      road.points[index],
    );
  }

  return length;
}

export type HomeDriveClosestPointOnRoad = Readonly<{
  roadIndex?: number;
  segmentIndex: number;
  segmentStart: HomeDriveWorldPoint;
  segmentEnd: HomeDriveWorldPoint;
  closestPoint: HomeDriveWorldPoint;
  distanceMeters: number;
  signedDistanceMeters: number;
  segmentProgress: number;
  roadProgress: number;
  segmentHeadingDeg: number;
  roadLengthMeters: number;
  distanceFromRoadStartMeters: number;
}>;

export function findClosestHomeDrivePointOnRoad(
  road: Pick<HomeDriveWorldRoad, "points">,
  point: HomeDriveWorldPoint,
  roadIndex?: number,
): HomeDriveClosestPointOnRoad | undefined {
  if (road.points.length < 2) {
    return undefined;
  }

  const roadLengthMeters = Math.max(0.0001, getHomeDriveRoadLengthMeters(road));
  let walkedMeters = 0;
  let closest: HomeDriveClosestPointOnRoad | undefined;

  for (let segmentIndex = 1; segmentIndex < road.points.length; segmentIndex += 1) {
    const segmentStart = road.points[segmentIndex - 1];
    const segmentEnd = road.points[segmentIndex];
    const segmentLength = getHomeDrivePointDistance(segmentStart, segmentEnd);
    const projection = projectHomeDrivePointOnSegment(
      point,
      segmentStart,
      segmentEnd,
    );
    const distanceFromRoadStartMeters =
      walkedMeters + segmentLength * projection.progress;

    const candidate: HomeDriveClosestPointOnRoad = {
      roadIndex,
      segmentIndex: segmentIndex - 1,
      segmentStart,
      segmentEnd,
      closestPoint: projection.point,
      distanceMeters: projection.distanceMeters,
      signedDistanceMeters: projection.signedDistanceMeters,
      segmentProgress: projection.progress,
      roadProgress: clampHomeDriveWorldNumber(
        distanceFromRoadStartMeters / roadLengthMeters,
        0,
        1,
      ),
      segmentHeadingDeg: projection.headingDeg,
      roadLengthMeters,
      distanceFromRoadStartMeters,
    };

    if (!closest || candidate.distanceMeters < closest.distanceMeters) {
      closest = candidate;
    }

    walkedMeters += segmentLength;
  }

  return closest;
}

export function getHomeDrivePointOnRoadAtDistance(
  road: Pick<HomeDriveWorldRoad, "points">,
  distanceMeters: number,
): HomeDriveWorldPoint {
  if (road.points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (road.points.length === 1) {
    return road.points[0];
  }

  const targetDistance = Math.max(0, distanceMeters);
  let walkedMeters = 0;

  for (let index = 1; index < road.points.length; index += 1) {
    const segmentStart = road.points[index - 1];
    const segmentEnd = road.points[index];
    const segmentLength = getHomeDrivePointDistance(segmentStart, segmentEnd);

    if (walkedMeters + segmentLength >= targetDistance) {
      const progress = segmentLength <= 0
        ? 0
        : (targetDistance - walkedMeters) / segmentLength;

      return {
        x: lerpHomeDriveWorldNumber(segmentStart.x, segmentEnd.x, progress),
        y: lerpHomeDriveWorldNumber(segmentStart.y, segmentEnd.y, progress),
      };
    }

    walkedMeters += segmentLength;
  }

  return road.points[road.points.length - 1];
}

export function getHomeDriveRoadHeadingAtProgress(
  road: Pick<HomeDriveWorldRoad, "points">,
  progress: number,
): number {
  if (road.points.length < 2) {
    return 0;
  }

  const roadLength = getHomeDriveRoadLengthMeters(road);
  const targetDistance =
    clampHomeDriveWorldNumber(progress, 0, 1) * Math.max(0.0001, roadLength);
  let walkedMeters = 0;

  for (let index = 1; index < road.points.length; index += 1) {
    const segmentStart = road.points[index - 1];
    const segmentEnd = road.points[index];
    const segmentLength = getHomeDrivePointDistance(segmentStart, segmentEnd);

    if (walkedMeters + segmentLength >= targetDistance) {
      return getHomeDriveHeadingDegBetweenPoints(segmentStart, segmentEnd);
    }

    walkedMeters += segmentLength;
  }

  return getHomeDriveHeadingDegBetweenPoints(
    road.points[road.points.length - 2],
    road.points[road.points.length - 1],
  );
}

export function chooseHomeDriveUsableRoadHeadingDeg(
  roadHeadingDeg: number,
  carHeadingDeg: number,
  bidirectional: boolean,
): number {
  if (!bidirectional) {
    return normalizeHomeDriveAngleDeg(roadHeadingDeg);
  }

  const forwardDelta = Math.abs(
    getShortestHomeDriveAngleDeg(carHeadingDeg, roadHeadingDeg),
  );
  const reverseHeading = normalizeHomeDriveAngleDeg(roadHeadingDeg + 180);
  const reverseDelta = Math.abs(
    getShortestHomeDriveAngleDeg(carHeadingDeg, reverseHeading),
  );

  return reverseDelta < forwardDelta ? reverseHeading : roadHeadingDeg;
}

export function getHomeDriveTurnSideFromAngle(
  angleDeg: number,
): "left" | "right" | "front" | "behind" {
  const normalized = getShortestHomeDriveAngleDeg(0, angleDeg);
  const absolute = Math.abs(normalized);

  if (absolute <= 32) {
    return "front";
  }

  if (absolute >= 145) {
    return "behind";
  }

  return normalized < 0 ? "left" : "right";
}
