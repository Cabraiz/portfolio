// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings.tsx

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
} from "three";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";

import {
  BUILDING_BODY_MATERIALS,
  MAX_BUILDINGS,
} from "./HomeDriveThreeBuildings/buildingShared";
import type {
  BuildingBatch,
  FacadeDetailBatch,
  HomeDriveThreeBuildingsProps,
} from "./HomeDriveThreeBuildings/buildingShared";
import {
  groupBuildingsByMaterial,
} from "./HomeDriveThreeBuildings/buildingFacadeStyle";
import {
  createBodyInstances,
  createFacadeDetailBatches,
} from "./HomeDriveThreeBuildings/buildingFacadeDetails";

export type {
  HomeDriveThreeBuildingsProps,
} from "./HomeDriveThreeBuildings/buildingShared";

function HomeDriveThreeBodyBatch({
  batch,
  geometry,
}: Readonly<{
  batch: BuildingBatch;
  geometry: BoxGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const instances = useMemo(() => {
    return createBodyInstances(batch.buildings);
  }, [batch.buildings]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(0, instance.rotationYRad, 0);
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
        BUILDING_BODY_MATERIALS[batch.materialKey],
        instances.length,
      ]}
      frustumCulled
      renderOrder={12}
    />
  );
}

function HomeDriveThreeFacadeDetailBatch({
  batch,
  geometry,
}: Readonly<{
  batch: FacadeDetailBatch;
  geometry: BufferGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.details.forEach((detail, index) => {
      dummy.position.set(...detail.position);
      dummy.rotation.set(0, detail.rotationYRad, detail.rotationZRad ?? 0);
      dummy.scale.set(...detail.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.details, dummy]);

  if (batch.details.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, batch.material, batch.details.length]}
      frustumCulled
      renderOrder={batch.renderOrder}
    />
  );
}

function HomeDriveThreeBuildings({
  buildings: buildingsFromProps,
  hiddenBuildingIds = [],
  maxBuildings = MAX_BUILDINGS,
}: HomeDriveThreeBuildingsProps) {
  const sourceBuildings = useMemo(() => {
    if (buildingsFromProps) {
      return buildingsFromProps;
    }

    return getHomeDriveBuildings({
      maxBuildings,
    });
  }, [buildingsFromProps, maxBuildings]);

  const hiddenBuildingIdSet = useMemo(() => {
    return new Set(hiddenBuildingIds);
  }, [hiddenBuildingIds]);

  const buildings = useMemo(() => {
    if (hiddenBuildingIdSet.size <= 0) {
      return sourceBuildings;
    }

    return sourceBuildings.filter((building) => {
      return !hiddenBuildingIdSet.has(building.id);
    });
  }, [hiddenBuildingIdSet, sourceBuildings]);

  const bodyBatches = useMemo(() => {
    return groupBuildingsByMaterial(buildings);
  }, [buildings]);

  const facadeBatches = useMemo(() => {
    return createFacadeDetailBatches(buildings);
  }, [buildings]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      planeGeometry.dispose();
    };
  }, [boxGeometry, planeGeometry]);

  return (
    <group>
      {bodyBatches.map((batch) => (
        <HomeDriveThreeBodyBatch
          key={batch.materialKey}
          batch={batch}
          geometry={boxGeometry}
        />
      ))}

      {facadeBatches.map((batch) => (
        <HomeDriveThreeFacadeDetailBatch
          key={batch.id}
          batch={batch}
          geometry={batch.geometryKind === "box" ? boxGeometry : planeGeometry}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildings);
