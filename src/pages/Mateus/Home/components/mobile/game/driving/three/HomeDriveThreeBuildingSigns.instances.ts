// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildingSigns.instances.ts

import { CanvasTexture } from "three";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import {
	getHomeDriveCommerceDescriptor,
	getHomeDriveStableStringSeed,
	shouldHomeDriveBuildingHaveCommerceSign,
	type HomeDriveCommerceCategory,
	type HomeDriveCommerceSignStyle,
} from "../domain/homeDrive.commerceNames";
import {
	createHomeDriveThreeBuildingFacadeTransform,
} from "./homeDriveThree.buildingFacadeFrame";
import {
	SIGN_SURFACE_OFFSET_METERS,
	clamp,
	createSignTexture,
} from "./HomeDriveThreeBuildingSigns.canvas";

export type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveBuildingSignInstance = Readonly<{
  id: string;
  buildingId: string;
  label: string;
  category: HomeDriveCommerceCategory;
  signStyle: HomeDriveCommerceSignStyle;
  texture: CanvasTexture;
  position: readonly [number, number, number];
  rotationYRad: number;
  widthMeters: number;
  heightMeters: number;
  renderOrder: number;
}>;

export const DEFAULT_MAX_SOURCE_BUILDINGS = 16384;
export const DEFAULT_MAX_VISIBLE_SIGNS = 420;
export const DEFAULT_VISIBLE_RADIUS_METERS = 520;

function getDistanceSquaredToRuntime(
  building: HomeDriveBuilding,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const car = runtimeRef.current.car;
  const dx = building.position.x - car.position.x;
  const dz = building.position.z - car.position.z;

  return dx * dx + dz * dz;
}

function shouldUseSignWithinRadius(
  building: HomeDriveBuilding,
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState> | undefined,
  visibleRadiusMeters: number,
): boolean {
  if (!runtimeRef) {
    return true;
  }

  return (
    getDistanceSquaredToRuntime(building, runtimeRef) <=
    visibleRadiusMeters * visibleRadiusMeters
  );
}

function getSignSizeMeters(
  building: HomeDriveBuilding,
  signStyle: HomeDriveCommerceSignStyle,
): Readonly<{
  widthMeters: number;
  heightMeters: number;
}> {
  if (signStyle === "vertical") {
    return {
      widthMeters: clamp(building.widthMeters * 0.22, 2.4, 4.4),
      heightMeters: clamp(building.heightMeters * 0.22, 3.2, 7.8),
    };
  }

  if (building.kind === "office") {
    return {
      widthMeters: clamp(building.widthMeters * 0.58, 5.2, 13.5),
      heightMeters: clamp(building.heightMeters * 0.045, 1.4, 2.4),
    };
  }

  if (building.kind === "warehouse") {
    return {
      widthMeters: clamp(building.widthMeters * 0.48, 5.4, 14.5),
      heightMeters: clamp(building.heightMeters * 0.11, 1.6, 2.8),
    };
  }

  return {
    widthMeters: clamp(building.widthMeters * 0.58, 3.8, 11.6),
    heightMeters: clamp(building.heightMeters * 0.12, 1.35, 2.35),
  };
}

function getSignLocalY(
  building: HomeDriveBuilding,
  signStyle: HomeDriveCommerceSignStyle,
): number {
  if (signStyle === "vertical") {
    return clamp(building.heightMeters * 0.45, 3.4, building.heightMeters - 1.4);
  }

  switch (building.kind) {
    case "office":
      return clamp(building.heightMeters * 0.24, 4.6, building.heightMeters - 1.8);

    case "warehouse":
      return clamp(building.heightMeters * 0.58, 3.6, building.heightMeters - 1.1);

    case "apartment":
      return clamp(3.6, 2.8, building.heightMeters - 1.2);

    case "commerce":
    default:
      return clamp(3.35, 2.7, building.heightMeters - 1.05);
  }
}

export function createBuildingSignInstance(
  building: HomeDriveBuilding,
): HomeDriveBuildingSignInstance | null {
  const descriptor = getHomeDriveCommerceDescriptor(building);
  const label = building.commerceName ?? descriptor.name;
  const category = building.commerceCategory ?? descriptor.category;
  const signStyle = building.signStyle ?? descriptor.signStyle;

  const texture = createSignTexture(label, category, signStyle, descriptor.seed);

  if (!texture) {
    return null;
  }

  const { widthMeters, heightMeters } = getSignSizeMeters(building, signStyle);

  const horizontalSeed = getHomeDriveStableStringSeed(
    `${building.id}:sign-x:${building.variant}`,
    101,
  );

  const maxLocalX = Math.max(0, building.widthMeters * 0.5 - widthMeters * 0.55);
  const localX =
    signStyle === "vertical"
      ? (horizontalSeed > 0.5 ? 1 : -1) * maxLocalX
      : (horizontalSeed - 0.5) * maxLocalX * 0.55;

  const localY = getSignLocalY(building, signStyle);
  const transform = createHomeDriveThreeBuildingFacadeTransform(building, {
    localX,
    localY,
    width: widthMeters,
    height: heightMeters,
    geometryKind: "plane",
    surfaceOffsetMeters: SIGN_SURFACE_OFFSET_METERS,
  });

  return {
    id: `${building.id}::sign`,
    buildingId: building.id,
    label,
    category,
    signStyle,
    texture,
    position: transform.position,
    rotationYRad: transform.rotationYRad,
    widthMeters,
    heightMeters,
    renderOrder: signStyle === "neon" ? 31 : 29,
  };
}

export function selectSignBuildings(
  buildings: readonly HomeDriveBuilding[],
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState> | undefined,
  visibleRadiusMeters: number,
  maxVisibleSigns: number,
): readonly HomeDriveBuilding[] {
  return buildings
    .filter((building) => {
      if (!shouldHomeDriveBuildingHaveCommerceSign(building)) {
        return false;
      }

      return shouldUseSignWithinRadius(building, runtimeRef, visibleRadiusMeters);
    })
    .sort((first, second) => {
      const firstDistance = getDistanceSquaredToRuntime(first, runtimeRef);
      const secondDistance = getDistanceSquaredToRuntime(second, runtimeRef);

      if (firstDistance !== secondDistance) {
        return firstDistance - secondDistance;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, maxVisibleSigns);
}
