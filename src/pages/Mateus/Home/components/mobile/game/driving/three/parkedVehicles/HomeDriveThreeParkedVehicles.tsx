// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/HomeDriveThreeParkedVehicles.tsx

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  type BufferGeometry,
} from "three";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import {
  createHomeDriveThreeParkedVehicleMaterials,
  disposeHomeDriveThreeParkedVehicleMaterials,
  getHomeDriveThreeParkedVehicleFallbackMaterialKey,
  type HomeDriveThreeParkedVehicleMaterialMap,
} from "./homeDriveThree.parkedVehicleMaterials";
import { getHomeDriveThreeParkedVehicleDetailParts } from "./homeDriveThree.parkedVehicleDetails";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeParkedVehiclesProps = Readonly<{
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleVehicles?: number;
}>;

type ParkedVehicleInstance = Readonly<{
  id: string;
  geometryKind: "box" | "wheel" | "cylinder";
  materialKey: string;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
  renderOrder: number;
}>;

type ParkedVehicleBatchKey = `${ParkedVehicleInstance["geometryKind"]}:${string}:${number}`;

type ParkedVehicleBatch = Readonly<{
  key: ParkedVehicleBatchKey;
  geometryKind: "box" | "wheel" | "cylinder";
  materialKey: string;
  renderOrder: number;
  instances: readonly ParkedVehicleInstance[];
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 560;
const DEFAULT_MAX_VISIBLE_VEHICLES = 220;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getVisibleVehicles(
  vehicles: readonly HomeDriveParkedVehicle[],
  runtime: HomeDriveRuntimeState | undefined,
  visibleRadiusMeters: number,
  maxVisibleVehicles: number,
): readonly HomeDriveParkedVehicle[] {
  if (maxVisibleVehicles <= 0) {
    return [];
  }

  if (!runtime) {
    return vehicles.slice(0, maxVisibleVehicles);
  }

  const radiusSquared = visibleRadiusMeters * visibleRadiusMeters;

  return vehicles
    .filter((vehicle) => {
      const effectivePosition = {
        x: vehicle.position.x + vehicle.impactOffset.x,
        z: vehicle.position.z + vehicle.impactOffset.z,
      };

      return getDistanceSquared(effectivePosition, runtime.car.position) <= radiusSquared;
    })
    .sort((first, second) => {
      const firstPosition = {
        x: first.position.x + first.impactOffset.x,
        z: first.position.z + first.impactOffset.z,
      };
      const secondPosition = {
        x: second.position.x + second.impactOffset.x,
        z: second.position.z + second.impactOffset.z,
      };

      return (
        getDistanceSquared(firstPosition, runtime.car.position) -
        getDistanceSquared(secondPosition, runtime.car.position)
      );
    })
    .slice(0, maxVisibleVehicles);
}

function getForwardVector(headingRad: number): Readonly<{ x: number; z: number }> {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getRightVector(headingRad: number): Readonly<{ x: number; z: number }> {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function getOffsetPosition(
  vehicle: HomeDriveParkedVehicle,
  localX: number,
  localZ: number,
  y: number,
): readonly [number, number, number] {
  const headingRad = vehicle.headingRad + vehicle.visualYawOffsetRad;
  const forward = getForwardVector(headingRad);
  const right = getRightVector(headingRad);
  const baseX = vehicle.position.x + vehicle.impactOffset.x;
  const baseZ = vehicle.position.z + vehicle.impactOffset.z;

  return [
    baseX + right.x * localX + forward.x * localZ,
    y,
    baseZ + right.z * localX + forward.z * localZ,
  ];
}

function createInstancesForVehicle(
  vehicle: HomeDriveParkedVehicle,
  materials: HomeDriveThreeParkedVehicleMaterialMap,
): readonly ParkedVehicleInstance[] {
  const parts = getHomeDriveThreeParkedVehicleDetailParts(vehicle);

  return parts.map((part) => {
    const materialKey = getHomeDriveThreeParkedVehicleFallbackMaterialKey(
      part.materialKey,
      materials,
    );

    return {
      id: part.id,
      geometryKind: part.geometryKind,
      materialKey,
      position: getOffsetPosition(
        vehicle,
        part.localPosition[0],
        part.localPosition[2],
        part.localPosition[1],
      ),
      rotation: [
        vehicle.visualPitchRad + part.localRotation[0],
        vehicle.headingRad + vehicle.visualYawOffsetRad + part.localRotation[1],
        vehicle.visualRollRad + part.localRotation[2],
      ],
      scale: part.localScale,
      renderOrder: part.renderOrder ?? 0,
    };
  });
}

function createParkedVehicleBatches(
  vehicles: readonly HomeDriveParkedVehicle[],
  materials: HomeDriveThreeParkedVehicleMaterialMap,
): readonly ParkedVehicleBatch[] {
  const map = new Map<
    ParkedVehicleBatchKey,
    {
      geometryKind: ParkedVehicleInstance["geometryKind"];
      materialKey: string;
      renderOrder: number;
      instances: ParkedVehicleInstance[];
    }
  >();

  for (const vehicle of vehicles) {
    const instances = createInstancesForVehicle(vehicle, materials);

    for (const instance of instances) {
      const key = `${instance.geometryKind}:${instance.materialKey}:${instance.renderOrder}` as ParkedVehicleBatchKey;
      const existing = map.get(key);

      if (existing) {
        existing.instances.push(instance);
      } else {
        map.set(key, {
          geometryKind: instance.geometryKind,
          materialKey: instance.materialKey,
          renderOrder: instance.renderOrder,
          instances: [instance],
        });
      }
    }
  }

  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    geometryKind: value.geometryKind,
    materialKey: value.materialKey,
    renderOrder: value.renderOrder,
    instances: value.instances,
  }));
}

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
}: HomeDriveThreeParkedVehiclesProps) {
  const materials = useMemo(() => {
    return createHomeDriveThreeParkedVehicleMaterials();
  }, []);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const wheelGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 14), []);
  const cylinderGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 10), []);

  const visibleVehicles = useMemo(() => {
    return getVisibleVehicles(
      parkedVehiclesRef.current.vehicles,
      runtimeRef?.current,
      visibleRadiusMeters,
      maxVisibleVehicles,
    );
  }, [maxVisibleVehicles, parkedVehiclesRef, runtimeRef, visibleRadiusMeters]);

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
