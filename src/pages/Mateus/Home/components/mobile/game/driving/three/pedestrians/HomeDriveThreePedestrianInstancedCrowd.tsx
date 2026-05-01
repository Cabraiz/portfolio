// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianInstancedCrowd.tsx

import React, { memo, useLayoutEffect, useMemo, useRef } from "react";
import { Color, DynamicDrawUsage, InstancedMesh, Object3D } from "three";

import {
  getHomeDriveThreePedestrianInstancedPalette,
  groupHomeDriveThreePedestrianInstancedEntries,
} from "./homeDriveThree.pedestrianInstancing";
import type {
  HomeDriveThreePedestrianInstancedBucket,
  HomeDriveThreePedestrianInstancedCrowdProps,
} from "./homeDriveThree.pedestrianInstancing.types";

const TEMP_OBJECT = new Object3D();
const TEMP_COLOR = new Color();

function getInstanceScale(detailLevel: "medium" | "proxy"): number {
  return detailLevel === "medium" ? 1 : 0.72;
}

function updateInstancedMesh(
  mesh: InstancedMesh | null,
  bucket: HomeDriveThreePedestrianInstancedBucket,
  elapsedSeconds: number,
  maxInstances: number,
): void {
  if (!mesh) {
    return;
  }

  const count = Math.min(bucket.entries.length, maxInstances);
  mesh.count = count;

  for (let index = 0; index < count; index += 1) {
    const entry = bucket.entries[index];
    const agent = entry.agent;
    const instanceScale = getInstanceScale(entry.detailLevel);
    const walkBob =
      Math.sin(agent.animationPhase + elapsedSeconds * Math.max(0.6, agent.speedMps) * 3.2) *
      Math.min(0.045, Math.max(0, agent.speedMps) * 0.018);

    TEMP_OBJECT.position.set(agent.position.x, 0.88 + walkBob, agent.position.z);
    TEMP_OBJECT.rotation.set(0, agent.headingRad, 0);
    TEMP_OBJECT.scale.set(0.42 * instanceScale, 1.05 * instanceScale, 0.32 * instanceScale);
    TEMP_OBJECT.updateMatrix();

    mesh.setMatrixAt(index, TEMP_OBJECT.matrix);
    mesh.setColorAt(index, TEMP_COLOR.set(getHomeDriveThreePedestrianInstancedPalette(agent).body));
  }

  mesh.instanceMatrix.needsUpdate = true;

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
}

function HomeDriveThreePedestrianInstancedBucketMesh({
  bucket,
  elapsedSeconds,
  maxInstances,
  renderOrder,
}: Readonly<{
  bucket: HomeDriveThreePedestrianInstancedBucket;
  elapsedSeconds: number;
  maxInstances: number;
  renderOrder: number;
}>) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const capacity = Math.max(1, Math.min(bucket.entries.length, maxInstances));

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useLayoutEffect(() => {
    updateInstancedMesh(meshRef.current, bucket, elapsedSeconds, maxInstances);
  }, [bucket, elapsedSeconds, maxInstances]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, capacity]}
      frustumCulled={false}
      renderOrder={renderOrder}
    >
      <cylinderGeometry args={[0.28, 0.34, 1.72, 7, 1]} />
      <meshStandardMaterial
        roughness={0.76}
        metalness={0.04}
        vertexColors
      />
    </instancedMesh>
  );
}

function HomeDriveThreePedestrianInstancedCrowd({
  entries,
  enabled = true,
  renderOrder = 25,
  maxInstances = 1400,
  elapsedSeconds = 0,
}: HomeDriveThreePedestrianInstancedCrowdProps) {
  const buckets = useMemo(() => {
    if (!enabled || entries.length <= 0 || maxInstances <= 0) {
      return [];
    }

    return groupHomeDriveThreePedestrianInstancedEntries(entries.slice(0, maxInstances));
  }, [enabled, entries, maxInstances]);

  if (!enabled || buckets.length <= 0) {
    return null;
  }

  return (
    <group name="home-drive-pedestrian-instanced-crowd" renderOrder={renderOrder}>
      {buckets.map((bucket) => (
        <HomeDriveThreePedestrianInstancedBucketMesh
          key={bucket.key}
          bucket={bucket}
          elapsedSeconds={elapsedSeconds}
          maxInstances={maxInstances}
          renderOrder={renderOrder}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreePedestrianInstancedCrowd);
