// src/pages/Mateus/Home/components/mobile/game/driving/three/crosswalks/HomeDriveThreeCrosswalks.batches.tsx

import { useLayoutEffect, useMemo, useRef } from "react";
import {
	CylinderGeometry,
	InstancedMesh,
	Object3D,
	PlaneGeometry,
	SphereGeometry,
	type Material,
} from "three";
import type { HomeDriveCrosswalkSignalPhase } from "../../domain/crosswalks";
import {
	HOME_DRIVE_THREE_CROSSWALK_MATERIALS,
} from "./homeDriveThree.crosswalkMaterials";
import type {
	CrosswalkStripeInstance,
	CrosswalkSignalInstance,
	CrosswalkPoleInstance,
} from "./HomeDriveThreeCrosswalks.instances";

export function HomeDriveThreeCrosswalkStripeBatch({
  instances,
  geometry,
  material,
}: Readonly<{
  instances: readonly CrosswalkStripeInstance[];
  geometry: PlaneGeometry;
  material: Material;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(-Math.PI / 2, 0, instance.rotationYRad);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, instances]);

  if (instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      frustumCulled
      renderOrder={16}
    />
  );
}

export function HomeDriveThreeCrosswalkPoleBatch({
  instances,
  geometry,
}: Readonly<{
  instances: readonly CrosswalkPoleInstance[];
  geometry: CylinderGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, instances]);

  if (instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        geometry,
        HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalPole,
        instances.length,
      ]}
      frustumCulled
      renderOrder={24}
    />
  );
}

function getSignalMaterial(phase: HomeDriveCrosswalkSignalPhase): Material {
  switch (phase) {
    case "walk":
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalWalk;

    case "danger":
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalDanger;

    case "wait":
    case "off":
    default:
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalWait;
  }
}

export function HomeDriveThreeCrosswalkSignals({
  instances,
  geometry,
}: Readonly<{
  instances: readonly CrosswalkSignalInstance[];
  geometry: SphereGeometry;
}>) {
  if (instances.length <= 0) {
    return null;
  }

  return (
    <group>
      {instances.map((instance) => (
        <mesh
          key={instance.id}
          geometry={geometry}
          material={getSignalMaterial(instance.phase)}
          position={instance.position}
          scale={instance.scale}
          renderOrder={25}
          frustumCulled
        />
      ))}
    </group>
  );
}
