// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/HomeDriveThreeBuildingCollisionMarks.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { MeshBasicMaterial, PlaneGeometry } from "three";

import type {
  HomeDriveBuildingCollisionMark,
  HomeDriveBuildingCollisionRuntimeState,
} from "../../domain/buildingCollisions";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  createHomeDriveThreeBuildingCollisionComicMaterial,
  createHomeDriveThreeBuildingCollisionMaterials,
  disposeHomeDriveThreeBuildingCollisionMaterials,
} from "./homeDriveThree.buildingCollisionMaterials";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeBuildingCollisionMarksProps = Readonly<{
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleMarks?: number;
  snapshotHz?: number;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 420;
const DEFAULT_MAX_VISIBLE_MARKS = 84;
const DEFAULT_SNAPSHOT_HZ = 12;
const SURFACE_OFFSET_METERS = 0.2;

function getDistanceSquaredToRuntime(
  mark: HomeDriveBuildingCollisionMark,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const carPosition = runtimeRef.current.car.position;

  return (
    (mark.position.x - carPosition.x) ** 2 +
    (mark.position.z - carPosition.z) ** 2
  );
}

function getVisibleMarks(params: Readonly<{
  marks: readonly HomeDriveBuildingCollisionMark[];
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters: number;
  maxVisibleMarks: number;
}>): readonly HomeDriveBuildingCollisionMark[] {
  const visibleRadiusSquared =
    params.visibleRadiusMeters * params.visibleRadiusMeters;

  return params.marks
    .filter((mark) => {
      if (mark.opacity <= 0.01) {
        return false;
      }

      return (
        getDistanceSquaredToRuntime(mark, params.runtimeRef) <=
        visibleRadiusSquared
      );
    })
    .sort((first, second) => {
      return (
        getDistanceSquaredToRuntime(first, params.runtimeRef) -
        getDistanceSquaredToRuntime(second, params.runtimeRef)
      );
    })
    .slice(0, params.maxVisibleMarks);
}

function getMarkRenderOrder(mark: HomeDriveBuildingCollisionMark): number {
  switch (mark.kind) {
    case "comic-burst":
      return 78;
    case "dust":
      return 76;
    case "bent-sign":
      return 75;
    case "concrete-hole":
      return 74;
    case "broken-plaster":
      return 73;
    case "impact-stain":
      return 72;
    case "paint-transfer":
      return 71;
    case "scratch":
      return 70;
    case "crack":
    default:
      return 69;
  }
}

function getSurfaceOffsetMeters(mark: HomeDriveBuildingCollisionMark): number {
  switch (mark.kind) {
    case "concrete-hole":
      return SURFACE_OFFSET_METERS + 0.004;
    case "impact-stain":
      return SURFACE_OFFSET_METERS + 0.008;
    case "broken-plaster":
      return SURFACE_OFFSET_METERS + 0.012;
    case "crack":
      return SURFACE_OFFSET_METERS + 0.016;
    case "scratch":
    case "paint-transfer":
      return SURFACE_OFFSET_METERS + 0.02;
    case "dust":
    case "comic-burst":
    case "bent-sign":
    default:
      return SURFACE_OFFSET_METERS + 0.028;
  }
}

function getStaticMaterial(
  mark: HomeDriveBuildingCollisionMark,
  materials: ReturnType<typeof createHomeDriveThreeBuildingCollisionMaterials>,
): MeshBasicMaterial | null {
  switch (mark.kind) {
    case "dust":
      return materials.dust;
    case "scratch":
      return materials.scratch;
    case "bent-sign":
      return materials.bentSign;
    case "impact-stain":
      return materials.impactStain;
    case "concrete-hole":
      return materials.concreteHole;
    case "paint-transfer":
      return materials.paintTransfer;
    case "broken-plaster":
      return materials.brokenPlaster;
    case "crack":
      return materials.crack;
    case "comic-burst":
    default:
      return null;
  }
}

function HomeDriveThreeComicBurstMark({
  mark,
  geometry,
}: Readonly<{
  mark: HomeDriveBuildingCollisionMark;
  geometry: PlaneGeometry;
}>) {
  const material = useMemo(() => {
    return createHomeDriveThreeBuildingCollisionComicMaterial(
      mark.message ?? "POC!",
    );
  }, [mark.message]);

  useEffect(() => {
    return () => {
      material.map?.dispose();
      material.dispose();
    };
  }, [material]);

  material.opacity = mark.opacity;

  const offset = getSurfaceOffsetMeters(mark);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[
        mark.position.x + mark.normal.x * offset,
        mark.yMeters,
        mark.position.z + mark.normal.z * offset,
      ]}
      rotation={[0, mark.rotationYRad, 0]}
      scale={[mark.widthMeters, mark.heightMeters, 1]}
      renderOrder={getMarkRenderOrder(mark)}
      frustumCulled
    />
  );
}

function HomeDriveThreeStaticCollisionMark({
  mark,
  geometry,
  sourceMaterial,
}: Readonly<{
  mark: HomeDriveBuildingCollisionMark;
  geometry: PlaneGeometry;
  sourceMaterial: MeshBasicMaterial;
}>) {
  const material = useMemo(() => {
    const clone = sourceMaterial.clone();

    clone.map = sourceMaterial.map;
    clone.needsUpdate = true;

    return clone;
  }, [sourceMaterial]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  material.opacity = mark.opacity;

  const offset = getSurfaceOffsetMeters(mark);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[
        mark.position.x + mark.normal.x * offset,
        mark.yMeters,
        mark.position.z + mark.normal.z * offset,
      ]}
      rotation={[0, mark.rotationYRad, 0]}
      scale={[mark.widthMeters, mark.heightMeters, 1]}
      renderOrder={getMarkRenderOrder(mark)}
      frustumCulled
    />
  );
}

function getCollisionMarksKey(
  marks: readonly HomeDriveBuildingCollisionMark[],
): string {
  return marks.map((mark) => mark.id + ":" + mark.opacity.toFixed(2)).join("|");
}

function HomeDriveThreeBuildingCollisionMarks({
  buildingCollisionsRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleMarks = DEFAULT_MAX_VISIBLE_MARKS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeBuildingCollisionMarksProps) {
  const [visibleMarks, setVisibleMarks] = useState<
    readonly HomeDriveBuildingCollisionMark[]
  >([]);
  const lastCollisionSerialRef = useRef<number | null>(null);
  const lastMarksKeyRef = useRef("");

  const materials = useMemo(() => {
    return createHomeDriveThreeBuildingCollisionMaterials();
  }, []);

  const geometry = useMemo(() => {
    return new PlaneGeometry(1, 1);
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      disposeHomeDriveThreeBuildingCollisionMaterials(materials);
    };
  }, [geometry, materials]);

  useFrame((_, deltaSeconds) => {
    const currentSerial = buildingCollisionsRef.current.serial ?? null;

    if (currentSerial === lastCollisionSerialRef.current) {
      return;
    }

    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 8));
    const intervalSeconds = 1 / safeSnapshotHz;

    const accumulatorKey = "__homeDriveBuildingCollisionMarksAccumulator";
    const refAsAny = buildingCollisionsRef as unknown as Record<string, number>;
    const nextAccumulator = (refAsAny[accumulatorKey] ?? 0) + deltaSeconds;

    if (nextAccumulator < intervalSeconds) {
      refAsAny[accumulatorKey] = nextAccumulator;
      return;
    }

    refAsAny[accumulatorKey] = 0;
    lastCollisionSerialRef.current = currentSerial;

    const nextVisibleMarks = getVisibleMarks({
      marks: buildingCollisionsRef.current.marks,
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleMarks,
    });
    const nextKey = getCollisionMarksKey(nextVisibleMarks);

    if (nextKey === lastMarksKeyRef.current) {
      return;
    }

    lastMarksKeyRef.current = nextKey;
    setVisibleMarks(nextVisibleMarks);
  });

  if (visibleMarks.length <= 0) {
    return null;
  }

  return (
    <group>
      {visibleMarks.map((mark) => {
        if (mark.kind === "comic-burst") {
          return (
            <HomeDriveThreeComicBurstMark
              key={mark.id}
              mark={mark}
              geometry={geometry}
            />
          );
        }

        const sourceMaterial = getStaticMaterial(mark, materials);

        if (!sourceMaterial) {
          return null;
        }

        return (
          <HomeDriveThreeStaticCollisionMark
            key={mark.id}
            mark={mark}
            geometry={geometry}
            sourceMaterial={sourceMaterial}
          />
        );
      })}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingCollisionMarks);
