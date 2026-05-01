// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/HomeDriveThreeBuildingDebris.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useMemo, useState } from "react";

import type { HomeDriveBuildingCollisionRuntimeState } from "../../domain/buildingCollisions";
import type {
  HomeDriveBuildingCollisionDeformation,
  HomeDriveBuildingDamageDebrisPiece,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionDeformation.types";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  createHomeDriveThreeBuildingDamageGeometries,
  disposeHomeDriveThreeBuildingDamageGeometries,
} from "./homeDriveThree.buildingDamageGeometry";
import {
  cloneHomeDriveThreeBuildingDamageMaterial,
  createHomeDriveThreeBuildingDamageMaterials,
  disposeHomeDriveThreeBuildingDamageMaterials,
  type HomeDriveThreeBuildingDamageMaterialSet,
} from "./homeDriveThree.buildingDamageMaterials";
import { getHomeDriveThreeDamageDebrisTransform } from "./homeDriveThree.buildingDamageTransforms";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveBuildingCollisionRuntimeWithDeformations =
  HomeDriveBuildingCollisionRuntimeState &
    Readonly<{
      deformations?: readonly HomeDriveBuildingCollisionDeformation[];
    }>;

type VisibleDebrisPiece = Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  debris: HomeDriveBuildingDamageDebrisPiece;
}>;

export type HomeDriveThreeBuildingDebrisProps = Readonly<{
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeWithDeformations>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisiblePieces?: number;
  snapshotHz?: number;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 280;
const DEFAULT_MAX_VISIBLE_PIECES = 48;
const DEFAULT_SNAPSHOT_HZ = 6;

function getDistanceSquaredToRuntime(
  deformation: HomeDriveBuildingCollisionDeformation,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const carPosition = runtimeRef.current.car.position;

  return (
    (deformation.position.x - carPosition.x) ** 2 +
    (deformation.position.z - carPosition.z) ** 2
  );
}

function getVisibleDebris(params: Readonly<{
  deformations: readonly HomeDriveBuildingCollisionDeformation[];
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters: number;
  maxVisiblePieces: number;
}>): readonly VisibleDebrisPiece[] {
  const visibleRadiusSquared =
    params.visibleRadiusMeters * params.visibleRadiusMeters;

  return params.deformations
    .filter((deformation) => {
      if (deformation.opacity <= 0.01 || deformation.debris.length <= 0) {
        return false;
      }

      return (
        getDistanceSquaredToRuntime(deformation, params.runtimeRef) <=
        visibleRadiusSquared
      );
    })
    .sort((first, second) => {
      return (
        getDistanceSquaredToRuntime(first, params.runtimeRef) -
        getDistanceSquaredToRuntime(second, params.runtimeRef)
      );
    })
    .flatMap((deformation) => {
      return deformation.debris.map((debris) => ({
        deformation,
        debris,
      }));
    })
    .slice(0, params.maxVisiblePieces);
}

function getDebrisMaterial(
  debris: HomeDriveBuildingDamageDebrisPiece,
  materials: HomeDriveThreeBuildingDamageMaterialSet,
) {
  switch (debris.kind) {
    case "dark-concrete":
      return materials.debrisDarkConcrete;
    case "plaster":
      return materials.debrisPlaster;
    case "dust-clump":
      return materials.debrisDust;
    case "concrete":
    default:
      return materials.debrisConcrete;
  }
}

function DebrisPieceMesh({
  visiblePiece,
  materials,
  geometry,
}: Readonly<{
  visiblePiece: VisibleDebrisPiece;
  materials: HomeDriveThreeBuildingDamageMaterialSet;
  geometry: ReturnType<typeof createHomeDriveThreeBuildingDamageGeometries>["debrisBox"];
}>) {
  const { deformation, debris } = visiblePiece;
  const sourceMaterial = getDebrisMaterial(debris, materials);

  const material = useMemo(() => {
    return cloneHomeDriveThreeBuildingDamageMaterial(
      sourceMaterial,
      deformation.opacity * debris.opacity * 0.86,
    );
  }, [debris.opacity, deformation.opacity, sourceMaterial]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const transform = getHomeDriveThreeDamageDebrisTransform(
    deformation,
    debris,
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={66}
      frustumCulled
    />
  );
}

function HomeDriveThreeBuildingDebris({
  buildingCollisionsRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisiblePieces = DEFAULT_MAX_VISIBLE_PIECES,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeBuildingDebrisProps) {
  const [visibleDebris, setVisibleDebris] = useState<
    readonly VisibleDebrisPiece[]
  >([]);

  const materials = useMemo(() => {
    return createHomeDriveThreeBuildingDamageMaterials();
  }, []);

  const geometries = useMemo(() => {
    return createHomeDriveThreeBuildingDamageGeometries();
  }, []);

  useEffect(() => {
    return () => {
      disposeHomeDriveThreeBuildingDamageMaterials(materials);
      disposeHomeDriveThreeBuildingDamageGeometries(geometries);
    };
  }, [geometries, materials]);

  useFrame((_, deltaSeconds) => {
    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 12));
    const intervalSeconds = 1 / safeSnapshotHz;

    const accumulatorKey = "__homeDriveBuildingDebrisAccumulator";
    const refAsAny = buildingCollisionsRef as unknown as Record<string, number>;
    const nextAccumulator = (refAsAny[accumulatorKey] ?? 0) + deltaSeconds;

    if (nextAccumulator < intervalSeconds) {
      refAsAny[accumulatorKey] = nextAccumulator;
      return;
    }

    refAsAny[accumulatorKey] = 0;

    const nextVisibleDebris = getVisibleDebris({
      deformations: buildingCollisionsRef.current.deformations ?? [],
      runtimeRef,
      visibleRadiusMeters,
      maxVisiblePieces,
    });

    setVisibleDebris((current) => {
      if (
        current.length === nextVisibleDebris.length &&
        current.every((piece, index) => piece === nextVisibleDebris[index])
      ) {
        return current;
      }

      return nextVisibleDebris;
    });
  });

  if (visibleDebris.length <= 0) {
    return null;
  }

  return (
    <group>
      {visibleDebris.map((visiblePiece) => (
        <DebrisPieceMesh
          key={`${visiblePiece.deformation.id}:${visiblePiece.debris.id}`}
          visiblePiece={visiblePiece}
          materials={materials}
          geometry={geometries.debrisBox}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingDebris);
