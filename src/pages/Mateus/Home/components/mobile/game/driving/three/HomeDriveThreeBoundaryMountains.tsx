// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBoundaryMountains.tsx

import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  ConeGeometry,
  DodecahedronGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  type ColorRepresentation,
} from "three";

import {
  getHomeDriveBoundaryMountainInstances,
  type HomeDriveBoundaryMountainInstance,
} from "../domain/homeDrive.boundaryMountains";

type HomeDriveMountainRenderLayer = Readonly<{
  id: string;
  instances: readonly HomeDriveBoundaryMountainInstance[];
  geometry: ConeGeometry | DodecahedronGeometry;
  material: MeshStandardMaterial;
  renderOrder: number;
}>;

const MOUNTAIN_BASE_Y = -1.2;

function getMountainMaterialColor(tone: number): ColorRepresentation {
  if (tone > 0.72) {
    return "#6f7865";
  }

  if (tone > 0.48) {
    return "#59644f";
  }

  return "#3f513d";
}

function createMountainMaterial(tone: number): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: getMountainMaterialColor(tone),
    roughness: 0.96,
    metalness: 0,
    flatShading: true,
  });
}

function applyMountainInstanceMatrix(
  matrixOwner: Object3D,
  matrix: Matrix4,
  instance: HomeDriveBoundaryMountainInstance,
): Matrix4 {
  matrixOwner.position.set(
    instance.position.x,
    MOUNTAIN_BASE_Y + instance.heightMeters * 0.5,
    instance.position.z,
  );

  matrixOwner.rotation.set(
    0,
    instance.rotationYRad,
    0,
  );

  matrixOwner.scale.set(
    instance.radiusXmeters,
    instance.heightMeters,
    instance.radiusZmeters,
  );

  matrixOwner.updateMatrix();
  matrix.copy(matrixOwner.matrix);

  return matrix;
}

function HomeDriveMountainInstancedLayer({
  layer,
}: Readonly<{
  layer: HomeDriveMountainRenderLayer;
}>) {
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const matrixOwner = new Object3D();
    const matrix = new Matrix4();

    layer.instances.forEach((instance, index) => {
      mesh.setMatrixAt(
        index,
        applyMountainInstanceMatrix(matrixOwner, matrix, instance),
      );
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.computeBoundingSphere();
  }, [layer.instances]);

  if (layer.instances.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[layer.geometry, layer.material, layer.instances.length]}
      castShadow={false}
      receiveShadow
      frustumCulled
      renderOrder={layer.renderOrder}
    />
  );
}

function splitMountainInstancesByLayer(
  instances: readonly HomeDriveBoundaryMountainInstance[],
): readonly HomeDriveMountainRenderLayer[] {
  const nearInstances = instances.filter((instance) => instance.rowIndex === 0);
  const middleInstances = instances.filter((instance) => instance.rowIndex === 1);
  const farInstances = instances.filter((instance) => instance.rowIndex >= 2);

  return [
    {
      id: "boundary-mountains-near",
      instances: nearInstances,
      geometry: new ConeGeometry(1, 1, 7, 1, false),
      material: createMountainMaterial(0.36),
      renderOrder: 0,
    },
    {
      id: "boundary-mountains-middle",
      instances: middleInstances,
      geometry: new ConeGeometry(1, 1, 6, 1, false),
      material: createMountainMaterial(0.56),
      renderOrder: -1,
    },
    {
      id: "boundary-mountains-far",
      instances: farInstances,
      geometry: new DodecahedronGeometry(1, 1),
      material: createMountainMaterial(0.74),
      renderOrder: -2,
    },
  ];
}

function HomeDriveThreeBoundaryMountains() {
  const instances = useMemo(() => getHomeDriveBoundaryMountainInstances(), []);

  const layers = useMemo(() => {
    return splitMountainInstancesByLayer(instances);
  }, [instances]);

  useEffect(() => {
    return () => {
      for (const layer of layers) {
        layer.geometry.dispose();
        layer.material.dispose();
      }
    };
  }, [layers]);

  return (
    <group name="home-drive-boundary-mountains">
      {layers.map((layer) => (
        <HomeDriveMountainInstancedLayer key={layer.id} layer={layer} />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBoundaryMountains);
