// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/HomeDriveThreeParkedVehicles.tsx

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
  type Material,
} from "three";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
  HomeDriveParkedVehicle,
  HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import {
  getHomeDriveVehicleModelDescriptor,
  getHomeDriveVehiclePaintDescriptor,
  HOME_DRIVE_VEHICLE_PAINT_KEYS,
  type HomeDriveVehiclePaintKey,
} from "../../domain/vehicles";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeParkedVehiclesProps = Readonly<{
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleVehicles?: number;
}>;

type ParkedVehiclePartKind =
  | "body"
  | "cabin"
  | "glass"
  | "wheel"
  | "taxi-sign"
  | "cargo-box";

type ParkedVehicleInstance = Readonly<{
  id: string;
  geometryKind: "box" | "wheel";
  materialKey: string;
  position: readonly [number, number, number];
  rotationYRad: number;
  rotationZRad: number;
  scale: readonly [number, number, number];
}>;

type ParkedVehicleBatchKey = `${ParkedVehiclePartKind}:${string}`;

type ParkedVehicleBatch = Readonly<{
  key: ParkedVehicleBatchKey;
  geometryKind: "box" | "wheel";
  material: Material;
  instances: readonly ParkedVehicleInstance[];
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 560;
const DEFAULT_MAX_VISIBLE_VEHICLES = 180;

const VEHICLE_BASE_Y = 0.09;
const BODY_CENTER_Y = 0.42;
const CABIN_EXTRA_Y = 0.42;
const GLASS_EXTRA_Y = 0.45;

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
      return getDistanceSquared(vehicle.position, runtime.car.position) <= radiusSquared;
    })
    .sort((first, second) => {
      return (
        getDistanceSquared(first.position, runtime.car.position) -
        getDistanceSquared(second.position, runtime.car.position)
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
  const forward = getForwardVector(vehicle.headingRad);
  const right = getRightVector(vehicle.headingRad);

  return [
    vehicle.position.x + right.x * localX + forward.x * localZ,
    y,
    vehicle.position.z + right.z * localX + forward.z * localZ,
  ];
}

function createParkedVehicleMaterialMap(): ReadonlyMap<string, Material> {
  const materials = new Map<string, Material>();

  for (const paintKey of HOME_DRIVE_VEHICLE_PAINT_KEYS) {
    const paint = getHomeDriveVehiclePaintDescriptor(paintKey);

    materials.set(
      `paint:${paintKey}`,
      new MeshStandardMaterial({
        color: paint.color,
        roughness: paint.roughness,
        metalness: paint.metalness,
      }),
    );
  }

  materials.set(
    "glass",
    new MeshStandardMaterial({
      color: "#172436",
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.78,
    }),
  );

  materials.set(
    "wheel",
    new MeshStandardMaterial({
      color: "#101112",
      roughness: 0.82,
      metalness: 0.12,
    }),
  );

  materials.set(
    "wheel-cap",
    new MeshStandardMaterial({
      color: "#a9aaa5",
      roughness: 0.42,
      metalness: 0.42,
    }),
  );

  materials.set(
    "taxi-sign",
    new MeshStandardMaterial({
      color: "#f5e7a6",
      roughness: 0.5,
      metalness: 0.02,
      emissive: "#3b2d04",
      emissiveIntensity: 0.16,
    }),
  );

  materials.set(
    "cargo-box",
    new MeshStandardMaterial({
      color: "#f2efe5",
      roughness: 0.62,
      metalness: 0.04,
    }),
  );

  return materials;
}

function pushBoxInstance(
  instances: ParkedVehicleInstance[],
  input: Readonly<{
    id: string;
    materialKey: string;
    position: readonly [number, number, number];
    rotationYRad: number;
    scale: readonly [number, number, number];
  }>,
): void {
  instances.push({
    id: input.id,
    geometryKind: "box",
    materialKey: input.materialKey,
    position: input.position,
    rotationYRad: input.rotationYRad,
    rotationZRad: 0,
    scale: input.scale,
  });
}

function pushWheelInstance(
  instances: ParkedVehicleInstance[],
  input: Readonly<{
    id: string;
    position: readonly [number, number, number];
    rotationYRad: number;
    scale: readonly [number, number, number];
  }>,
): void {
  instances.push({
    id: input.id,
    geometryKind: "wheel",
    materialKey: "wheel",
    position: input.position,
    rotationYRad: input.rotationYRad,
    rotationZRad: Math.PI / 2,
    scale: input.scale,
  });
}

function createInstancesForVehicle(
  vehicle: HomeDriveParkedVehicle,
): readonly ParkedVehicleInstance[] {
  const model = getHomeDriveVehicleModelDescriptor(vehicle.modelKey);
  const instances: ParkedVehicleInstance[] = [];
  const bodyHeight = Math.max(0.55, vehicle.heightMeters * 0.48);
  const cabinHeight = Math.max(0.42, vehicle.heightMeters * model.visual.cabinHeightRatio);
  const cabinLength = Math.max(
    1.15,
    vehicle.lengthMeters * model.visual.cabinRatio,
  );
  const cabinWidth = Math.max(0.86, vehicle.widthMeters * 0.78);
  const cabinOffsetZ = model.visual.cabinForwardOffsetMeters;
  const paintMaterialKey = `paint:${vehicle.paintKey satisfies HomeDriveVehiclePaintKey}`;

  pushBoxInstance(instances, {
    id: `${vehicle.id}:body`,
    materialKey: paintMaterialKey,
    position: getOffsetPosition(vehicle, 0, 0, VEHICLE_BASE_Y + BODY_CENTER_Y),
    rotationYRad: vehicle.headingRad,
    scale: [vehicle.widthMeters, bodyHeight, vehicle.lengthMeters],
  });

  pushBoxInstance(instances, {
    id: `${vehicle.id}:cabin`,
    materialKey: paintMaterialKey,
    position: getOffsetPosition(
      vehicle,
      0,
      cabinOffsetZ,
      VEHICLE_BASE_Y + bodyHeight + CABIN_EXTRA_Y,
    ),
    rotationYRad: vehicle.headingRad,
    scale: [cabinWidth, cabinHeight, cabinLength],
  });

  pushBoxInstance(instances, {
    id: `${vehicle.id}:glass-front`,
    materialKey: "glass",
    position: getOffsetPosition(
      vehicle,
      0,
      cabinOffsetZ + cabinLength * 0.3,
      VEHICLE_BASE_Y + bodyHeight + GLASS_EXTRA_Y,
    ),
    rotationYRad: vehicle.headingRad,
    scale: [cabinWidth * 0.74, cabinHeight * 0.42, 0.08],
  });

  pushBoxInstance(instances, {
    id: `${vehicle.id}:glass-rear`,
    materialKey: "glass",
    position: getOffsetPosition(
      vehicle,
      0,
      cabinOffsetZ - cabinLength * 0.3,
      VEHICLE_BASE_Y + bodyHeight + GLASS_EXTRA_Y,
    ),
    rotationYRad: vehicle.headingRad,
    scale: [cabinWidth * 0.7, cabinHeight * 0.38, 0.08],
  });

  const wheelX = vehicle.widthMeters * 0.52;
  const wheelZ = vehicle.lengthMeters * 0.34;
  const wheelRadius = model.visual.wheelRadiusMeters;
  const wheelWidth = model.visual.wheelWidthMeters;

  for (const x of [-wheelX, wheelX] as const) {
    for (const z of [-wheelZ, wheelZ] as const) {
      pushWheelInstance(instances, {
        id: `${vehicle.id}:wheel:${x}:${z}`,
        position: getOffsetPosition(vehicle, x, z, VEHICLE_BASE_Y + wheelRadius),
        rotationYRad: vehicle.headingRad,
        scale: [wheelRadius, wheelWidth, wheelRadius],
      });
    }
  }

  if (vehicle.modelKey === "taxi-sedan") {
    pushBoxInstance(instances, {
      id: `${vehicle.id}:taxi-sign`,
      materialKey: "taxi-sign",
      position: getOffsetPosition(
        vehicle,
        0,
        cabinOffsetZ,
        VEHICLE_BASE_Y + bodyHeight + cabinHeight + 0.12,
      ),
      rotationYRad: vehicle.headingRad,
      scale: [0.52, 0.12, 0.22],
    });
  }

  if (vehicle.modelKey === "delivery-van") {
    pushBoxInstance(instances, {
      id: `${vehicle.id}:cargo-side`,
      materialKey: "cargo-box",
      position: getOffsetPosition(
        vehicle,
        0,
        -vehicle.lengthMeters * 0.12,
        VEHICLE_BASE_Y + bodyHeight + 0.5,
      ),
      rotationYRad: vehicle.headingRad,
      scale: [vehicle.widthMeters * 0.9, 0.68, vehicle.lengthMeters * 0.44],
    });
  }

  return instances;
}

function getPartKindFromInstance(
  instance: ParkedVehicleInstance,
): ParkedVehiclePartKind {
  if (instance.materialKey === "wheel") {
    return "wheel";
  }

  if (instance.materialKey === "glass") {
    return "glass";
  }

  if (instance.materialKey === "taxi-sign") {
    return "taxi-sign";
  }

  if (instance.materialKey === "cargo-box") {
    return "cargo-box";
  }

  if (instance.id.includes(":cabin")) {
    return "cabin";
  }

  return "body";
}

function createParkedVehicleBatches(
  vehicles: readonly HomeDriveParkedVehicle[],
  materials: ReadonlyMap<string, Material>,
): readonly ParkedVehicleBatch[] {
  const map = new Map<
    ParkedVehicleBatchKey,
    {
      geometryKind: "box" | "wheel";
      material: Material;
      instances: ParkedVehicleInstance[];
    }
  >();

  for (const vehicle of vehicles) {
    const instances = createInstancesForVehicle(vehicle);

    for (const instance of instances) {
      const partKind = getPartKindFromInstance(instance);
      const key = `${partKind}:${instance.materialKey}` as ParkedVehicleBatchKey;
      const material = materials.get(instance.materialKey);

      if (!material) {
        continue;
      }

      const existing = map.get(key);

      if (existing) {
        existing.instances.push(instance);
        continue;
      }

      map.set(key, {
        geometryKind: instance.geometryKind,
        material,
        instances: [instance],
      });
    }
  }

  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    geometryKind: value.geometryKind,
    material: value.material,
    instances: value.instances,
  }));
}

function HomeDriveThreeParkedVehicleBatch({
  batch,
  geometry,
}: Readonly<{
  batch: ParkedVehicleBatch;
  geometry: BufferGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(0, instance.rotationYRad, instance.rotationZRad);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.instances, dummy]);

  if (batch.instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, batch.material, batch.instances.length]}
      frustumCulled
      renderOrder={18}
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
    return createParkedVehicleMaterialMap();
  }, []);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const wheelGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 10), []);

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
      for (const material of materials.values()) {
        material.dispose();
      }

      boxGeometry.dispose();
      wheelGeometry.dispose();
    };
  }, [boxGeometry, materials, wheelGeometry]);

  if (batches.length <= 0) {
    return null;
  }

  return (
    <group name="home-drive-parked-vehicles">
      {batches.map((batch) => (
        <HomeDriveThreeParkedVehicleBatch
          key={batch.key}
          batch={batch}
          geometry={batch.geometryKind === "wheel" ? wheelGeometry : boxGeometry}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeParkedVehicles);
