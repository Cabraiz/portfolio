// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeWorldObjects.tsx

import { useFrame } from "@react-three/fiber";
import React, {
  memo,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import { getHomeDriveTerrainState } from "../domain/homeDrive.terrain";
import type {
  HomeDriveRuntimeState,
  HomeDriveTerrainObject,
} from "../domain/homeDrive.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";

const OBJECT_BUCKET_SIZE_METERS = 48;
const MAX_RENDERED_WORLD_OBJECTS = 72;
const BUCKET_CHECK_INTERVAL_SECONDS = 0.18;

type ObjectBucket = Readonly<{
  x: number;
  z: number;
}>;

function getBucketCoordinate(value: number): number {
  return Math.floor(value / OBJECT_BUCKET_SIZE_METERS);
}

function getBucketCenter(bucket: number): number {
  return bucket * OBJECT_BUCKET_SIZE_METERS + OBJECT_BUCKET_SIZE_METERS / 2;
}

function getRuntimeBucket(runtime: HomeDriveRuntimeState): ObjectBucket {
  return {
    x: getBucketCoordinate(runtime.car.position.x),
    z: getBucketCoordinate(runtime.car.position.z),
  };
}

function areBucketsEqual(first: ObjectBucket, second: ObjectBucket): boolean {
  return first.x === second.x && first.z === second.z;
}

function HomeDriveThreeTree({
  object,
}: Readonly<{ object: HomeDriveTerrainObject }>) {
  const trunkHeight = Math.max(2.4, object.sizeMeters * 0.58);
  const topHeight = Math.max(2.8, object.sizeMeters * 0.72);
  const topRadius = Math.max(1.2, object.sizeMeters * 0.36);

  return (
    <group
      position={[object.position.x, 0, object.position.z]}
      rotation={[0, (object.rotationDeg * Math.PI) / 180, 0]}
    >
      <mesh
        position={[0, trunkHeight / 2, 0]}
        material={HOME_DRIVE_THREE_MATERIALS.treeTrunk}
      >
        <cylinderGeometry args={[0.2, 0.32, trunkHeight, 6]} />
      </mesh>

      <mesh
        position={[0, trunkHeight + topHeight * 0.36, 0]}
        material={HOME_DRIVE_THREE_MATERIALS.treeTop}
      >
        <coneGeometry args={[topRadius, topHeight, 7]} />
      </mesh>
    </group>
  );
}

function HomeDriveThreeBush({
  object,
}: Readonly<{ object: HomeDriveTerrainObject }>) {
  const radius = Math.max(0.9, object.sizeMeters * 0.36);

  return (
    <mesh
      position={[object.position.x, radius * 0.54, object.position.z]}
      scale={[1.28, 0.68, 0.92]}
      rotation={[0, (object.rotationDeg * Math.PI) / 180, 0]}
      material={HOME_DRIVE_THREE_MATERIALS.bush}
    >
      <sphereGeometry args={[radius, 8, 6]} />
    </mesh>
  );
}

function HomeDriveThreeRock({
  object,
}: Readonly<{ object: HomeDriveTerrainObject }>) {
  const radius = Math.max(0.56, object.sizeMeters * 0.28);

  return (
    <mesh
      position={[object.position.x, radius * 0.36, object.position.z]}
      scale={[1.28, 0.58, 0.88]}
      rotation={[
        (object.variant * Math.PI) / 12,
        (object.rotationDeg * Math.PI) / 180,
        0,
      ]}
      material={HOME_DRIVE_THREE_MATERIALS.rock}
    >
      <dodecahedronGeometry args={[radius, 0]} />
    </mesh>
  );
}

function HomeDriveThreeMarker({
  object,
}: Readonly<{ object: HomeDriveTerrainObject }>) {
  const height = Math.max(2.6, object.sizeMeters * 1.08);

  return (
    <group
      position={[object.position.x, 0, object.position.z]}
      rotation={[0, (object.rotationDeg * Math.PI) / 180, 0]}
    >
      <mesh
        position={[0, height / 2, 0]}
        material={HOME_DRIVE_THREE_MATERIALS.marker}
      >
        <cylinderGeometry args={[0.12, 0.16, height, 6]} />
      </mesh>

      <mesh
        position={[0.55, height * 0.86, 0]}
        material={HOME_DRIVE_THREE_MATERIALS.marker}
      >
        <boxGeometry args={[1.2, 0.42, 0.08]} />
      </mesh>
    </group>
  );
}

function HomeDriveThreeObjectBase({
  object,
}: Readonly<{ object: HomeDriveTerrainObject }>) {
  switch (object.type) {
    case "tree":
      return <HomeDriveThreeTree object={object} />;
    case "bush":
      return <HomeDriveThreeBush object={object} />;
    case "marker":
      return <HomeDriveThreeMarker object={object} />;
    case "rock":
    default:
      return <HomeDriveThreeRock object={object} />;
  }
}

const HomeDriveThreeObject = memo(HomeDriveThreeObjectBase);

export type HomeDriveThreeWorldObjectsProps = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
}>;

export default function HomeDriveThreeWorldObjects({
  runtimeRef,
}: HomeDriveThreeWorldObjectsProps) {
  const [bucket, setBucket] = useState<ObjectBucket>(() => {
    return getRuntimeBucket(runtimeRef.current);
  });

  const bucketRef = useRef(bucket);
  const checkAccumulatorRef = useRef(0);

  useFrame((_, deltaSeconds) => {
    checkAccumulatorRef.current += deltaSeconds;

    if (checkAccumulatorRef.current < BUCKET_CHECK_INTERVAL_SECONDS) {
      return;
    }

    checkAccumulatorRef.current = 0;

    const nextBucket = getRuntimeBucket(runtimeRef.current);

    if (areBucketsEqual(bucketRef.current, nextBucket)) {
      return;
    }

    bucketRef.current = nextBucket;
    setBucket(nextBucket);
  });

  const objects = useMemo(() => {
    const sampledCar = {
      position: {
        x: getBucketCenter(bucket.x),
        z: getBucketCenter(bucket.z),
      },
      headingRad: 0,
    };

    return getHomeDriveTerrainState(sampledCar).objects
      .sort((first, second) => {
        const firstDx = first.position.x - sampledCar.position.x;
        const firstDz = first.position.z - sampledCar.position.z;
        const secondDx = second.position.x - sampledCar.position.x;
        const secondDz = second.position.z - sampledCar.position.z;

        return (
          firstDx * firstDx +
          firstDz * firstDz -
          (secondDx * secondDx + secondDz * secondDz)
        );
      })
      .slice(0, MAX_RENDERED_WORLD_OBJECTS);
  }, [bucket.x, bucket.z]);

  return (
    <group>
      {objects.map((object) => (
        <HomeDriveThreeObject key={object.id} object={object} />
      ))}
    </group>
  );
}
