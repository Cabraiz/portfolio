// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionBounds.ts

import type { HomeDriveBuilding } from "../homeDrive.building.types";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveBuildingCollisionBounds,
  HomeDriveBuildingCollisionFace,
  HomeDriveBuildingCollisionHit,
} from "./homeDrive.buildingCollision.types";

const DEFAULT_CONTACT_Y_RATIO = 0.28;
const MIN_CONTACT_Y_METERS = 1.1;
const MAX_CONTACT_Y_METERS = 6.8;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function dot(first: HomeDriveVector2, second: HomeDriveVector2): number {
  return first.x * second.x + first.z * second.z;
}

function getDistanceMeters(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function normalizeVectorOrFallback(
  vector: HomeDriveVector2,
  fallback: HomeDriveVector2,
): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function multiplyVector(vector: HomeDriveVector2, amount: number): HomeDriveVector2 {
  return {
    x: vector.x * amount,
    z: vector.z * amount,
  };
}

function addVectors(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): HomeDriveVector2 {
  return {
    x: first.x + second.x,
    z: first.z + second.z,
  };
}

function getBuildingRightVector(rotationYRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(rotationYRad),
    z: -Math.sin(rotationYRad),
  };
}

function getBuildingForwardVector(rotationYRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(rotationYRad),
    z: Math.cos(rotationYRad),
  };
}

function getCarFallbackNormal(car: HomeDriveCarState): HomeDriveVector2 {
  return {
    x: -Math.sin(car.headingRad),
    z: -Math.cos(car.headingRad),
  };
}

function getFaceFromAxis(params: {
  axis: "x" | "z";
  sign: number;
}): HomeDriveBuildingCollisionFace {
  if (params.axis === "x") {
    return params.sign >= 0 ? "right" : "left";
  }

  return params.sign >= 0 ? "front" : "back";
}

function getContactY(building: HomeDriveBuilding): number {
  return clamp(
    building.heightMeters * DEFAULT_CONTACT_Y_RATIO,
    MIN_CONTACT_Y_METERS,
    Math.min(MAX_CONTACT_Y_METERS, building.heightMeters * 0.72),
  );
}

export function getHomeDriveBuildingCollisionBounds(
  building: HomeDriveBuilding,
): HomeDriveBuildingCollisionBounds {
  return {
    buildingId: building.id,
    center: building.position,
    halfWidthMeters: Math.max(0.1, building.widthMeters / 2),
    halfDepthMeters: Math.max(0.1, building.depthMeters / 2),
    heightMeters: Math.max(0.1, building.heightMeters),
    rotationYRad: building.rotationYRad,
    right: getBuildingRightVector(building.rotationYRad),
    forward: getBuildingForwardVector(building.rotationYRad),
  };
}

export function getHomeDriveBuildingCollisionRadiusMeters(
  building: HomeDriveBuilding,
): number {
  return Math.hypot(building.widthMeters, building.depthMeters) / 2;
}

export function getHomeDriveBuildingsNearPosition(
  buildings: readonly HomeDriveBuilding[],
  position: HomeDriveVector2,
  options: Readonly<{
    radiusMeters?: number;
    maxBuildings?: number;
  }> = {},
): readonly HomeDriveBuilding[] {
  const radiusMeters = options.radiusMeters ?? 88;
  const maxBuildings = options.maxBuildings ?? 28;
  const radiusSquared = radiusMeters * radiusMeters;

  return buildings
    .map((building) => {
      const distanceSquared =
        (building.position.x - position.x) ** 2 +
        (building.position.z - position.z) ** 2;

      return {
        building,
        distanceSquared,
      };
    })
    .filter(({ building, distanceSquared }) => {
      const buildingRadius = getHomeDriveBuildingCollisionRadiusMeters(building);
      const inflatedRadius = radiusMeters + buildingRadius;

      return distanceSquared <= Math.max(radiusSquared, inflatedRadius * inflatedRadius);
    })
    .sort((first, second) => first.distanceSquared - second.distanceSquared)
    .slice(0, maxBuildings)
    .map(({ building }) => building);
}

export function resolveHomeDriveCarBuildingCollisionHit(
  car: HomeDriveCarState,
  building: HomeDriveBuilding,
  playerRadiusMeters: number,
): HomeDriveBuildingCollisionHit | null {
  const bounds = getHomeDriveBuildingCollisionBounds(building);
  const deltaFromBuildingToCar: HomeDriveVector2 = {
    x: car.position.x - bounds.center.x,
    z: car.position.z - bounds.center.z,
  };

  const localX = dot(deltaFromBuildingToCar, bounds.right);
  const localZ = dot(deltaFromBuildingToCar, bounds.forward);

  const expandedHalfWidth = bounds.halfWidthMeters + playerRadiusMeters;
  const expandedHalfDepth = bounds.halfDepthMeters + playerRadiusMeters;

  const absLocalX = Math.abs(localX);
  const absLocalZ = Math.abs(localZ);

  if (absLocalX > expandedHalfWidth || absLocalZ > expandedHalfDepth) {
    return null;
  }

  const overlapX = expandedHalfWidth - absLocalX;
  const overlapZ = expandedHalfDepth - absLocalZ;

  const useXFace = overlapX < overlapZ;
  const sign = useXFace
    ? localX >= 0 ? 1 : -1
    : localZ >= 0 ? 1 : -1;

  const face = getFaceFromAxis({
    axis: useXFace ? "x" : "z",
    sign,
  });

  const normalCandidate = useXFace
    ? multiplyVector(bounds.right, sign)
    : multiplyVector(bounds.forward, sign);

  const normalFromBuildingToPlayer = normalizeVectorOrFallback(
    normalCandidate,
    getCarFallbackNormal(car),
  );

  const clampedLocalX = clamp(localX, -bounds.halfWidthMeters, bounds.halfWidthMeters);
  const clampedLocalZ = clamp(localZ, -bounds.halfDepthMeters, bounds.halfDepthMeters);

  const contactPosition = addVectors(
    bounds.center,
    addVectors(
      multiplyVector(bounds.right, clampedLocalX),
      multiplyVector(bounds.forward, clampedLocalZ),
    ),
  );

  return {
    building,
    bounds,
    face,
    normalFromBuildingToPlayer,
    contactPosition,
    contactYMeters: getContactY(building),
    overlapMeters: Math.max(0, Math.min(overlapX, overlapZ)),
    distanceMeters: getDistanceMeters(car.position, building.position),
  };
}
