// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/HomeDriveThreeBuildingDamageMeshes.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useMemo, useState } from "react";

import type { HomeDriveBuildingCollisionRuntimeState } from "../../domain/buildingCollisions";
import type {
  HomeDriveBuildingCollisionDeformation,
  HomeDriveBuildingDamageChunk,
  HomeDriveBuildingDamagePlane,
  HomeDriveBuildingDamageRebar,
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
import {
  getHomeDriveThreeDamageChunkTransform,
  getHomeDriveThreeDamagePlaneTransform,
  getHomeDriveThreeDamageRebarTransform,
} from "./homeDriveThree.buildingDamageTransforms";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveBuildingCollisionRuntimeWithDeformations =
  HomeDriveBuildingCollisionRuntimeState &
    Readonly<{
      deformations?: readonly HomeDriveBuildingCollisionDeformation[];
    }>;

export type HomeDriveThreeBuildingDamageMeshesProps = Readonly<{
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeWithDeformations>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleDeformations?: number;
  snapshotHz?: number;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 420;
const DEFAULT_MAX_VISIBLE_DEFORMATIONS = 18;
const DEFAULT_SNAPSHOT_HZ = 8;
const MAX_SECONDARY_PLANES_PER_DEFORMATION = 2;
const MAX_WALL_CHUNKS_PER_DEFORMATION = 3;
const MAX_REBARS_PER_DEFORMATION = 4;

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

function getVisibleDeformations(params: Readonly<{
  deformations: readonly HomeDriveBuildingCollisionDeformation[];
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters: number;
  maxVisibleDeformations: number;
}>): readonly HomeDriveBuildingCollisionDeformation[] {
  const visibleRadiusSquared =
    params.visibleRadiusMeters * params.visibleRadiusMeters;

  return params.deformations
    .filter((deformation) => {
      if (deformation.opacity <= 0.01) {
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
    .slice(0, params.maxVisibleDeformations);
}

function getSecondaryPlanes(
  deformation: HomeDriveBuildingCollisionDeformation,
): readonly HomeDriveBuildingDamagePlane[] {
  return deformation.planes
    .filter((plane) => {
      return plane.kind === "paint-transfer" || plane.kind === "radial-cracks";
    })
    .slice(0, MAX_SECONDARY_PLANES_PER_DEFORMATION);
}

function getWallChunks(
  deformation: HomeDriveBuildingCollisionDeformation,
): readonly HomeDriveBuildingDamageChunk[] {
  return deformation.chunks.slice(0, MAX_WALL_CHUNKS_PER_DEFORMATION);
}

function getRebars(
  deformation: HomeDriveBuildingCollisionDeformation,
): readonly HomeDriveBuildingDamageRebar[] {
  return deformation.rebars.slice(0, MAX_REBARS_PER_DEFORMATION);
}

function getPlaneMaterial(
  plane: HomeDriveBuildingDamagePlane,
  materials: HomeDriveThreeBuildingDamageMaterialSet,
) {
  switch (plane.kind) {
    case "radial-cracks":
      return materials.radialCracks;
    case "paint-transfer":
    default:
      return materials.paintTransfer;
  }
}

function getChunkMaterial(
  chunk: HomeDriveBuildingDamageChunk,
  materials: HomeDriveThreeBuildingDamageMaterialSet,
) {
  switch (chunk.kind) {
    case "dark-concrete":
      return materials.darkConcreteChunk;
    case "broken-plaster":
      return materials.plasterChunk;
    case "concrete-slab":
    default:
      return materials.concreteChunk;
  }
}

function DamagePlaneMesh({
  deformation,
  plane,
  materials,
  geometry,
}: Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  plane: HomeDriveBuildingDamagePlane;
  materials: HomeDriveThreeBuildingDamageMaterialSet;
  geometry: ReturnType<typeof createHomeDriveThreeBuildingDamageGeometries>["facadePlane"];
}>) {
  const sourceMaterial = getPlaneMaterial(plane, materials);
  const material = useMemo(() => {
    return cloneHomeDriveThreeBuildingDamageMaterial(
      sourceMaterial,
      deformation.opacity * plane.opacity * 0.72,
    );
  }, [deformation.opacity, plane.opacity, sourceMaterial]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const transform = getHomeDriveThreeDamagePlaneTransform(deformation, plane);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={89}
      frustumCulled
    />
  );
}

function DamageChunkMesh({
  deformation,
  chunk,
  materials,
  geometry,
}: Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  chunk: HomeDriveBuildingDamageChunk;
  materials: HomeDriveThreeBuildingDamageMaterialSet;
  geometry: ReturnType<typeof createHomeDriveThreeBuildingDamageGeometries>["chunkBox"];
}>) {
  const sourceMaterial = getChunkMaterial(chunk, materials);
  const material = useMemo(() => {
    return cloneHomeDriveThreeBuildingDamageMaterial(
      sourceMaterial,
      deformation.opacity * chunk.opacity * 0.88,
    );
  }, [chunk.opacity, deformation.opacity, sourceMaterial]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const transform = getHomeDriveThreeDamageChunkTransform(deformation, chunk);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={93}
      frustumCulled
    />
  );
}

function DamageRebarMesh({
  deformation,
  rebar,
  materials,
  geometry,
}: Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  rebar: HomeDriveBuildingDamageRebar;
  materials: HomeDriveThreeBuildingDamageMaterialSet;
  geometry: ReturnType<typeof createHomeDriveThreeBuildingDamageGeometries>["rebarCylinder"];
}>) {
  const material = useMemo(() => {
    return cloneHomeDriveThreeBuildingDamageMaterial(
      materials.rebar,
      deformation.opacity * rebar.opacity * 0.9,
    );
  }, [deformation.opacity, materials.rebar, rebar.opacity]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const transform = getHomeDriveThreeDamageRebarTransform(deformation, rebar);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={98}
      frustumCulled
    />
  );
}

function DamageDeformationGroup({
  deformation,
  materials,
  geometries,
}: Readonly<{
  deformation: HomeDriveBuildingCollisionDeformation;
  materials: HomeDriveThreeBuildingDamageMaterialSet;
  geometries: ReturnType<typeof createHomeDriveThreeBuildingDamageGeometries>;
}>) {
  const planes = getSecondaryPlanes(deformation);
  const chunks = getWallChunks(deformation);
  const rebars = getRebars(deformation);

  if (planes.length <= 0 && chunks.length <= 0 && rebars.length <= 0) {
    return null;
  }

  return (
    <group>
      {planes.map((plane) => (
        <DamagePlaneMesh
          key={plane.id}
          deformation={deformation}
          plane={plane}
          materials={materials}
          geometry={geometries.facadePlane}
        />
      ))}

      {chunks.map((chunk) => (
        <DamageChunkMesh
          key={chunk.id}
          deformation={deformation}
          chunk={chunk}
          materials={materials}
          geometry={geometries.chunkBox}
        />
      ))}

      {rebars.map((rebar) => (
        <DamageRebarMesh
          key={rebar.id}
          deformation={deformation}
          rebar={rebar}
          materials={materials}
          geometry={geometries.rebarCylinder}
        />
      ))}
    </group>
  );
}

function HomeDriveThreeBuildingDamageMeshes({
  buildingCollisionsRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleDeformations = DEFAULT_MAX_VISIBLE_DEFORMATIONS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeBuildingDamageMeshesProps) {
  const [visibleDeformations, setVisibleDeformations] = useState<
    readonly HomeDriveBuildingCollisionDeformation[]
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
    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 18));
    const intervalSeconds = 1 / safeSnapshotHz;

    const accumulatorKey = "__homeDriveBuildingDamageMeshesAccumulator";
    const refAsAny = buildingCollisionsRef as unknown as Record<string, number>;
    const nextAccumulator = (refAsAny[accumulatorKey] ?? 0) + deltaSeconds;

    if (nextAccumulator < intervalSeconds) {
      refAsAny[accumulatorKey] = nextAccumulator;
      return;
    }

    refAsAny[accumulatorKey] = 0;

    const nextVisibleDeformations = getVisibleDeformations({
      deformations: buildingCollisionsRef.current.deformations ?? [],
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleDeformations,
    });

    setVisibleDeformations((current) => {
      if (
        current.length === nextVisibleDeformations.length &&
        current.every(
          (deformation, index) => deformation === nextVisibleDeformations[index],
        )
      ) {
        return current;
      }

      return nextVisibleDeformations;
    });
  });

  if (visibleDeformations.length <= 0) {
    return null;
  }

  return (
    <group>
      {visibleDeformations.map((deformation) => (
        <DamageDeformationGroup
          key={deformation.id}
          deformation={deformation}
          materials={materials}
          geometries={geometries}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingDamageMeshes);
