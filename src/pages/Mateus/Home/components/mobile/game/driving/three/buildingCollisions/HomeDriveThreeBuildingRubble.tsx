// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/HomeDriveThreeBuildingRubble.tsx

import { useFrame } from "@react-three/fiber";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Object3D,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
} from "three";

import type { HomeDriveBuildingCollisionRuntimeState } from "../../domain/buildingCollisions/homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingRubblePiece,
  HomeDriveBuildingRubblePieceKind,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionRubble.types";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  createHomeDriveThreeBuildingRubbleGeometries,
  disposeHomeDriveThreeBuildingRubbleGeometries,
  type HomeDriveThreeBuildingRubbleGeometrySet,
} from "./homeDriveThree.buildingRubbleGeometry";
import {
  createHomeDriveThreeBuildingRubbleMaterials,
  disposeHomeDriveThreeBuildingRubbleMaterials,
  type HomeDriveThreeBuildingRubbleMaterialSet,
} from "./homeDriveThree.buildingRubbleMaterials";
import {
  applyHomeDriveThreeBuildingRubbleTransformToObject,
} from "./homeDriveThree.buildingRubbleTransforms";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeBuildingRubbleProps = Readonly<{
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisiblePieces?: number;
  snapshotHz?: number;
}>;

type RubbleBatch = Readonly<{
  kind: HomeDriveBuildingRubblePieceKind;
  pieces: readonly HomeDriveBuildingRubblePiece[];
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 560;
const DEFAULT_MAX_VISIBLE_PIECES = 520;
const DEFAULT_SNAPSHOT_HZ = 8;

function getDistanceSquaredToRuntime(
  piece: HomeDriveBuildingRubblePiece,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const carPosition = runtimeRef.current.car.position;

  return (
    (piece.position.x - carPosition.x) ** 2 +
    (piece.position.z - carPosition.z) ** 2
  );
}

function getVisibleRubblePieces(params: Readonly<{
  buildingCollisions: HomeDriveBuildingCollisionRuntimeState;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters: number;
  maxVisiblePieces: number;
}>): readonly HomeDriveBuildingRubblePiece[] {
  const visibleRadiusSquared =
    params.visibleRadiusMeters * params.visibleRadiusMeters;

  return params.buildingCollisions.destructions
    .flatMap((destruction) => destruction.rubble)
    .filter((piece) => {
      return (
        piece.opacity > 0.01 &&
        getDistanceSquaredToRuntime(piece, params.runtimeRef) <=
          visibleRadiusSquared
      );
    })
    .sort((first, second) => {
      return (
        getDistanceSquaredToRuntime(first, params.runtimeRef) -
        getDistanceSquaredToRuntime(second, params.runtimeRef)
      );
    })
    .slice(0, params.maxVisiblePieces);
}

function groupRubblePieces(
  pieces: readonly HomeDriveBuildingRubblePiece[],
): readonly RubbleBatch[] {
  const map = new Map<HomeDriveBuildingRubblePieceKind, HomeDriveBuildingRubblePiece[]>();

  pieces.forEach((piece) => {
    const current = map.get(piece.kind);

    if (current) {
      current.push(piece);
      return;
    }

    map.set(piece.kind, [piece]);
  });

  return Array.from(map.entries()).map(([kind, batchPieces]) => ({
    kind,
    pieces: batchPieces,
  }));
}

function getRubblePieceListKey(
  pieces: readonly HomeDriveBuildingRubblePiece[],
): string {
  return pieces.map((piece) => piece.id).join("|");
}

function getGeometryForKind(
  kind: HomeDriveBuildingRubblePieceKind,
  geometries: HomeDriveThreeBuildingRubbleGeometrySet,
): BufferGeometry {
  switch (kind) {
    case "concrete-boulder":
      return geometries.concreteBoulder;
    case "concrete-rock":
      return geometries.concreteRock;
    case "small-stone":
      return geometries.smallStone;
    case "plaster-shard":
      return geometries.plasterShard;
    case "broken-slab":
      return geometries.brokenSlab;
    case "dust-mound":
      return geometries.dustMound;
    case "rebar-piece":
    default:
      return geometries.rebarPiece;
  }
}

function getMaterialForKind(
  kind: HomeDriveBuildingRubblePieceKind,
  materials: HomeDriveThreeBuildingRubbleMaterialSet,
): Material {
  switch (kind) {
    case "concrete-boulder":
      return materials.concreteBoulder;
    case "concrete-rock":
      return materials.concreteRock;
    case "small-stone":
      return materials.smallStone;
    case "plaster-shard":
      return materials.plasterShard;
    case "broken-slab":
      return materials.brokenSlab;
    case "dust-mound":
      return materials.dustMound;
    case "rebar-piece":
    default:
      return materials.rebarPiece;
  }
}

function RubbleInstancedBatch({
  batch,
  geometries,
  materials,
}: Readonly<{
  batch: RubbleBatch;
  geometries: HomeDriveThreeBuildingRubbleGeometrySet;
  materials: HomeDriveThreeBuildingRubbleMaterialSet;
}>) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const object = useMemo(() => new Object3D(), []);

  const geometry = getGeometryForKind(batch.kind, geometries);
  const material = getMaterialForKind(batch.kind, materials);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.pieces.forEach((piece, index) => {
      applyHomeDriveThreeBuildingRubbleTransformToObject(object, piece);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    });

    mesh.count = batch.pieces.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.pieces, object]);

  if (batch.pieces.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, batch.pieces.length]}
      renderOrder={64}
      frustumCulled
    />
  );
}

function HomeDriveThreeBuildingRubble({
  buildingCollisionsRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisiblePieces = DEFAULT_MAX_VISIBLE_PIECES,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeBuildingRubbleProps) {
  const [visiblePieces, setVisiblePieces] = useState<
    readonly HomeDriveBuildingRubblePiece[]
  >([]);
  const lastCollisionSerialRef = useRef<number | null>(null);
  const lastVisiblePiecesKeyRef = useRef("");

  const geometries = useMemo(() => {
    return createHomeDriveThreeBuildingRubbleGeometries();
  }, []);

  const materials = useMemo(() => {
    return createHomeDriveThreeBuildingRubbleMaterials();
  }, []);

  useEffect(() => {
    return () => {
      disposeHomeDriveThreeBuildingRubbleGeometries(geometries);
      disposeHomeDriveThreeBuildingRubbleMaterials(materials);
    };
  }, [geometries, materials]);

  useFrame((_, deltaSeconds) => {
    const currentSerial = buildingCollisionsRef.current.serial ?? null;

    if (currentSerial === lastCollisionSerialRef.current) {
      return;
    }

    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 12));
    const intervalSeconds = 1 / safeSnapshotHz;

    const accumulatorKey = "__homeDriveBuildingRubbleAccumulator";
    const refAsAny = buildingCollisionsRef as unknown as Record<string, number>;
    const nextAccumulator = (refAsAny[accumulatorKey] ?? 0) + deltaSeconds;

    if (nextAccumulator < intervalSeconds) {
      refAsAny[accumulatorKey] = nextAccumulator;
      return;
    }

    refAsAny[accumulatorKey] = 0;
    lastCollisionSerialRef.current = currentSerial;

    const nextVisiblePieces = getVisibleRubblePieces({
      buildingCollisions: buildingCollisionsRef.current,
      runtimeRef,
      visibleRadiusMeters,
      maxVisiblePieces,
    });
    const nextKey = getRubblePieceListKey(nextVisiblePieces);

    if (nextKey === lastVisiblePiecesKeyRef.current) {
      return;
    }

    lastVisiblePiecesKeyRef.current = nextKey;
    setVisiblePieces(nextVisiblePieces);
  });

  const batches = useMemo(() => groupRubblePieces(visiblePieces), [visiblePieces]);

  if (batches.length <= 0) {
    return null;
  }

  return (
    <group>
      {batches.map((batch) => (
        <RubbleInstancedBatch
          key={batch.kind}
          batch={batch}
          geometries={geometries}
          materials={materials}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingRubble);
