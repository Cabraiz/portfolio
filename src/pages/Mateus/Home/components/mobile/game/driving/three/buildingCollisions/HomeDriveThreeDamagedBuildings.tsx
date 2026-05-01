// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/HomeDriveThreeDamagedBuildings.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry } from "three";

import type {
  HomeDriveBuildingCollisionRuntimeState,
} from "../../domain/buildingCollisions";
import type {
  HomeDriveBuildingCollisionDestruction,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionDestruction.types";
import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  createHomeDriveThreeDamagedBuildingParts,
  type HomeDriveThreeDamagedBuildingBoxPart,
} from "./homeDriveThree.damagedBuildingGeometry";
import {
  createHomeDriveThreeDamagedBuildingMaterials,
  disposeHomeDriveThreeDamagedBuildingMaterials,
  getHomeDriveThreeDamagedBuildingMaterial,
  type HomeDriveThreeDamagedBuildingMaterialSet,
} from "./homeDriveThree.damagedBuildingMaterials";
import {
  getHomeDriveThreeDamagedBuildingGroupTransform,
  getHomeDriveThreeDamagedBuildingPartTransform,
} from "./homeDriveThree.damagedBuildingTransforms";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveBuildingCollisionRuntimeWithDestructions =
  HomeDriveBuildingCollisionRuntimeState &
    Readonly<{
      destructions?: readonly HomeDriveBuildingCollisionDestruction[];
    }>;

export type HomeDriveThreeDamagedBuildingsProps = Readonly<{
  buildings: readonly HomeDriveBuilding[];
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeWithDestructions>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleBuildings?: number;
  snapshotHz?: number;
}>;

type VisibleDamagedBuilding = Readonly<{
  building: HomeDriveBuilding;
  destruction: HomeDriveBuildingCollisionDestruction;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 620;
const DEFAULT_MAX_VISIBLE_BUILDINGS = 28;
const DEFAULT_SNAPSHOT_HZ = 8;

function getDistanceSquaredToRuntime(
  building: HomeDriveBuilding,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const carPosition = runtimeRef.current.car.position;

  return (
    (building.position.x - carPosition.x) ** 2 +
    (building.position.z - carPosition.z) ** 2
  );
}

function getVisibleDamagedBuildings(params: Readonly<{
  buildings: readonly HomeDriveBuilding[];
  destructions: readonly HomeDriveBuildingCollisionDestruction[];
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters: number;
  maxVisibleBuildings: number;
}>): readonly VisibleDamagedBuilding[] {
  const visibleRadiusSquared = params.visibleRadiusMeters * params.visibleRadiusMeters;
  const buildingById = new Map(
    params.buildings.map((building) => [building.id, building] as const),
  );

  return params.destructions
    .map((destruction): VisibleDamagedBuilding | null => {
      const building = buildingById.get(destruction.buildingId);

      if (!building || destruction.zones.length <= 0) {
        return null;
      }

      return {
        building,
        destruction,
      };
    })
    .filter((entry): entry is VisibleDamagedBuilding => Boolean(entry))
    .filter((entry) => {
      return (
        getDistanceSquaredToRuntime(entry.building, params.runtimeRef) <=
        visibleRadiusSquared
      );
    })
    .sort((first, second) => {
      return (
        getDistanceSquaredToRuntime(first.building, params.runtimeRef) -
        getDistanceSquaredToRuntime(second.building, params.runtimeRef)
      );
    })
    .slice(0, params.maxVisibleBuildings);
}

export function getHomeDriveDamagedBuildingIdsFromCollisionState(
  buildingCollisions: HomeDriveBuildingCollisionRuntimeWithDestructions,
): readonly string[] {
  return Array.from(
    new Set(
      (buildingCollisions.destructions ?? [])
        .filter((destruction) => destruction.zones.length > 0)
        .map((destruction) => destruction.buildingId),
    ),
  ).sort((first, second) => first.localeCompare(second));
}

function getVisibleDamagedBuildingsKey(
  buildings: readonly VisibleDamagedBuilding[],
): string {
  return buildings
    .map((entry) => entry.building.id + ":" + entry.destruction.serial)
    .join("|");
}

function DamagedBuildingPartMesh({
  building,
  part,
  boxGeometry,
  materials,
}: Readonly<{
  building: HomeDriveBuilding;
  part: HomeDriveThreeDamagedBuildingBoxPart;
  boxGeometry: BoxGeometry;
  materials: HomeDriveThreeDamagedBuildingMaterialSet;
}>) {
  const transform = getHomeDriveThreeDamagedBuildingPartTransform(part);
  const material = getHomeDriveThreeDamagedBuildingMaterial({
    building,
    part,
    materials,
  });

  return (
    <mesh
      geometry={boxGeometry}
      material={material}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={part.renderOrder}
      frustumCulled
    />
  );
}

function DamagedBuildingMesh({
  visibleBuilding,
  boxGeometry,
  materials,
}: Readonly<{
  visibleBuilding: VisibleDamagedBuilding;
  boxGeometry: BoxGeometry;
  materials: HomeDriveThreeDamagedBuildingMaterialSet;
}>) {
  const { building, destruction } = visibleBuilding;
  const groupTransform = getHomeDriveThreeDamagedBuildingGroupTransform(building, destruction.lean);

  const parts = useMemo(() => {
    return createHomeDriveThreeDamagedBuildingParts({
      building,
      destruction,
    });
  }, [building, destruction]);

  return (
    <group
      position={[
        groupTransform.position[0],
        groupTransform.position[1],
        groupTransform.position[2],
      ]}
      rotation={[
        groupTransform.rotation[0],
        groupTransform.rotation[1],
        groupTransform.rotation[2],
      ]}
    >
      {parts.map((part) => (
        <DamagedBuildingPartMesh
          key={part.id}
          building={building}
          part={part}
          boxGeometry={boxGeometry}
          materials={materials}
        />
      ))}
    </group>
  );
}

function HomeDriveThreeDamagedBuildings({
  buildings,
  buildingCollisionsRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleBuildings = DEFAULT_MAX_VISIBLE_BUILDINGS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeDamagedBuildingsProps) {
  const [visibleBuildings, setVisibleBuildings] = useState<
    readonly VisibleDamagedBuilding[]
  >([]);
  const lastCollisionSerialRef = useRef<number | null>(null);
  const lastVisibleBuildingsKeyRef = useRef("");

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => {
    return createHomeDriveThreeDamagedBuildingMaterials();
  }, []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      disposeHomeDriveThreeDamagedBuildingMaterials(materials);
    };
  }, [boxGeometry, materials]);

  useFrame((_, deltaSeconds) => {
    const currentSerial = buildingCollisionsRef.current.serial ?? null;

    if (currentSerial === lastCollisionSerialRef.current) {
      return;
    }

    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 12));
    const intervalSeconds = 1 / safeSnapshotHz;

    const accumulatorKey = "__homeDriveDamagedBuildingsAccumulator";
    const refAsAny = buildingCollisionsRef as unknown as Record<string, number>;
    const nextAccumulator = (refAsAny[accumulatorKey] ?? 0) + deltaSeconds;

    if (nextAccumulator < intervalSeconds) {
      refAsAny[accumulatorKey] = nextAccumulator;
      return;
    }

    refAsAny[accumulatorKey] = 0;
    lastCollisionSerialRef.current = currentSerial;

    const nextVisibleBuildings = getVisibleDamagedBuildings({
      buildings,
      destructions: buildingCollisionsRef.current.destructions ?? [],
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleBuildings,
    });
    const nextKey = getVisibleDamagedBuildingsKey(nextVisibleBuildings);

    if (nextKey === lastVisibleBuildingsKeyRef.current) {
      return;
    }

    lastVisibleBuildingsKeyRef.current = nextKey;
    setVisibleBuildings(nextVisibleBuildings);
  });

  if (visibleBuildings.length <= 0) {
    return null;
  }

  return (
    <group>
      {visibleBuildings.map((visibleBuilding) => (
        <DamagedBuildingMesh
          key={`${visibleBuilding.building.id}:${visibleBuilding.destruction.serial}`}
          visibleBuilding={visibleBuilding}
          boxGeometry={boxGeometry}
          materials={materials}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeDamagedBuildings);
