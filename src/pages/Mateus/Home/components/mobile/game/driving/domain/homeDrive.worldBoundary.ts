// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.worldBoundary.ts

import { clamp } from "./homeDrive.math";
import type { HomeDriveCarState, HomeDriveVector2 } from "./homeDrive.types";
import {
  HOME_DRIVE_WORLD_BOUNDS,
  clampWorldPositionToBounds,
} from "./homeDrive.worldMap";
import type { HomeDriveWorldBounds } from "./homeDrive.worldMap.types";

export type HomeDriveWorldBoundarySide =
  | "north"
  | "south"
  | "east"
  | "west";

export type HomeDriveWorldBoundaryCorner =
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

export type HomeDriveWorldBoundaryHitSide =
  | HomeDriveWorldBoundarySide
  | HomeDriveWorldBoundaryCorner
  | "none";

export type HomeDrivePlayableWorldBounds = Readonly<{
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}>;

export type HomeDriveWorldBoundaryDistances = Readonly<{
  west: number;
  east: number;
  south: number;
  north: number;
  nearestDistanceMeters: number;
  nearestSide: HomeDriveWorldBoundarySide;
}>;

export type HomeDriveBoundaryCollisionOptions = Readonly<{
  /**
   * Pequeno recuo interno para evitar o carro ficar exatamente na borda matemática.
   * A montanha visual fica fora do mapa; o carro fica preso um pouco antes dela.
   */
  insetMeters: number;

  /**
   * Quanto da velocidade sobra quando bate na borda.
   * 0 = para seco.
   * 0.08 = mantém só 8% da velocidade.
   */
  collisionSpeedRetention: number;
}>;

export type HomeDriveBoundaryCollisionResolution = Readonly<{
  position: HomeDriveVector2;
  speedMps: number;
  didCollide: boolean;
  didCollideX: boolean;
  didCollideZ: boolean;
  hitSide: HomeDriveWorldBoundaryHitSide;
}>;

export const HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS = 5.5;
export const HOME_DRIVE_BOUNDARY_SOFT_ZONE_METERS = 72;
export const HOME_DRIVE_BOUNDARY_MIN_DRAG_MULTIPLIER = 0.22;

const DEFAULT_BOUNDARY_COLLISION_OPTIONS: HomeDriveBoundaryCollisionOptions = {
  insetMeters: HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
  collisionSpeedRetention: 0.08,
};

function getInsetWorldBounds(
  bounds: HomeDriveWorldBounds,
  insetMeters: number,
): HomeDrivePlayableWorldBounds {
  const safeInsetX = Math.min(
    Math.max(0, insetMeters),
    Math.max(0, (bounds.maxX - bounds.minX) * 0.48),
  );

  const safeInsetZ = Math.min(
    Math.max(0, insetMeters),
    Math.max(0, (bounds.maxY - bounds.minY) * 0.48),
  );

  return {
    minX: bounds.minX + safeInsetX,
    maxX: bounds.maxX - safeInsetX,
    minZ: bounds.minY + safeInsetZ,
    maxZ: bounds.maxY - safeInsetZ,
  };
}

function getBoundaryHitSide(
  didCollideX: boolean,
  didCollideZ: boolean,
  proposedPosition: HomeDriveVector2,
  resolvedPosition: HomeDriveVector2,
): HomeDriveWorldBoundaryHitSide {
  if (!didCollideX && !didCollideZ) {
    return "none";
  }

  const horizontalSide: HomeDriveWorldBoundarySide | null = didCollideX
    ? proposedPosition.x > resolvedPosition.x
      ? "east"
      : "west"
    : null;

  const verticalSide: HomeDriveWorldBoundarySide | null = didCollideZ
    ? proposedPosition.z > resolvedPosition.z
      ? "north"
      : "south"
    : null;

  if (horizontalSide && verticalSide) {
    return `${verticalSide}-${horizontalSide}` as HomeDriveWorldBoundaryCorner;
  }

  return horizontalSide ?? verticalSide ?? "none";
}

export function getHomeDrivePlayableWorldBounds(
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDrivePlayableWorldBounds {
  return getInsetWorldBounds(bounds, insetMeters);
}

export function clampHomeDrivePositionToPlayableBounds(
  position: HomeDriveVector2,
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDriveVector2 {
  const playableBounds = getHomeDrivePlayableWorldBounds(insetMeters, bounds);

  return {
    x: clamp(position.x, playableBounds.minX, playableBounds.maxX),
    z: clamp(position.z, playableBounds.minZ, playableBounds.maxZ),
  };
}

export function clampHomeDrivePositionToWorldBounds(
  position: HomeDriveVector2,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDriveVector2 {
  return clampWorldPositionToBounds(position, bounds);
}

export function isHomeDrivePositionInsidePlayableBounds(
  position: HomeDriveVector2,
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): boolean {
  const playableBounds = getHomeDrivePlayableWorldBounds(insetMeters, bounds);

  return (
    position.x >= playableBounds.minX &&
    position.x <= playableBounds.maxX &&
    position.z >= playableBounds.minZ &&
    position.z <= playableBounds.maxZ
  );
}

export function getHomeDriveWorldBoundaryDistances(
  position: HomeDriveVector2,
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
  bounds: HomeDriveWorldBounds = HOME_DRIVE_WORLD_BOUNDS,
): HomeDriveWorldBoundaryDistances {
  const playableBounds = getHomeDrivePlayableWorldBounds(insetMeters, bounds);

  const west = position.x - playableBounds.minX;
  const east = playableBounds.maxX - position.x;
  const south = position.z - playableBounds.minZ;
  const north = playableBounds.maxZ - position.z;

  const entries: readonly Readonly<{
    side: HomeDriveWorldBoundarySide;
    distance: number;
  }>[] = [
    { side: "west", distance: west },
    { side: "east", distance: east },
    { side: "south", distance: south },
    { side: "north", distance: north },
  ];

  const nearest = entries.reduce((currentNearest, item) => {
    return item.distance < currentNearest.distance ? item : currentNearest;
  }, entries[0]);

  return {
    west,
    east,
    south,
    north,
    nearestDistanceMeters: nearest.distance,
    nearestSide: nearest.side,
  };
}

export function getHomeDriveBoundaryProximity(
  position: HomeDriveVector2,
  softZoneMeters = HOME_DRIVE_BOUNDARY_SOFT_ZONE_METERS,
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
): number {
  const distances = getHomeDriveWorldBoundaryDistances(position, insetMeters);
  const safeSoftZoneMeters = Math.max(1, softZoneMeters);

  return clamp(
    1 - distances.nearestDistanceMeters / safeSoftZoneMeters,
    0,
    1,
  );
}

export function getHomeDriveBoundaryDragMultiplier(
  position: HomeDriveVector2,
  softZoneMeters = HOME_DRIVE_BOUNDARY_SOFT_ZONE_METERS,
  insetMeters = HOME_DRIVE_BOUNDARY_COLLISION_INSET_METERS,
): number {
  const proximity = getHomeDriveBoundaryProximity(
    position,
    softZoneMeters,
    insetMeters,
  );

  return clamp(
    1 - proximity,
    HOME_DRIVE_BOUNDARY_MIN_DRAG_MULTIPLIER,
    1,
  );
}

export function resolveHomeDriveBoundaryCollision(
  car: HomeDriveCarState,
  proposedPosition: HomeDriveVector2,
  options: Partial<HomeDriveBoundaryCollisionOptions> = {},
): HomeDriveBoundaryCollisionResolution {
  const resolvedOptions = {
    ...DEFAULT_BOUNDARY_COLLISION_OPTIONS,
    ...options,
  };

  const resolvedPosition = clampHomeDrivePositionToPlayableBounds(
    proposedPosition,
    resolvedOptions.insetMeters,
  );

  const didCollideX = resolvedPosition.x !== proposedPosition.x;
  const didCollideZ = resolvedPosition.z !== proposedPosition.z;
  const didCollide = didCollideX || didCollideZ;

  return {
    position: resolvedPosition,
    speedMps: didCollide
      ? car.speedMps * resolvedOptions.collisionSpeedRetention
      : car.speedMps,
    didCollide,
    didCollideX,
    didCollideZ,
    hitSide: getBoundaryHitSide(
      didCollideX,
      didCollideZ,
      proposedPosition,
      resolvedPosition,
    ),
  };
}
