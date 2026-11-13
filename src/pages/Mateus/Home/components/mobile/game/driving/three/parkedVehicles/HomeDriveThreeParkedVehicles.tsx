// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/HomeDriveThreeParkedVehicles.tsx

import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  type BufferGeometry,
} from "three";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
	HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import {
	createHomeDriveThreeParkedVehicleMaterials,
	disposeHomeDriveThreeParkedVehicleMaterials,
	type HomeDriveThreeParkedVehicleMaterialMap,
} from "./homeDriveThree.parkedVehicleMaterials";
import {
	type ParkedVehicleBatch,
	type ParkedVehicleRenderSnapshot,
	DEFAULT_VISIBLE_RADIUS_METERS,
	DEFAULT_MAX_VISIBLE_VEHICLES,
	DEFAULT_SNAPSHOT_HZ,
	createVisibleParkedVehicleSnapshot,
	createParkedVehicleBatches,
} from "./HomeDriveThreeParkedVehicles.snapshot";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeParkedVehiclesProps = Readonly<{
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleVehicles?: number;
  snapshotHz?: number;
}>;

function HomeDriveThreeParkedVehicleBatch({
  batch,
  geometry,
  materials,
}: Readonly<{
  batch: ParkedVehicleBatch;
  geometry: BufferGeometry;
  materials: HomeDriveThreeParkedVehicleMaterialMap;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const material = materials[batch.materialKey];

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(...instance.rotation);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.instances, dummy]);

  if (batch.instances.length <= 0 || !material) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, batch.instances.length]}
      frustumCulled
      renderOrder={18 + batch.renderOrder}
    />
  );
}

function HomeDriveThreeParkedVehicles({
  parkedVehiclesRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleVehicles = DEFAULT_MAX_VISIBLE_VEHICLES,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeParkedVehiclesProps) {
  const materials = useMemo(() => {
    return createHomeDriveThreeParkedVehicleMaterials();
  }, []);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const wheelGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 14), []);
  const cylinderGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 10), []);

  const snapshotIntervalSeconds = useMemo(() => {
    const safeSnapshotHz = Math.max(1, Math.min(30, snapshotHz));

    return 1 / safeSnapshotHz;
  }, [snapshotHz]);

  const snapshotAccumulatorRef = useRef(0);
  const [snapshot, setSnapshot] = useState<ParkedVehicleRenderSnapshot>(() => {
    return createVisibleParkedVehicleSnapshot(
      parkedVehiclesRef.current.vehicles,
      runtimeRef?.current,
      visibleRadiusMeters,
      maxVisibleVehicles,
    );
  });

  useEffect(() => {
    setSnapshot(
      createVisibleParkedVehicleSnapshot(
        parkedVehiclesRef.current.vehicles,
        runtimeRef?.current,
        visibleRadiusMeters,
        maxVisibleVehicles,
      ),
    );
  }, [maxVisibleVehicles, parkedVehiclesRef, runtimeRef, visibleRadiusMeters]);

  useFrame((_, deltaSeconds) => {
    snapshotAccumulatorRef.current += deltaSeconds;

    if (snapshotAccumulatorRef.current < snapshotIntervalSeconds) {
      return;
    }

    snapshotAccumulatorRef.current = 0;

    const nextSnapshot = createVisibleParkedVehicleSnapshot(
      parkedVehiclesRef.current.vehicles,
      runtimeRef?.current,
      visibleRadiusMeters,
      maxVisibleVehicles,
    );

    setSnapshot((currentSnapshot) => {
      return currentSnapshot.key === nextSnapshot.key ? currentSnapshot : nextSnapshot;
    });
  });

  const visibleVehicles = snapshot.vehicles;

  const batches = useMemo(() => {
    return createParkedVehicleBatches(visibleVehicles, materials);
  }, [materials, visibleVehicles]);

  useEffect(() => {
    return () => {
      disposeHomeDriveThreeParkedVehicleMaterials(materials);
      boxGeometry.dispose();
      wheelGeometry.dispose();
      cylinderGeometry.dispose();
    };
  }, [boxGeometry, cylinderGeometry, materials, wheelGeometry]);

  if (batches.length <= 0) {
    return null;
  }

  return (
    <group name="home-drive-parked-vehicles">
      {batches.map((batch) => {
        const geometry =
          batch.geometryKind === "box"
            ? boxGeometry
            : batch.geometryKind === "wheel"
              ? wheelGeometry
              : cylinderGeometry;

        return (
          <HomeDriveThreeParkedVehicleBatch
            key={batch.key}
            batch={batch}
            geometry={geometry}
            materials={materials}
          />
        );
      })}
    </group>
  );
}

export default memo(HomeDriveThreeParkedVehicles);


