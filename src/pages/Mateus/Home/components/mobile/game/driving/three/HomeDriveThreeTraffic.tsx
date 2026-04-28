import { useFrame } from "@react-three/fiber";
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

import type {
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleColorKey,
} from "../domain/homeDrive.traffic.types";

type HomeDriveTrafficRef = {
  current: HomeDriveTrafficRuntimeState;
};

export type HomeDriveThreeTrafficProps = Readonly<{
  trafficRef: HomeDriveTrafficRef;
}>;

type TrafficBatch = Readonly<{
  id: string;
  indexes: readonly number[];
  material: Material;
}>;

type TrafficGeometryKind = "box" | "wheel";

type TrafficPart =
  | "body"
  | "hood"
  | "trunk"
  | "cabinFrame"
  | "windshield"
  | "rearGlass"
  | "leftSideGlass"
  | "rightSideGlass"
  | "frontBumper"
  | "rearBumper"
  | "frontLeftHeadlight"
  | "frontRightHeadlight"
  | "rearLeftTailLight"
  | "rearRightTailLight"
  | "leftMirror"
  | "rightMirror"
  | "frontLeftWheel"
  | "frontRightWheel"
  | "rearLeftWheel"
  | "rearRightWheel"
  | "frontLeftRim"
  | "frontRightRim"
  | "rearLeftRim"
  | "rearRightRim";

type VehiclePartTransform = Readonly<{
  offset: readonly [number, number, number];
  scale: readonly [number, number, number];
  localRotation: readonly [number, number, number];
}>;

type VehicleShapeProfile = Readonly<{
  bodyHeightFactor: number;
  bodyLengthFactor: number;

  hoodLengthFactor: number;
  hoodZFactor: number;

  trunkLengthFactor: number;
  trunkZFactor: number;

  cabinWidthFactor: number;
  cabinHeightFactor: number;
  cabinLengthFactor: number;
  cabinZFactor: number;

  glassHeightFactor: number;
  wheelRadiusFactor: number;
  wheelWidthFactor: number;
  frontWheelZFactor: number;
  rearWheelZFactor: number;
}>;

type SharedPartConfig = Readonly<{
  part: TrafficPart;
  geometryKind: TrafficGeometryKind;
  material: Material;
  renderOrder: number;
}>;

const PAINTED_TRAFFIC_PARTS: readonly TrafficPart[] = [
  "body",
  "hood",
  "trunk",
  "cabinFrame",
];

const TRAFFIC_MATERIALS: Readonly<
  Record<HomeDriveTrafficVehicleColorKey, MeshStandardMaterial>
> = Object.freeze({
  white: new MeshStandardMaterial({
    color: "#e1dfd0",
    roughness: 0.58,
    metalness: 0.16,
  }),
  silver: new MeshStandardMaterial({
    color: "#b6bbb7",
    roughness: 0.46,
    metalness: 0.32,
  }),
  red: new MeshStandardMaterial({
    color: "#a83b2f",
    roughness: 0.5,
    metalness: 0.18,
  }),
  blue: new MeshStandardMaterial({
    color: "#365f82",
    roughness: 0.48,
    metalness: 0.22,
  }),
  yellow: new MeshStandardMaterial({
    color: "#caa247",
    roughness: 0.54,
    metalness: 0.14,
  }),
  black: new MeshStandardMaterial({
    color: "#191d20",
    roughness: 0.38,
    metalness: 0.28,
  }),
  green: new MeshStandardMaterial({
    color: "#456a4d",
    roughness: 0.56,
    metalness: 0.14,
  }),
});

const TRAFFIC_GLASS_MATERIAL = new MeshStandardMaterial({
  color: "#16242d",
  roughness: 0.24,
  metalness: 0.34,
  transparent: true,
  opacity: 0.82,
});

const TRAFFIC_DARK_TRIM_MATERIAL = new MeshStandardMaterial({
  color: "#171a1d",
  roughness: 0.7,
  metalness: 0.18,
});

const TRAFFIC_TIRE_MATERIAL = new MeshStandardMaterial({
  color: "#101112",
  roughness: 0.86,
  metalness: 0.04,
});

const TRAFFIC_RIM_MATERIAL = new MeshStandardMaterial({
  color: "#8e9698",
  roughness: 0.36,
  metalness: 0.48,
});

const TRAFFIC_HEADLIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#f5e9c8",
  emissive: "#d5b96f",
  emissiveIntensity: 0.32,
  roughness: 0.22,
  metalness: 0.08,
});

const TRAFFIC_TAIL_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#b72d24",
  emissive: "#8b1d18",
  emissiveIntensity: 0.28,
  roughness: 0.34,
  metalness: 0.08,
});

const SHARED_PART_CONFIGS: readonly SharedPartConfig[] = [
  {
    part: "windshield",
    geometryKind: "box",
    material: TRAFFIC_GLASS_MATERIAL,
    renderOrder: 18,
  },
  {
    part: "rearGlass",
    geometryKind: "box",
    material: TRAFFIC_GLASS_MATERIAL,
    renderOrder: 18,
  },
  {
    part: "leftSideGlass",
    geometryKind: "box",
    material: TRAFFIC_GLASS_MATERIAL,
    renderOrder: 18,
  },
  {
    part: "rightSideGlass",
    geometryKind: "box",
    material: TRAFFIC_GLASS_MATERIAL,
    renderOrder: 18,
  },
  {
    part: "frontBumper",
    geometryKind: "box",
    material: TRAFFIC_DARK_TRIM_MATERIAL,
    renderOrder: 17,
  },
  {
    part: "rearBumper",
    geometryKind: "box",
    material: TRAFFIC_DARK_TRIM_MATERIAL,
    renderOrder: 17,
  },
  {
    part: "leftMirror",
    geometryKind: "box",
    material: TRAFFIC_DARK_TRIM_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "rightMirror",
    geometryKind: "box",
    material: TRAFFIC_DARK_TRIM_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "frontLeftHeadlight",
    geometryKind: "box",
    material: TRAFFIC_HEADLIGHT_MATERIAL,
    renderOrder: 20,
  },
  {
    part: "frontRightHeadlight",
    geometryKind: "box",
    material: TRAFFIC_HEADLIGHT_MATERIAL,
    renderOrder: 20,
  },
  {
    part: "rearLeftTailLight",
    geometryKind: "box",
    material: TRAFFIC_TAIL_LIGHT_MATERIAL,
    renderOrder: 20,
  },
  {
    part: "rearRightTailLight",
    geometryKind: "box",
    material: TRAFFIC_TAIL_LIGHT_MATERIAL,
    renderOrder: 20,
  },
  {
    part: "frontLeftWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "frontRightWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "rearLeftWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "rearRightWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 19,
  },
  {
    part: "frontLeftRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 21,
  },
  {
    part: "frontRightRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 21,
  },
  {
    part: "rearLeftRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 21,
  },
  {
    part: "rearRightRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 21,
  },
];

function groupTrafficByColor(
  vehicles: readonly HomeDriveTrafficVehicle[],
): readonly TrafficBatch[] {
  const map = new Map<HomeDriveTrafficVehicleColorKey, number[]>();

  vehicles.forEach((vehicle, index) => {
    const current = map.get(vehicle.colorKey);

    if (current) {
      current.push(index);
      return;
    }

    map.set(vehicle.colorKey, [index]);
  });

  return Array.from(map.entries()).map(([colorKey, indexes]) => ({
    id: `traffic-${colorKey}`,
    indexes,
    material: TRAFFIC_MATERIALS[colorKey],
  }));
}

function createAllTrafficBatch(
  vehicles: readonly HomeDriveTrafficVehicle[],
): TrafficBatch {
  return {
    id: "traffic-all",
    indexes: vehicles.map((_, index) => index),
    material: TRAFFIC_DARK_TRIM_MATERIAL,
  };
}

function getVehicleShapeProfile(
  vehicle: HomeDriveTrafficVehicle,
): VehicleShapeProfile {
  switch (vehicle.kind) {
    case "bus":
      return {
        bodyHeightFactor: 0.58,
        bodyLengthFactor: 0.98,
        hoodLengthFactor: 0.08,
        hoodZFactor: 0.42,
        trunkLengthFactor: 0.08,
        trunkZFactor: -0.42,
        cabinWidthFactor: 0.88,
        cabinHeightFactor: 0.36,
        cabinLengthFactor: 0.82,
        cabinZFactor: 0,
        glassHeightFactor: 0.18,
        wheelRadiusFactor: 0.19,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.34,
        rearWheelZFactor: 0.34,
      };

    case "van":
      return {
        bodyHeightFactor: 0.56,
        bodyLengthFactor: 0.96,
        hoodLengthFactor: 0.18,
        hoodZFactor: 0.34,
        trunkLengthFactor: 0.14,
        trunkZFactor: -0.38,
        cabinWidthFactor: 0.78,
        cabinHeightFactor: 0.42,
        cabinLengthFactor: 0.58,
        cabinZFactor: -0.02,
        glassHeightFactor: 0.2,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.17,
        frontWheelZFactor: 0.34,
        rearWheelZFactor: 0.34,
      };

    case "pickup":
      return {
        bodyHeightFactor: 0.5,
        bodyLengthFactor: 0.97,
        hoodLengthFactor: 0.28,
        hoodZFactor: 0.32,
        trunkLengthFactor: 0.32,
        trunkZFactor: -0.27,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.38,
        cabinLengthFactor: 0.34,
        cabinZFactor: 0.06,
        glassHeightFactor: 0.18,
        wheelRadiusFactor: 0.21,
        wheelWidthFactor: 0.18,
        frontWheelZFactor: 0.34,
        rearWheelZFactor: 0.33,
      };

    case "sedan":
      return {
        bodyHeightFactor: 0.46,
        bodyLengthFactor: 0.98,
        hoodLengthFactor: 0.3,
        hoodZFactor: 0.29,
        trunkLengthFactor: 0.25,
        trunkZFactor: -0.31,
        cabinWidthFactor: 0.7,
        cabinHeightFactor: 0.36,
        cabinLengthFactor: 0.42,
        cabinZFactor: -0.03,
        glassHeightFactor: 0.17,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.32,
        rearWheelZFactor: 0.32,
      };

    case "compact":
    default:
      return {
        bodyHeightFactor: 0.48,
        bodyLengthFactor: 0.96,
        hoodLengthFactor: 0.24,
        hoodZFactor: 0.3,
        trunkLengthFactor: 0.18,
        trunkZFactor: -0.34,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.38,
        cabinLengthFactor: 0.46,
        cabinZFactor: -0.02,
        glassHeightFactor: 0.18,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.31,
        rearWheelZFactor: 0.31,
      };
  }
}

function getWheelRadiusMeters(vehicle: HomeDriveTrafficVehicle): number {
  const profile = getVehicleShapeProfile(vehicle);

  return Math.max(0.34, Math.min(0.68, vehicle.heightMeters * profile.wheelRadiusFactor));
}

function getWheelWidthMeters(vehicle: HomeDriveTrafficVehicle): number {
  const profile = getVehicleShapeProfile(vehicle);

  return Math.max(0.28, vehicle.widthMeters * profile.wheelWidthFactor);
}

function isLeftSidePart(part: TrafficPart): boolean {
  return part.includes("Left") || part.startsWith("left");
}

function isRightSidePart(part: TrafficPart): boolean {
  return part.includes("Right") || part.startsWith("right");
}

function isFrontWheelPart(part: TrafficPart): boolean {
  return part.startsWith("front");
}

function isRearWheelPart(part: TrafficPart): boolean {
  return part.startsWith("rear");
}

function getBodyTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const scaleY = vehicle.heightMeters * profile.bodyHeightFactor;

  return {
    offset: [0, scaleY * 0.5, 0],
    scale: [
      vehicle.widthMeters,
      scaleY,
      vehicle.lengthMeters * profile.bodyLengthFactor,
    ],
    localRotation: [0, 0, 0],
  };
}

function getHoodTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const scaleY = vehicle.heightMeters * 0.14;

  return {
    offset: [
      0,
      bodyHeight + scaleY * 0.5,
      vehicle.lengthMeters * profile.hoodZFactor,
    ],
    scale: [
      vehicle.widthMeters * 0.86,
      scaleY,
      vehicle.lengthMeters * profile.hoodLengthFactor,
    ],
    localRotation: [-0.015, 0, 0],
  };
}

function getTrunkTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const scaleY =
    vehicle.kind === "pickup"
      ? vehicle.heightMeters * 0.12
      : vehicle.heightMeters * 0.16;

  return {
    offset: [
      0,
      bodyHeight + scaleY * 0.5,
      vehicle.lengthMeters * profile.trunkZFactor,
    ],
    scale: [
      vehicle.widthMeters * (vehicle.kind === "pickup" ? 0.9 : 0.82),
      scaleY,
      vehicle.lengthMeters * profile.trunkLengthFactor,
    ],
    localRotation: [vehicle.kind === "pickup" ? 0 : 0.012, 0, 0],
  };
}

function getCabinTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const scaleY = vehicle.heightMeters * profile.cabinHeightFactor;

  return {
    offset: [
      0,
      bodyHeight + scaleY * 0.5,
      vehicle.lengthMeters * profile.cabinZFactor,
    ],
    scale: [
      vehicle.widthMeters * profile.cabinWidthFactor,
      scaleY,
      vehicle.lengthMeters * profile.cabinLengthFactor,
    ],
    localRotation: [0.01, 0, 0],
  };
}

function getWindshieldTransform(
  vehicle: HomeDriveTrafficVehicle,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const cabinHeight = vehicle.heightMeters * profile.cabinHeightFactor;
  const cabinLength = vehicle.lengthMeters * profile.cabinLengthFactor;

  return {
    offset: [
      0,
      bodyHeight + cabinHeight * 0.55,
      vehicle.lengthMeters * profile.cabinZFactor + cabinLength * 0.52,
    ],
    scale: [
      vehicle.widthMeters * profile.cabinWidthFactor * 0.82,
      vehicle.heightMeters * profile.glassHeightFactor,
      vehicle.lengthMeters * 0.035,
    ],
    localRotation: [-0.18, 0, 0],
  };
}

function getRearGlassTransform(
  vehicle: HomeDriveTrafficVehicle,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const cabinHeight = vehicle.heightMeters * profile.cabinHeightFactor;
  const cabinLength = vehicle.lengthMeters * profile.cabinLengthFactor;

  return {
    offset: [
      0,
      bodyHeight + cabinHeight * 0.55,
      vehicle.lengthMeters * profile.cabinZFactor - cabinLength * 0.52,
    ],
    scale: [
      vehicle.widthMeters * profile.cabinWidthFactor * 0.78,
      vehicle.heightMeters * profile.glassHeightFactor,
      vehicle.lengthMeters * 0.035,
    ],
    localRotation: [0.18, 0, 0],
  };
}

function getSideGlassTransform(
  vehicle: HomeDriveTrafficVehicle,
  sideSign: -1 | 1,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const cabinHeight = vehicle.heightMeters * profile.cabinHeightFactor;
  const cabinWidth = vehicle.widthMeters * profile.cabinWidthFactor;

  return {
    offset: [
      sideSign * (cabinWidth * 0.5 + vehicle.widthMeters * 0.015),
      bodyHeight + cabinHeight * 0.58,
      vehicle.lengthMeters * profile.cabinZFactor,
    ],
    scale: [
      vehicle.widthMeters * 0.035,
      vehicle.heightMeters * profile.glassHeightFactor,
      vehicle.lengthMeters * profile.cabinLengthFactor * 0.66,
    ],
    localRotation: [0, 0, sideSign * 0.015],
  };
}

function getBumperTransform(
  vehicle: HomeDriveTrafficVehicle,
  frontSign: -1 | 1,
): VehiclePartTransform {
  return {
    offset: [
      0,
      vehicle.heightMeters * 0.22,
      frontSign * vehicle.lengthMeters * 0.51,
    ],
    scale: [
      vehicle.widthMeters * 0.84,
      vehicle.heightMeters * 0.11,
      vehicle.lengthMeters * 0.045,
    ],
    localRotation: [0, 0, 0],
  };
}

function getLightTransform(
  vehicle: HomeDriveTrafficVehicle,
  frontSign: -1 | 1,
  sideSign: -1 | 1,
): VehiclePartTransform {
  const isFront = frontSign > 0;

  return {
    offset: [
      sideSign * vehicle.widthMeters * 0.27,
      vehicle.heightMeters * (isFront ? 0.36 : 0.34),
      frontSign * vehicle.lengthMeters * 0.535,
    ],
    scale: [
      vehicle.widthMeters * 0.19,
      vehicle.heightMeters * 0.07,
      vehicle.lengthMeters * 0.024,
    ],
    localRotation: [0, 0, 0],
  };
}

function getMirrorTransform(
  vehicle: HomeDriveTrafficVehicle,
  sideSign: -1 | 1,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const cabinWidth = vehicle.widthMeters * profile.cabinWidthFactor;

  return {
    offset: [
      sideSign * (cabinWidth * 0.5 + vehicle.widthMeters * 0.08),
      vehicle.heightMeters * 0.77,
      vehicle.lengthMeters * (profile.cabinZFactor + profile.cabinLengthFactor * 0.22),
    ],
    scale: [
      vehicle.widthMeters * 0.09,
      vehicle.heightMeters * 0.055,
      vehicle.lengthMeters * 0.055,
    ],
    localRotation: [0, sideSign * 0.12, 0],
  };
}

function getWheelTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  rim: boolean,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const wheelRadius = getWheelRadiusMeters(vehicle);
  const wheelWidth = getWheelWidthMeters(vehicle);
  const sideSign: -1 | 1 = isLeftSidePart(part) ? -1 : 1;
  const zSign: -1 | 1 = isFrontWheelPart(part) ? 1 : -1;
  const wheelZFactor = isRearWheelPart(part)
    ? profile.rearWheelZFactor
    : profile.frontWheelZFactor;

  const rimScale = rim ? 0.52 : 1;

  return {
    offset: [
      sideSign * vehicle.widthMeters * 0.53,
      wheelRadius,
      zSign * vehicle.lengthMeters * wheelZFactor,
    ],
    scale: [
      wheelRadius * rimScale,
      wheelWidth * (rim ? 1.08 : 1),
      wheelRadius * rimScale,
    ],
    localRotation: [0, 0, Math.PI / 2],
  };
}

function getVehiclePartTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  if (part === "body") {
    return getBodyTransform(vehicle);
  }

  if (part === "hood") {
    return getHoodTransform(vehicle);
  }

  if (part === "trunk") {
    return getTrunkTransform(vehicle);
  }

  if (part === "cabinFrame") {
    return getCabinTransform(vehicle);
  }

  if (part === "windshield") {
    return getWindshieldTransform(vehicle);
  }

  if (part === "rearGlass") {
    return getRearGlassTransform(vehicle);
  }

  if (part === "leftSideGlass") {
    return getSideGlassTransform(vehicle, -1);
  }

  if (part === "rightSideGlass") {
    return getSideGlassTransform(vehicle, 1);
  }

  if (part === "frontBumper") {
    return getBumperTransform(vehicle, 1);
  }

  if (part === "rearBumper") {
    return getBumperTransform(vehicle, -1);
  }

  if (part === "frontLeftHeadlight") {
    return getLightTransform(vehicle, 1, -1);
  }

  if (part === "frontRightHeadlight") {
    return getLightTransform(vehicle, 1, 1);
  }

  if (part === "rearLeftTailLight") {
    return getLightTransform(vehicle, -1, -1);
  }

  if (part === "rearRightTailLight") {
    return getLightTransform(vehicle, -1, 1);
  }

  if (part === "leftMirror") {
    return getMirrorTransform(vehicle, -1);
  }

  if (part === "rightMirror") {
    return getMirrorTransform(vehicle, 1);
  }

  if (
    part === "frontLeftRim" ||
    part === "frontRightRim" ||
    part === "rearLeftRim" ||
    part === "rearRightRim"
  ) {
    return getWheelTransform(vehicle, part, true);
  }

  return getWheelTransform(vehicle, part, false);
}

function setVehiclePartMatrix(
  dummy: Object3D,
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): void {
  const transform = getVehiclePartTransform(vehicle, part);
  const [localX, localY, localZ] = transform.offset;
  const [scaleX, scaleY, scaleZ] = transform.scale;
  const [localRotX, localRotY, localRotZ] = transform.localRotation;

  const cos = Math.cos(vehicle.headingRad);
  const sin = Math.sin(vehicle.headingRad);

  const worldOffsetX = localX * cos + localZ * sin;
  const worldOffsetZ = -localX * sin + localZ * cos;

  dummy.position.set(
    vehicle.position.x + worldOffsetX,
    localY,
    vehicle.position.z + worldOffsetZ,
  );

  dummy.rotation.set(
    vehicle.visualRollRad + localRotX,
    vehicle.headingRad + localRotY,
    vehicle.damage * 0.08 + localRotZ,
  );

  dummy.scale.set(scaleX, scaleY, scaleZ);
  dummy.updateMatrix();
}

function HomeDriveTrafficInstancedPart({
  trafficRef,
  batch,
  geometry,
  part,
  material,
  renderOrder,
}: Readonly<{
  trafficRef: HomeDriveTrafficRef;
  batch: TrafficBatch;
  geometry: BufferGeometry;
  part: TrafficPart;
  material: Material;
  renderOrder: number;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const syncInstances = () => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const vehicles = trafficRef.current.vehicles;

    batch.indexes.forEach((vehicleIndex, instanceIndex) => {
      const vehicle = vehicles[vehicleIndex];

      if (!vehicle) {
        return;
      }

      setVehiclePartMatrix(dummy, vehicle, part);
      mesh.setMatrixAt(instanceIndex, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    syncInstances();
  }, [batch.indexes, dummy, part]);

  useFrame(() => {
    syncInstances();
  });

  if (batch.indexes.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, batch.indexes.length]}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}

function HomeDriveThreeTraffic({ trafficRef }: HomeDriveThreeTrafficProps) {
  const vehicles = trafficRef.current.vehicles;

  const colorBatches = useMemo(() => {
    return groupTrafficByColor(vehicles);
  }, [vehicles]);

  const allTrafficBatch = useMemo(() => {
    return createAllTrafficBatch(vehicles);
  }, [vehicles]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const wheelGeometry = useMemo(
    () => new CylinderGeometry(1, 1, 1, 18, 1),
    [],
  );

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      wheelGeometry.dispose();
    };
  }, [boxGeometry, wheelGeometry]);

  return (
    <group>
      {colorBatches.map((batch) => (
        <React.Fragment key={batch.id}>
          {PAINTED_TRAFFIC_PARTS.map((part) => (
            <HomeDriveTrafficInstancedPart
              key={`${batch.id}-${part}`}
              trafficRef={trafficRef}
              batch={batch}
              geometry={boxGeometry}
              part={part}
              material={batch.material}
              renderOrder={16}
            />
          ))}
        </React.Fragment>
      ))}

      {SHARED_PART_CONFIGS.map((config) => (
        <HomeDriveTrafficInstancedPart
          key={`traffic-shared-${config.part}`}
          trafficRef={trafficRef}
          batch={allTrafficBatch}
          geometry={
            config.geometryKind === "wheel" ? wheelGeometry : boxGeometry
          }
          part={config.part}
          material={config.material}
          renderOrder={config.renderOrder}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeTraffic);
