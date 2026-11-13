// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.parts.ts

import type { Material } from "three";
import type { HomeDriveVector2 } from "../../domain/homeDrive.types";
import {
	getHomeDriveUrbanFixtureCollisionImpact,
	type HomeDriveUrbanFixtureCollisionImpact,
	type HomeDriveUrbanFixtureCollisionRuntimeState,
	type HomeDriveUrbanStreetLight,
	type HomeDriveUrbanTrafficLight,
} from "../../domain/urbanFixtures";
import type {
	HomeDriveThreeUrbanFixtureMaterialKey,
} from "./homeDriveThree.urbanFixtureMaterials";

export type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeUrbanFixtureGeometryKind = "box" | "cylinder" | "sphere";

export type HomeDriveThreeUrbanFixturePart = Readonly<{
  id: string;
  geometryKind: HomeDriveThreeUrbanFixtureGeometryKind;
  materialKey: HomeDriveThreeUrbanFixtureMaterialKey;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
  renderOrder: number;
}>;

export type HomeDriveThreeUrbanFixtureBatch = Readonly<{
  id: string;
  geometryKind: HomeDriveThreeUrbanFixtureGeometryKind;
  materialKey: HomeDriveThreeUrbanFixtureMaterialKey;
  material: Material;
  instances: readonly HomeDriveThreeUrbanFixturePart[];
  renderOrder: number;
}>;

export type HomeDriveThreeUrbanFixtureSnapshot = Readonly<{
  streetLights: readonly HomeDriveUrbanStreetLight[];
  trafficLights: readonly HomeDriveUrbanTrafficLight[];
  key: string;
}>;

export const DEFAULT_VISIBLE_RADIUS_METERS = 780;
export const DEFAULT_MAX_VISIBLE_STREET_LIGHTS = 220;
export const DEFAULT_MAX_VISIBLE_TRAFFIC_LIGHTS = 96;
export const DEFAULT_SNAPSHOT_HZ = 6;

export const BASE_Y = 0.08;
export const DETAIL_EPSILON_Y = 0.004;
const FALL_ANIMATION_SETTLE_SECONDS = 0.28;

export function getVectorYawRad(vector: HomeDriveVector2): number {
  return Math.atan2(-vector.z, vector.x);
}

export function multiplyVector2(vector: HomeDriveVector2, scalar: number): HomeDriveVector2 {
  return {
    x: vector.x * scalar,
    z: vector.z * scalar,
  };
}

export function addVector2(first: HomeDriveVector2, second: HomeDriveVector2): HomeDriveVector2 {
  return {
    x: first.x + second.x,
    z: first.z + second.z,
  };
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeVector2OrFallback(
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

function easeOutCubic(value: number): number {
  const t = clampNumber(value, 0, 1);

  return 1 - Math.pow(1 - t, 3);
}

function getUrbanFixtureFallProgress(
  impact: HomeDriveUrbanFixtureCollisionImpact,
  nowSeconds: number,
): number {
  const durationSeconds = clampNumber(
    impact.fallDurationSeconds || 0.58,
    0.16,
    1.2,
  );
  const elapsedSeconds = Math.max(0, nowSeconds - impact.struckAtSeconds);

  if (elapsedSeconds >= durationSeconds) {
    return 1;
  }

  return easeOutCubic(elapsedSeconds / durationSeconds);
}

export function isUrbanFixtureImpactStillAnimating(
  impact: HomeDriveUrbanFixtureCollisionImpact,
  nowSeconds: number,
): boolean {
  return (
    nowSeconds - impact.struckAtSeconds <=
    (impact.fallDurationSeconds || 0.58) + FALL_ANIMATION_SETTLE_SECONDS
  );
}

function applyUrbanFixtureImpactToPart(
  part: HomeDriveThreeUrbanFixturePart,
  basePosition: HomeDriveVector2,
  impact: HomeDriveUrbanFixtureCollisionImpact | null | undefined,
  nowSeconds: number,
): HomeDriveThreeUrbanFixturePart {
  if (!impact || impact.leanRad <= 0) {
    return part;
  }

  const isGroundLocked =
    part.id.endsWith(":base-slab") ||
    part.id.endsWith(":base-collar") ||
    part.id.includes(":bolt-");

  if (isGroundLocked) {
    return part;
  }

  const progress = getUrbanFixtureFallProgress(impact, nowSeconds);

  if (progress <= 0.0001) {
    return part;
  }

  const fallDirection = normalizeVector2OrFallback(
    impact.fallDirection ?? impact.leanDirection,
    impact.leanDirection,
  );
  const settleWobbleRad =
    Math.sin(progress * Math.PI) * 0.035 * clampNumber(impact.severity, 0, 1.35);
  const fallRad = impact.leanRad * progress + settleWobbleRad;
  const twistRad = impact.twistRad * progress;
  const relativeX = part.position[0] - basePosition.x;
  const relativeY = Math.max(0, part.position[1] - BASE_Y);
  const relativeZ = part.position[2] - basePosition.z;
  const alongFallMeters =
    relativeX * fallDirection.x + relativeZ * fallDirection.z;
  const perpendicularX = relativeX - fallDirection.x * alongFallMeters;
  const perpendicularZ = relativeZ - fallDirection.z * alongFallMeters;
  const cosFall = Math.cos(fallRad);
  const sinFall = Math.sin(fallRad);

  /*
    Rotação em torno da base do poste. O eixo real é perpendicular ao vetor de
    queda; por isso decompomos o ponto em "distância na direção da queda" +
    "altura", rotacionamos esse plano e preservamos a componente perpendicular.
  */
  const nextAlongFallMeters = alongFallMeters * cosFall + relativeY * sinFall;
  const nextRelativeY = relativeY * cosFall - alongFallMeters * sinFall;
  const nextX =
    basePosition.x + perpendicularX + fallDirection.x * nextAlongFallMeters;
  const nextZ =
    basePosition.z + perpendicularZ + fallDirection.z * nextAlongFallMeters;
  const nextY = Math.max(BASE_Y + 0.025, BASE_Y + nextRelativeY);
  const rotationX = part.rotation[0] + fallDirection.z * fallRad;
  const rotationY = part.rotation[1] + twistRad;
  const rotationZ = part.rotation[2] - fallDirection.x * fallRad;

  return {
    ...part,
    position: [nextX, nextY, nextZ],
    rotation: [rotationX, rotationY, rotationZ],
  };
}

export function pushUrbanFixtureParts(
  parts: HomeDriveThreeUrbanFixturePart[],
  basePosition: HomeDriveVector2,
  impact: HomeDriveUrbanFixtureCollisionImpact | null | undefined,
  nowSeconds: number,
  ...fixtureParts: HomeDriveThreeUrbanFixturePart[]
): void {
  for (const part of fixtureParts) {
    parts.push(
      applyUrbanFixtureImpactToPart(part, basePosition, impact, nowSeconds),
    );
  }
}

export function getUrbanFixtureImpact(
  urbanFixtureCollisions:
    | HomeDriveUrbanFixtureCollisionRuntimeState
    | null
    | undefined,
  fixtureId: string,
): HomeDriveUrbanFixtureCollisionImpact | null {
  return getHomeDriveUrbanFixtureCollisionImpact(
    urbanFixtureCollisions,
    fixtureId,
  );
}

export function getArmDirection(fixture: Readonly<{
  roadNormal: HomeDriveVector2;
  side: -1 | 1;
}>): HomeDriveVector2 {
  return multiplyVector2(fixture.roadNormal, -fixture.side);
}

export function createPart(
  part: HomeDriveThreeUrbanFixturePart,
): HomeDriveThreeUrbanFixturePart {
  return part;
}
