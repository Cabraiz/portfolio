// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/HomeDriveThreeParkedVehicles.snapshot.ts

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	getHomeDriveThreeParkedVehicleFallbackMaterialKey,
	type HomeDriveThreeParkedVehicleMaterialMap,
} from "./homeDriveThree.parkedVehicleMaterials";
import {
	getHomeDriveThreeParkedVehicleDetailParts,
} from "./homeDriveThree.parkedVehicleDetails";

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

export type ParkedVehicleBatch = Readonly<{
  key: ParkedVehicleBatchKey;
  geometryKind: "box" | "wheel" | "cylinder";
  materialKey: string;
  renderOrder: number;
  instances: readonly ParkedVehicleInstance[];
}>;

export type ParkedVehicleRenderSnapshot = Readonly<{
  vehicles: readonly HomeDriveParkedVehicle[];
  key: string;
}>;

export const DEFAULT_VISIBLE_RADIUS_METERS = 560;
export const DEFAULT_MAX_VISIBLE_VEHICLES = 220;
export const DEFAULT_SNAPSHOT_HZ = 18;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getFiniteNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getParkedVehicleRenderKey(vehicle: HomeDriveParkedVehicle): string {
  return [
    vehicle.id,
    Math.round(getFiniteNumber(vehicle.impactOffset?.x, 0) * 100),
    Math.round(getFiniteNumber(vehicle.impactOffset?.z, 0) * 100),
    Math.round(getFiniteNumber(vehicle.impactVelocity?.x, 0) * 100),
    Math.round(getFiniteNumber(vehicle.impactVelocity?.z, 0) * 100),
    Math.round(getFiniteNumber(vehicle.visualRollRad, 0) * 1_000),
    Math.round(getFiniteNumber(vehicle.visualPitchRad, 0) * 1_000),
    Math.round(getFiniteNumber(vehicle.visualYawOffsetRad, 0) * 1_000),
    Math.round(getFiniteNumber(vehicle.damage, 0) * 100),
    vehicle.hasBeenHit ? 1 : 0,
    getFiniteNumber(vehicle.damageSide, 1) < 0 ? -1 : 1,
    Math.round(getFiniteNumber(vehicle.damageLocalZ, 0) * 100),
  ].join(":");
}

export function createVisibleParkedVehicleSnapshot(
  vehicles: readonly HomeDriveParkedVehicle[],
  runtime: HomeDriveRuntimeState | undefined,
  visibleRadiusMeters: number,
  maxVisibleVehicles: number,
): ParkedVehicleRenderSnapshot {
  const visibleVehicles = getVisibleVehicles(
    vehicles,
    runtime,
    visibleRadiusMeters,
    maxVisibleVehicles,
  );

  return {
    vehicles: visibleVehicles,
    key: visibleVehicles.map(getParkedVehicleRenderKey).join("|"),
  };
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
        x: vehicle.position.x + getFiniteNumber(vehicle.impactOffset?.x, 0),
        z: vehicle.position.z + getFiniteNumber(vehicle.impactOffset?.z, 0),
      };

      return getDistanceSquared(effectivePosition, runtime.car.position) <= radiusSquared;
    })
    .sort((first, second) => {
      const firstPosition = {
        x: first.position.x + getFiniteNumber(first.impactOffset?.x, 0),
        z: first.position.z + getFiniteNumber(first.impactOffset?.z, 0),
      };
      const secondPosition = {
        x: second.position.x + getFiniteNumber(second.impactOffset?.x, 0),
        z: second.position.z + getFiniteNumber(second.impactOffset?.z, 0),
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
  const baseX = vehicle.position.x + getFiniteNumber(vehicle.impactOffset?.x, 0);
  const baseZ = vehicle.position.z + getFiniteNumber(vehicle.impactOffset?.z, 0);

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

export function createParkedVehicleBatches(
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
