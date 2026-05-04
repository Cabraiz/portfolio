// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";

import {
  getHomeDriveTrafficPerformanceProfile,
  getHomeDriveTrafficRenderTier,
  getHomeDriveTrafficSpatialRelation,
  type HomeDriveTrafficRenderTier,
} from "../domain/homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleColorKey,
} from "../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";

type HomeDriveTrafficRef = {
  current: HomeDriveTrafficRuntimeState;
};

type HomeDriveRuntimeRef = {
  current: HomeDriveRuntimeState;
};

type HomeDriveTrafficRenderTiersRef = {
  current: readonly HomeDriveTrafficRenderTier[];
};

export type HomeDriveThreeTrafficProps = Readonly<{
  trafficRef: HomeDriveTrafficRef;
  runtimeRef: HomeDriveRuntimeRef;
  isPortrait: boolean;
}>;

type TrafficBatch = Readonly<{
  id: string;
  indexes: readonly number[];
  material: Material;
}>;

type TrafficGeometryKind = "box" | "wheel" | "sphere";

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
  | "frontLeftIndicator"
  | "frontRightIndicator"
  | "rearLeftIndicator"
  | "rearRightIndicator"
  | "rearBrakeLightLeft"
  | "rearBrakeLightRight"
  | "leftMirror"
  | "rightMirror"
  | "frontLeftWheel"
  | "frontRightWheel"
  | "rearLeftWheel"
  | "rearRightWheel"
  | "frontLeftRim"
  | "frontRightRim"
  | "rearLeftRim"
  | "rearRightRim"
  | "frontGrille"
  | "lowerFrontLip"
  | "sportFrontSplitter"
  | "suvBullBarLeft"
  | "suvBullBarRight"
  | "hoodScoop"
  | "taxiSign"
  | "policeLightBarLeft"
  | "policeLightBarRight"
  | "deliveryCargoBox"
  | "truckCargoBox"
  | "microbusRoofBand"
  | "twoWheelFrame"
  | "twoWheelFork"
  | "twoWheelHandlebar"
  | "twoWheelSeat"
  | "twoWheelFrontWheel"
  | "twoWheelRearWheel"
  | "twoWheelFrontRim"
  | "twoWheelRearRim"
  | "motorcycleFuelTank"
  | "motorcycleRearFender"
  | "motorcycleExhaust"
  | "motorcycleHeadlight"
  | "bicyclePedalBar"
  | "riderTorso"
  | "riderHead"
  | "riderHelmet"
  | "riderLeftArm"
  | "riderRightArm"
  | "riderLeftLeg"
  | "riderRightLeg";

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

const TRAFFIC_BODY_EULER = new Euler();
const TRAFFIC_BODY_QUATERNION = new Quaternion();
const TRAFFIC_PART_LOCAL_OFFSET = new Vector3();

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
  orange: new MeshStandardMaterial({
    color: "#c46a2d",
    roughness: 0.48,
    metalness: 0.18,
  }),
  purple: new MeshStandardMaterial({
    color: "#604574",
    roughness: 0.48,
    metalness: 0.22,
  }),
  brown: new MeshStandardMaterial({
    color: "#6a4b35",
    roughness: 0.58,
    metalness: 0.12,
  }),
  beige: new MeshStandardMaterial({
    color: "#b7a47a",
    roughness: 0.58,
    metalness: 0.12,
  }),
  cyan: new MeshStandardMaterial({
    color: "#3c8791",
    roughness: 0.5,
    metalness: 0.2,
  }),
  darkRed: new MeshStandardMaterial({
    color: "#702922",
    roughness: 0.46,
    metalness: 0.22,
  }),
  darkBlue: new MeshStandardMaterial({
    color: "#243f6a",
    roughness: 0.46,
    metalness: 0.24,
  }),
  lime: new MeshStandardMaterial({
    color: "#7d9941",
    roughness: 0.54,
    metalness: 0.14,
  }),
  cream: new MeshStandardMaterial({
    color: "#d8ceb0",
    roughness: 0.56,
    metalness: 0.12,
  }),
  charcoal: new MeshStandardMaterial({
    color: "#272b2d",
    roughness: 0.42,
    metalness: 0.3,
  }),
  policeBlue: new MeshStandardMaterial({
    color: "#1f3f67",
    roughness: 0.44,
    metalness: 0.24,
  }),
  constructionOrange: new MeshStandardMaterial({
    color: "#c96b2c",
    roughness: 0.58,
    metalness: 0.12,
  }),
  emergencyWhite: new MeshStandardMaterial({
    color: "#f4f1e8",
    roughness: 0.42,
    metalness: 0.14,
  }),
  motorcycleBlack: new MeshStandardMaterial({
    color: "#111315",
    roughness: 0.36,
    metalness: 0.28,
  }),
  bicycleTeal: new MeshStandardMaterial({
    color: "#2b7f79",
    roughness: 0.5,
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

const TRAFFIC_FRONT_GRILLE_MATERIAL = new MeshStandardMaterial({
  color: "#0f1214",
  roughness: 0.78,
  metalness: 0.16,
});

const TRAFFIC_FRONT_SPLITTER_MATERIAL = new MeshStandardMaterial({
  color: "#101214",
  roughness: 0.5,
  metalness: 0.34,
});

const TRAFFIC_CHROME_TRIM_MATERIAL = new MeshStandardMaterial({
  color: "#b7c0bd",
  roughness: 0.3,
  metalness: 0.62,
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

const TRAFFIC_INDICATOR_MATERIAL = new MeshStandardMaterial({
  color: "#e0a442",
  emissive: "#bd711b",
  emissiveIntensity: 0.68,
  roughness: 0.24,
  metalness: 0.08,
});

const TRAFFIC_BRAKE_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#e5352d",
  emissive: "#b40e0a",
  emissiveIntensity: 0.72,
  roughness: 0.24,
  metalness: 0.08,
});

const TRAFFIC_TAXI_SIGN_MATERIAL = new MeshStandardMaterial({
  color: "#f6d04d",
  emissive: "#c28a18",
  emissiveIntensity: 0.22,
  roughness: 0.42,
  metalness: 0.1,
});

const TRAFFIC_POLICE_LIGHT_BLUE_MATERIAL = new MeshStandardMaterial({
  color: "#2a74ff",
  emissive: "#174ac4",
  emissiveIntensity: 0.48,
  roughness: 0.22,
  metalness: 0.18,
});

const TRAFFIC_POLICE_LIGHT_RED_MATERIAL = new MeshStandardMaterial({
  color: "#d63229",
  emissive: "#9f1511",
  emissiveIntensity: 0.42,
  roughness: 0.24,
  metalness: 0.16,
});

const TRAFFIC_DELIVERY_BOX_MATERIAL = new MeshStandardMaterial({
  color: "#e3e0d0",
  roughness: 0.62,
  metalness: 0.12,
});

const TRAFFIC_TRUCK_CARGO_MATERIAL = new MeshStandardMaterial({
  color: "#9fa5a2",
  roughness: 0.7,
  metalness: 0.18,
});

const TRAFFIC_MICROBUS_BAND_MATERIAL = new MeshStandardMaterial({
  color: "#d7d1b5",
  roughness: 0.48,
  metalness: 0.12,
});

const TRAFFIC_TWO_WHEEL_FRAME_MATERIAL = new MeshStandardMaterial({
  color: "#1b1e20",
  roughness: 0.48,
  metalness: 0.36,
});

const TRAFFIC_TWO_WHEEL_SEAT_MATERIAL = new MeshStandardMaterial({
  color: "#111111",
  roughness: 0.72,
  metalness: 0.08,
});

const TRAFFIC_MOTORCYCLE_TANK_MATERIAL = new MeshStandardMaterial({
  color: "#24282c",
  roughness: 0.34,
  metalness: 0.38,
});

const TRAFFIC_MOTORCYCLE_EXHAUST_MATERIAL = new MeshStandardMaterial({
  color: "#b4bab8",
  roughness: 0.28,
  metalness: 0.72,
});

const TRAFFIC_RIDER_TORSO_MATERIAL = new MeshStandardMaterial({
  color: "#2c445e",
  roughness: 0.64,
  metalness: 0.04,
});

const TRAFFIC_RIDER_PANTS_MATERIAL = new MeshStandardMaterial({
  color: "#1e252b",
  roughness: 0.7,
  metalness: 0.04,
});

const TRAFFIC_RIDER_SKIN_MATERIAL = new MeshStandardMaterial({
  color: "#9f7659",
  roughness: 0.72,
  metalness: 0.02,
});

const TRAFFIC_RIDER_HELMET_MATERIAL = new MeshStandardMaterial({
  color: "#202326",
  roughness: 0.38,
  metalness: 0.28,
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
    part: "frontGrille",
    geometryKind: "box",
    material: TRAFFIC_FRONT_GRILLE_MATERIAL,
    renderOrder: 22,
  },
  {
    part: "lowerFrontLip",
    geometryKind: "box",
    material: TRAFFIC_FRONT_SPLITTER_MATERIAL,
    renderOrder: 22,
  },
  {
    part: "sportFrontSplitter",
    geometryKind: "box",
    material: TRAFFIC_FRONT_SPLITTER_MATERIAL,
    renderOrder: 23,
  },
  {
    part: "suvBullBarLeft",
    geometryKind: "box",
    material: TRAFFIC_CHROME_TRIM_MATERIAL,
    renderOrder: 23,
  },
  {
    part: "suvBullBarRight",
    geometryKind: "box",
    material: TRAFFIC_CHROME_TRIM_MATERIAL,
    renderOrder: 23,
  },
  {
    part: "hoodScoop",
    geometryKind: "box",
    material: TRAFFIC_FRONT_GRILLE_MATERIAL,
    renderOrder: 23,
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
    part: "frontLeftIndicator",
    geometryKind: "box",
    material: TRAFFIC_INDICATOR_MATERIAL,
    renderOrder: 25,
  },
  {
    part: "frontRightIndicator",
    geometryKind: "box",
    material: TRAFFIC_INDICATOR_MATERIAL,
    renderOrder: 25,
  },
  {
    part: "rearLeftIndicator",
    geometryKind: "box",
    material: TRAFFIC_INDICATOR_MATERIAL,
    renderOrder: 25,
  },
  {
    part: "rearRightIndicator",
    geometryKind: "box",
    material: TRAFFIC_INDICATOR_MATERIAL,
    renderOrder: 25,
  },
  {
    part: "rearBrakeLightLeft",
    geometryKind: "box",
    material: TRAFFIC_BRAKE_LIGHT_MATERIAL,
    renderOrder: 26,
  },
  {
    part: "rearBrakeLightRight",
    geometryKind: "box",
    material: TRAFFIC_BRAKE_LIGHT_MATERIAL,
    renderOrder: 26,
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
  {
    part: "taxiSign",
    geometryKind: "box",
    material: TRAFFIC_TAXI_SIGN_MATERIAL,
    renderOrder: 23,
  },
  {
    part: "policeLightBarLeft",
    geometryKind: "box",
    material: TRAFFIC_POLICE_LIGHT_BLUE_MATERIAL,
    renderOrder: 24,
  },
  {
    part: "policeLightBarRight",
    geometryKind: "box",
    material: TRAFFIC_POLICE_LIGHT_RED_MATERIAL,
    renderOrder: 24,
  },
  {
    part: "deliveryCargoBox",
    geometryKind: "box",
    material: TRAFFIC_DELIVERY_BOX_MATERIAL,
    renderOrder: 15,
  },
  {
    part: "truckCargoBox",
    geometryKind: "box",
    material: TRAFFIC_TRUCK_CARGO_MATERIAL,
    renderOrder: 15,
  },
  {
    part: "microbusRoofBand",
    geometryKind: "box",
    material: TRAFFIC_MICROBUS_BAND_MATERIAL,
    renderOrder: 23,
  },
  {
    part: "twoWheelFrame",
    geometryKind: "box",
    material: TRAFFIC_TWO_WHEEL_FRAME_MATERIAL,
    renderOrder: 28,
  },
  {
    part: "twoWheelFork",
    geometryKind: "box",
    material: TRAFFIC_CHROME_TRIM_MATERIAL,
    renderOrder: 29,
  },
  {
    part: "twoWheelHandlebar",
    geometryKind: "box",
    material: TRAFFIC_CHROME_TRIM_MATERIAL,
    renderOrder: 30,
  },
  {
    part: "twoWheelSeat",
    geometryKind: "box",
    material: TRAFFIC_TWO_WHEEL_SEAT_MATERIAL,
    renderOrder: 30,
  },
  {
    part: "twoWheelFrontWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 27,
  },
  {
    part: "twoWheelRearWheel",
    geometryKind: "wheel",
    material: TRAFFIC_TIRE_MATERIAL,
    renderOrder: 27,
  },
  {
    part: "twoWheelFrontRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 28,
  },
  {
    part: "twoWheelRearRim",
    geometryKind: "wheel",
    material: TRAFFIC_RIM_MATERIAL,
    renderOrder: 28,
  },
  {
    part: "motorcycleFuelTank",
    geometryKind: "box",
    material: TRAFFIC_MOTORCYCLE_TANK_MATERIAL,
    renderOrder: 31,
  },
  {
    part: "motorcycleRearFender",
    geometryKind: "box",
    material: TRAFFIC_MOTORCYCLE_TANK_MATERIAL,
    renderOrder: 30,
  },
  {
    part: "motorcycleExhaust",
    geometryKind: "box",
    material: TRAFFIC_MOTORCYCLE_EXHAUST_MATERIAL,
    renderOrder: 31,
  },
  {
    part: "motorcycleHeadlight",
    geometryKind: "box",
    material: TRAFFIC_HEADLIGHT_MATERIAL,
    renderOrder: 32,
  },
  {
    part: "bicyclePedalBar",
    geometryKind: "box",
    material: TRAFFIC_CHROME_TRIM_MATERIAL,
    renderOrder: 31,
  },
  {
    part: "riderTorso",
    geometryKind: "box",
    material: TRAFFIC_RIDER_TORSO_MATERIAL,
    renderOrder: 34,
  },
  {
    part: "riderHead",
    geometryKind: "sphere",
    material: TRAFFIC_RIDER_SKIN_MATERIAL,
    renderOrder: 35,
  },
  {
    part: "riderHelmet",
    geometryKind: "sphere",
    material: TRAFFIC_RIDER_HELMET_MATERIAL,
    renderOrder: 36,
  },
  {
    part: "riderLeftArm",
    geometryKind: "box",
    material: TRAFFIC_RIDER_SKIN_MATERIAL,
    renderOrder: 34,
  },
  {
    part: "riderRightArm",
    geometryKind: "box",
    material: TRAFFIC_RIDER_SKIN_MATERIAL,
    renderOrder: 34,
  },
  {
    part: "riderLeftLeg",
    geometryKind: "box",
    material: TRAFFIC_RIDER_PANTS_MATERIAL,
    renderOrder: 34,
  },
  {
    part: "riderRightLeg",
    geometryKind: "box",
    material: TRAFFIC_RIDER_PANTS_MATERIAL,
    renderOrder: 34,
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

function isTwoWheelVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "motorcycle" || vehicle.kind === "bicycle";
}

function isMotorcycleVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "motorcycle";
}

function isBicycleVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "bicycle";
}

function isTwoWheelTrafficPart(part: TrafficPart): boolean {
  switch (part) {
    case "twoWheelFrame":
    case "twoWheelFork":
    case "twoWheelHandlebar":
    case "twoWheelSeat":
    case "twoWheelFrontWheel":
    case "twoWheelRearWheel":
    case "twoWheelFrontRim":
    case "twoWheelRearRim":
    case "motorcycleFuelTank":
    case "motorcycleRearFender":
    case "motorcycleExhaust":
    case "motorcycleHeadlight":
    case "bicyclePedalBar":
    case "riderTorso":
    case "riderHead":
    case "riderHelmet":
    case "riderLeftArm":
    case "riderRightArm":
    case "riderLeftLeg":
    case "riderRightLeg":
      return true;

    default:
      return false;
  }
}

function getVehicleShapeProfile(
  vehicle: HomeDriveTrafficVehicle,
): VehicleShapeProfile {
  switch (vehicle.kind) {
    case "bicycle":
      return {
        bodyHeightFactor: 0.18,
        bodyLengthFactor: 0.62,
        hoodLengthFactor: 0.08,
        hoodZFactor: 0.22,
        trunkLengthFactor: 0.08,
        trunkZFactor: -0.24,
        cabinWidthFactor: 0.36,
        cabinHeightFactor: 0.46,
        cabinLengthFactor: 0.2,
        cabinZFactor: 0,
        glassHeightFactor: 0.08,
        wheelRadiusFactor: 0.22,
        wheelWidthFactor: 0.075,
        frontWheelZFactor: 0.38,
        rearWheelZFactor: 0.38,
      };

    case "motorcycle":
      return {
        bodyHeightFactor: 0.22,
        bodyLengthFactor: 0.68,
        hoodLengthFactor: 0.12,
        hoodZFactor: 0.22,
        trunkLengthFactor: 0.12,
        trunkZFactor: -0.25,
        cabinWidthFactor: 0.42,
        cabinHeightFactor: 0.46,
        cabinLengthFactor: 0.22,
        cabinZFactor: 0.02,
        glassHeightFactor: 0.1,
        wheelRadiusFactor: 0.24,
        wheelWidthFactor: 0.12,
        frontWheelZFactor: 0.38,
        rearWheelZFactor: 0.38,
      };
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

    case "microbus":
      return {
        bodyHeightFactor: 0.58,
        bodyLengthFactor: 0.98,
        hoodLengthFactor: 0.1,
        hoodZFactor: 0.4,
        trunkLengthFactor: 0.1,
        trunkZFactor: -0.42,
        cabinWidthFactor: 0.84,
        cabinHeightFactor: 0.38,
        cabinLengthFactor: 0.74,
        cabinZFactor: -0.02,
        glassHeightFactor: 0.19,
        wheelRadiusFactor: 0.19,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.33,
        rearWheelZFactor: 0.33,
      };

    case "truck":
      return {
        bodyHeightFactor: 0.46,
        bodyLengthFactor: 0.92,
        hoodLengthFactor: 0.2,
        hoodZFactor: 0.38,
        trunkLengthFactor: 0.5,
        trunkZFactor: -0.18,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.38,
        cabinLengthFactor: 0.28,
        cabinZFactor: 0.26,
        glassHeightFactor: 0.17,
        wheelRadiusFactor: 0.22,
        wheelWidthFactor: 0.18,
        frontWheelZFactor: 0.36,
        rearWheelZFactor: 0.31,
      };

    case "delivery":
      return {
        bodyHeightFactor: 0.48,
        bodyLengthFactor: 0.94,
        hoodLengthFactor: 0.2,
        hoodZFactor: 0.34,
        trunkLengthFactor: 0.42,
        trunkZFactor: -0.2,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.36,
        cabinLengthFactor: 0.32,
        cabinZFactor: 0.22,
        glassHeightFactor: 0.17,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.17,
        frontWheelZFactor: 0.33,
        rearWheelZFactor: 0.32,
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

    case "suv":
      return {
        bodyHeightFactor: 0.52,
        bodyLengthFactor: 0.97,
        hoodLengthFactor: 0.28,
        hoodZFactor: 0.31,
        trunkLengthFactor: 0.22,
        trunkZFactor: -0.33,
        cabinWidthFactor: 0.74,
        cabinHeightFactor: 0.4,
        cabinLengthFactor: 0.48,
        cabinZFactor: -0.04,
        glassHeightFactor: 0.18,
        wheelRadiusFactor: 0.21,
        wheelWidthFactor: 0.18,
        frontWheelZFactor: 0.33,
        rearWheelZFactor: 0.33,
      };

    case "police":
    case "taxi":
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

    case "sport":
      return {
        bodyHeightFactor: 0.42,
        bodyLengthFactor: 0.98,
        hoodLengthFactor: 0.34,
        hoodZFactor: 0.28,
        trunkLengthFactor: 0.22,
        trunkZFactor: -0.34,
        cabinWidthFactor: 0.68,
        cabinHeightFactor: 0.3,
        cabinLengthFactor: 0.36,
        cabinZFactor: -0.06,
        glassHeightFactor: 0.14,
        wheelRadiusFactor: 0.22,
        wheelWidthFactor: 0.17,
        frontWheelZFactor: 0.33,
        rearWheelZFactor: 0.33,
      };

    case "wagon":
      return {
        bodyHeightFactor: 0.47,
        bodyLengthFactor: 0.99,
        hoodLengthFactor: 0.28,
        hoodZFactor: 0.3,
        trunkLengthFactor: 0.34,
        trunkZFactor: -0.26,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.37,
        cabinLengthFactor: 0.5,
        cabinZFactor: -0.08,
        glassHeightFactor: 0.17,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.32,
        rearWheelZFactor: 0.34,
      };

    case "hatch":
      return {
        bodyHeightFactor: 0.49,
        bodyLengthFactor: 0.96,
        hoodLengthFactor: 0.24,
        hoodZFactor: 0.3,
        trunkLengthFactor: 0.14,
        trunkZFactor: -0.36,
        cabinWidthFactor: 0.72,
        cabinHeightFactor: 0.39,
        cabinLengthFactor: 0.48,
        cabinZFactor: -0.02,
        glassHeightFactor: 0.18,
        wheelRadiusFactor: 0.2,
        wheelWidthFactor: 0.16,
        frontWheelZFactor: 0.31,
        rearWheelZFactor: 0.32,
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

  return Math.max(
    0.34,
    Math.min(0.68, vehicle.heightMeters * profile.wheelRadiusFactor),
  );
}

function getWheelWidthMeters(vehicle: HomeDriveTrafficVehicle): number {
  const profile = getVehicleShapeProfile(vehicle);

  if (isBicycleVehicle(vehicle)) {
    return Math.max(0.045, Math.min(0.08, vehicle.widthMeters * profile.wheelWidthFactor));
  }

  if (isMotorcycleVehicle(vehicle)) {
    return Math.max(0.08, Math.min(0.16, vehicle.widthMeters * profile.wheelWidthFactor));
  }

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
  const isFront = frontSign > 0;

  const heightFactor = (() => {
    if (!isFront) return 0.11;

    switch (vehicle.kind) {
      case "truck":
      case "delivery":
        return 0.16;
      case "suv":
      case "pickup":
        return 0.14;
      case "sport":
        return 0.085;
      case "bus":
      case "microbus":
        return 0.13;
      default:
        return 0.11;
    }
  })();

  const widthFactor = (() => {
    if (!isFront) return 0.84;

    switch (vehicle.kind) {
      case "sport":
        return 0.94;
      case "truck":
      case "delivery":
        return 0.72;
      case "bus":
      case "microbus":
        return 0.9;
      case "suv":
      case "pickup":
        return 0.88;
      default:
        return 0.84;
    }
  })();

  return {
    offset: [
      0,
      vehicle.heightMeters * (isFront ? 0.23 : 0.22),
      frontSign * vehicle.lengthMeters * 0.51,
    ],
    scale: [
      vehicle.widthMeters * widthFactor,
      vehicle.heightMeters * heightFactor,
      vehicle.lengthMeters * (isFront && vehicle.kind === "sport" ? 0.032 : 0.045),
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

  const widthFactor = (() => {
    if (!isFront) return 0.16;

    switch (vehicle.kind) {
      case "sport":
        return 0.28;
      case "suv":
      case "pickup":
        return 0.22;
      case "truck":
      case "delivery":
        return 0.13;
      case "bus":
      case "microbus":
        return 0.14;
      case "hatch":
      case "compact":
        return 0.2;
      default:
        return 0.19;
    }
  })();

  const heightFactor = (() => {
    if (!isFront) return 0.07;

    switch (vehicle.kind) {
      case "sport":
        return 0.045;
      case "truck":
      case "delivery":
      case "bus":
      case "microbus":
        return 0.09;
      case "suv":
      case "pickup":
        return 0.078;
      default:
        return 0.07;
    }
  })();

  const sideFactor = (() => {
    if (!isFront) return 0.27;

    switch (vehicle.kind) {
      case "truck":
      case "delivery":
      case "bus":
      case "microbus":
        return 0.22;
      case "sport":
        return 0.31;
      default:
        return 0.27;
    }
  })();

  return {
    offset: [
      sideSign * vehicle.widthMeters * sideFactor,
      vehicle.heightMeters * (isFront ? 0.36 : 0.34),
      frontSign * vehicle.lengthMeters * 0.535,
    ],
    scale: [
      vehicle.widthMeters * widthFactor,
      vehicle.heightMeters * heightFactor,
      vehicle.lengthMeters * (isFront && vehicle.kind === "sport" ? 0.018 : 0.024),
    ],
    localRotation: [0, 0, isFront && vehicle.kind === "sport" ? sideSign * 0.06 : 0],
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

function isTrafficIndicatorPart(part: TrafficPart): boolean {
  return (
    part === "frontLeftIndicator" ||
    part === "frontRightIndicator" ||
    part === "rearLeftIndicator" ||
    part === "rearRightIndicator"
  );
}

function isTrafficBrakeLightPart(part: TrafficPart): boolean {
  return part === "rearBrakeLightLeft" || part === "rearBrakeLightRight";
}

function isLeftIndicatorPart(part: TrafficPart): boolean {
  return part === "frontLeftIndicator" || part === "rearLeftIndicator";
}

function shouldRenderTrafficIndicator(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  elapsedSeconds: number,
): boolean {
  if (!isTrafficIndicatorPart(part) || !vehicle.turnSignal) {
    return false;
  }

  const blinkOn = Math.floor(elapsedSeconds * 2.85) % 2 === 0;

  if (!blinkOn) {
    return false;
  }

  if (vehicle.turnSignal === "hazard") {
    return true;
  }

  return vehicle.turnSignal === "left"
    ? isLeftIndicatorPart(part)
    : !isLeftIndicatorPart(part);
}

function shouldRenderTrafficBrakeLight(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): boolean {
  return isTrafficBrakeLightPart(part) && vehicle.brakeLightIntensity > 0.08;
}

function shouldRenderTrafficPart(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  elapsedSeconds = 0,
): boolean {
  if (isTwoWheelVehicle(vehicle)) {
    if (!isTwoWheelTrafficPart(part)) {
      return false;
    }

    if (isBicycleVehicle(vehicle)) {
      return (
        part !== "motorcycleFuelTank" &&
        part !== "motorcycleRearFender" &&
        part !== "motorcycleExhaust" &&
        part !== "motorcycleHeadlight"
      );
    }

    return part !== "bicyclePedalBar";
  }

  if (isTwoWheelTrafficPart(part)) {
    return false;
  }

  if (isTrafficIndicatorPart(part)) {
    return shouldRenderTrafficIndicator(vehicle, part, elapsedSeconds);
  }

  if (isTrafficBrakeLightPart(part)) {
    return shouldRenderTrafficBrakeLight(vehicle, part);
  }

  switch (part) {
    case "taxiSign":
      return vehicle.kind === "taxi";

    case "policeLightBarLeft":
    case "policeLightBarRight":
      return vehicle.kind === "police";

    case "deliveryCargoBox":
      return vehicle.kind === "delivery";

    case "truckCargoBox":
      return vehicle.kind === "truck";

    case "microbusRoofBand":
      return vehicle.kind === "microbus";

    case "frontGrille":
      return true;

    case "lowerFrontLip":
      return (
        vehicle.kind !== "bus" &&
        vehicle.kind !== "microbus" &&
        vehicle.kind !== "truck" &&
        vehicle.kind !== "delivery"
      );

    case "sportFrontSplitter":
      return vehicle.kind === "sport" || vehicle.kind === "police";

    case "suvBullBarLeft":
    case "suvBullBarRight":
      return (
        vehicle.kind === "suv" ||
        vehicle.kind === "pickup" ||
        vehicle.kind === "truck" ||
        vehicle.kind === "delivery"
      );

    case "hoodScoop":
      return vehicle.kind === "sport" || vehicle.kind === "pickup";

    default:
      return true;
  }
}

function hideTrafficPartMatrix(dummy: Object3D): void {
  dummy.position.set(0, -9999, 0);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(0.0001, 0.0001, 0.0001);
  dummy.updateMatrix();
}

function getRoofAccessoryTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const cabinHeight = vehicle.heightMeters * profile.cabinHeightFactor;
  const cabinLength = vehicle.lengthMeters * profile.cabinLengthFactor;
  const cabinTopY = bodyHeight + cabinHeight;

  if (part === "taxiSign") {
    return {
      offset: [
        0,
        cabinTopY + vehicle.heightMeters * 0.045,
        vehicle.lengthMeters * profile.cabinZFactor + cabinLength * 0.02,
      ],
      scale: [
        vehicle.widthMeters * 0.34,
        vehicle.heightMeters * 0.09,
        vehicle.lengthMeters * 0.08,
      ],
      localRotation: [0, 0, 0],
    };
  }

  if (part === "policeLightBarLeft" || part === "policeLightBarRight") {
    const sideSign = part === "policeLightBarLeft" ? -1 : 1;

    return {
      offset: [
        sideSign * vehicle.widthMeters * 0.11,
        cabinTopY + vehicle.heightMeters * 0.045,
        vehicle.lengthMeters * profile.cabinZFactor + cabinLength * 0.02,
      ],
      scale: [
        vehicle.widthMeters * 0.2,
        vehicle.heightMeters * 0.075,
        vehicle.lengthMeters * 0.06,
      ],
      localRotation: [0, 0, 0],
    };
  }

  return {
    offset: [
      0,
      bodyHeight + cabinHeight + vehicle.heightMeters * 0.035,
      vehicle.lengthMeters * profile.cabinZFactor,
    ],
    scale: [
      vehicle.widthMeters * 0.8,
      vehicle.heightMeters * 0.055,
      vehicle.lengthMeters * 0.64,
    ],
    localRotation: [0, 0, 0],
  };
}

function getCargoBoxTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: "deliveryCargoBox" | "truckCargoBox",
): VehiclePartTransform {
  const isTruck = part === "truckCargoBox";
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;
  const cargoHeight = vehicle.heightMeters * (isTruck ? 0.66 : 0.58);
  const cargoLength = vehicle.lengthMeters * (isTruck ? 0.56 : 0.5);

  return {
    offset: [
      0,
      bodyHeight + cargoHeight * 0.5,
      -vehicle.lengthMeters * (isTruck ? 0.13 : 0.14),
    ],
    scale: [
      vehicle.widthMeters * (isTruck ? 0.92 : 0.88),
      cargoHeight,
      cargoLength,
    ],
    localRotation: [0, 0, 0],
  };
}

function getFrontGrilleTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const isHeavy =
    vehicle.kind === "truck" ||
    vehicle.kind === "delivery" ||
    vehicle.kind === "bus" ||
    vehicle.kind === "microbus";

  const widthFactor = (() => {
    switch (vehicle.kind) {
      case "truck":
      case "delivery":
        return 0.52;
      case "bus":
      case "microbus":
        return 0.62;
      case "sport":
        return 0.68;
      case "suv":
      case "pickup":
        return 0.58;
      default:
        return 0.48;
    }
  })();

  const heightFactor = (() => {
    switch (vehicle.kind) {
      case "truck":
      case "delivery":
      case "bus":
      case "microbus":
        return 0.18;
      case "suv":
      case "pickup":
        return 0.12;
      case "sport":
        return 0.065;
      default:
        return 0.09;
    }
  })();

  return {
    offset: [
      0,
      vehicle.heightMeters * (isHeavy ? 0.42 : 0.35),
      vehicle.lengthMeters * 0.542,
    ],
    scale: [
      vehicle.widthMeters * widthFactor,
      vehicle.heightMeters * heightFactor,
      vehicle.lengthMeters * 0.026,
    ],
    localRotation: [0, 0, 0],
  };
}

function getLowerFrontLipTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  return {
    offset: [
      0,
      vehicle.heightMeters * 0.12,
      vehicle.lengthMeters * 0.548,
    ],
    scale: [
      vehicle.widthMeters * (vehicle.kind === "sport" ? 0.96 : 0.74),
      vehicle.heightMeters * (vehicle.kind === "sport" ? 0.052 : 0.04),
      vehicle.lengthMeters * 0.035,
    ],
    localRotation: [0, 0, 0],
  };
}

function getSportFrontSplitterTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  return {
    offset: [
      0,
      vehicle.heightMeters * 0.08,
      vehicle.lengthMeters * 0.57,
    ],
    scale: [
      vehicle.widthMeters * 1.02,
      vehicle.heightMeters * 0.035,
      vehicle.lengthMeters * 0.08,
    ],
    localRotation: [0.02, 0, 0],
  };
}

function getBullBarTransform(
  vehicle: HomeDriveTrafficVehicle,
  sideSign: -1 | 1,
): VehiclePartTransform {
  return {
    offset: [
      sideSign * vehicle.widthMeters * 0.19,
      vehicle.heightMeters * 0.32,
      vehicle.lengthMeters * 0.57,
    ],
    scale: [
      vehicle.widthMeters * 0.08,
      vehicle.heightMeters * 0.34,
      vehicle.lengthMeters * 0.034,
    ],
    localRotation: [0, 0, sideSign * 0.04],
  };
}

function getHoodScoopTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightFactor;

  return {
    offset: [
      0,
      bodyHeight + vehicle.heightMeters * 0.19,
      vehicle.lengthMeters * 0.26,
    ],
    scale: [
      vehicle.widthMeters * (vehicle.kind === "sport" ? 0.24 : 0.18),
      vehicle.heightMeters * 0.07,
      vehicle.lengthMeters * 0.16,
    ],
    localRotation: [-0.02, 0, 0],
  };
}

function getTwoWheelWheelTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  rim: boolean,
): VehiclePartTransform {
  const profile = getVehicleShapeProfile(vehicle);
  const wheelRadius = getWheelRadiusMeters(vehicle);
  const wheelWidth = getWheelWidthMeters(vehicle);
  const isFront = part === "twoWheelFrontWheel" || part === "twoWheelFrontRim";
  const zSign: -1 | 1 = isFront ? 1 : -1;
  const wheelZFactor = isFront
    ? profile.frontWheelZFactor
    : profile.rearWheelZFactor;
  const rimScale = rim ? 0.56 : 1;

  return {
    offset: [0, wheelRadius, zSign * vehicle.lengthMeters * wheelZFactor],
    scale: [
      wheelRadius * rimScale,
      wheelWidth * (rim ? 0.72 : 1),
      wheelRadius * rimScale,
    ],
    localRotation: [0, 0, Math.PI / 2],
  };
}

function getTwoWheelFrameTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  const wheelRadius = getWheelRadiusMeters(vehicle);
  const isBicycle = isBicycleVehicle(vehicle);
  const frontZ = vehicle.lengthMeters * 0.36;
  const rearZ = -vehicle.lengthMeters * 0.34;
  const frameY = wheelRadius * (isBicycle ? 1.68 : 1.55);

  switch (part) {
    case "twoWheelFrame":
      return {
        offset: [0, frameY, isBicycle ? -vehicle.lengthMeters * 0.02 : 0],
        scale: [
          vehicle.widthMeters * (isBicycle ? 0.11 : 0.16),
          vehicle.heightMeters * (isBicycle ? 0.09 : 0.13),
          vehicle.lengthMeters * (isBicycle ? 0.58 : 0.52),
        ],
        localRotation: [isBicycle ? -0.1 : -0.04, 0, 0],
      };

    case "twoWheelFork":
      return {
        offset: [0, frameY + vehicle.heightMeters * 0.18, frontZ - vehicle.lengthMeters * 0.05],
        scale: [
          vehicle.widthMeters * (isBicycle ? 0.075 : 0.095),
          vehicle.heightMeters * (isBicycle ? 0.36 : 0.34),
          vehicle.lengthMeters * 0.035,
        ],
        localRotation: [-0.24, 0, 0],
      };

    case "twoWheelHandlebar":
      return {
        offset: [0, vehicle.heightMeters * (isBicycle ? 0.92 : 0.82), frontZ - vehicle.lengthMeters * 0.09],
        scale: [
          vehicle.widthMeters * (isBicycle ? 0.62 : 0.54),
          vehicle.heightMeters * 0.045,
          vehicle.lengthMeters * 0.045,
        ],
        localRotation: [0, 0, 0],
      };

    case "twoWheelSeat":
      return {
        offset: [0, vehicle.heightMeters * (isBicycle ? 0.66 : 0.58), rearZ + vehicle.lengthMeters * 0.18],
        scale: [
          vehicle.widthMeters * (isBicycle ? 0.34 : 0.38),
          vehicle.heightMeters * 0.055,
          vehicle.lengthMeters * (isBicycle ? 0.14 : 0.18),
        ],
        localRotation: [0.02, 0, 0],
      };

    case "bicyclePedalBar":
      return {
        offset: [0, frameY - vehicle.heightMeters * 0.16, -vehicle.lengthMeters * 0.02],
        scale: [vehicle.widthMeters * 0.42, vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.035],
        localRotation: [0, 0, 0.18],
      };

    default:
      return {
        offset: [0, frameY, 0],
        scale: [0.001, 0.001, 0.001],
        localRotation: [0, 0, 0],
      };
  }
}

function getMotorcycleAccessoryTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  const wheelRadius = getWheelRadiusMeters(vehicle);
  const frontZ = vehicle.lengthMeters * 0.36;
  const rearZ = -vehicle.lengthMeters * 0.34;

  switch (part) {
    case "motorcycleFuelTank":
      return {
        offset: [0, wheelRadius * 2.08, vehicle.lengthMeters * 0.08],
        scale: [vehicle.widthMeters * 0.38, vehicle.heightMeters * 0.18, vehicle.lengthMeters * 0.24],
        localRotation: [-0.04, 0, 0],
      };

    case "motorcycleRearFender":
      return {
        offset: [0, wheelRadius * 1.82, rearZ + vehicle.lengthMeters * 0.04],
        scale: [vehicle.widthMeters * 0.28, vehicle.heightMeters * 0.08, vehicle.lengthMeters * 0.24],
        localRotation: [0.08, 0, 0],
      };

    case "motorcycleExhaust":
      return {
        offset: [vehicle.widthMeters * 0.28, wheelRadius * 1.32, -vehicle.lengthMeters * 0.14],
        scale: [vehicle.widthMeters * 0.08, vehicle.heightMeters * 0.08, vehicle.lengthMeters * 0.44],
        localRotation: [0.02, 0.08, 0.02],
      };

    case "motorcycleHeadlight":
      return {
        offset: [0, wheelRadius * 2.42, frontZ - vehicle.lengthMeters * 0.09],
        scale: [vehicle.widthMeters * 0.18, vehicle.heightMeters * 0.11, vehicle.lengthMeters * 0.055],
        localRotation: [0, 0, 0],
      };

    default:
      return {
        offset: [0, wheelRadius, 0],
        scale: [0.001, 0.001, 0.001],
        localRotation: [0, 0, 0],
      };
  }
}

function getRiderTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  const isBicycle = isBicycleVehicle(vehicle);
  const lean = isBicycle ? -0.34 : -0.24;
  const torsoY = vehicle.heightMeters * (isBicycle ? 0.88 : 0.86);
  const torsoZ = vehicle.lengthMeters * (isBicycle ? 0.04 : 0.02);
  const headRadius = vehicle.heightMeters * (isBicycle ? 0.105 : 0.115);

  switch (part) {
    case "riderTorso":
      return {
        offset: [0, torsoY, torsoZ],
        scale: [vehicle.widthMeters * 0.32, vehicle.heightMeters * 0.34, vehicle.lengthMeters * 0.12],
        localRotation: [lean, 0, 0],
      };

    case "riderHead":
      return {
        offset: [0, torsoY + vehicle.heightMeters * 0.29, torsoZ + vehicle.lengthMeters * 0.08],
        scale: [headRadius, headRadius, headRadius],
        localRotation: [0, 0, 0],
      };

    case "riderHelmet":
      return {
        offset: [0, torsoY + vehicle.heightMeters * 0.305, torsoZ + vehicle.lengthMeters * 0.082],
        scale: [headRadius * 1.08, headRadius * 0.72, headRadius * 1.08],
        localRotation: [0, 0, 0],
      };

    case "riderLeftArm":
    case "riderRightArm": {
      const sideSign: -1 | 1 = part === "riderLeftArm" ? -1 : 1;

      return {
        offset: [
          sideSign * vehicle.widthMeters * 0.2,
          torsoY + vehicle.heightMeters * 0.02,
          vehicle.lengthMeters * 0.22,
        ],
        scale: [vehicle.widthMeters * 0.07, vehicle.heightMeters * 0.31, vehicle.widthMeters * 0.07],
        localRotation: [0.64, 0, sideSign * 0.22],
      };
    }

    case "riderLeftLeg":
    case "riderRightLeg": {
      const sideSign: -1 | 1 = part === "riderLeftLeg" ? -1 : 1;

      return {
        offset: [
          sideSign * vehicle.widthMeters * 0.13,
          vehicle.heightMeters * (isBicycle ? 0.55 : 0.52),
          -vehicle.lengthMeters * 0.05,
        ],
        scale: [vehicle.widthMeters * 0.075, vehicle.heightMeters * 0.32, vehicle.widthMeters * 0.075],
        localRotation: [isBicycle ? -0.18 : -0.08, 0, sideSign * 0.18],
      };
    }

    default:
      return {
        offset: [0, torsoY, torsoZ],
        scale: [0.001, 0.001, 0.001],
        localRotation: [0, 0, 0],
      };
  }
}

function getIndicatorTransform(
  vehicle: HomeDriveTrafficVehicle,
  frontSign: -1 | 1,
  sideSign: -1 | 1,
): VehiclePartTransform {
  const base = getLightTransform(vehicle, frontSign, sideSign);
  const [baseX, baseY, baseZ] = base.offset;
  const [baseScaleX, baseScaleY, baseScaleZ] = base.scale;

  return {
    offset: [
      baseX + sideSign * vehicle.widthMeters * 0.105,
      baseY + vehicle.heightMeters * 0.012,
      baseZ + frontSign * vehicle.lengthMeters * 0.006,
    ],
    scale: [
      Math.max(0.08, baseScaleX * 0.36),
      Math.max(0.045, baseScaleY * 0.86),
      Math.max(0.026, baseScaleZ * 1.16),
    ],
    localRotation: base.localRotation,
  };
}

function getBrakeLightTransform(
  vehicle: HomeDriveTrafficVehicle,
  sideSign: -1 | 1,
): VehiclePartTransform {
  const base = getLightTransform(vehicle, -1, sideSign);
  const [baseX, baseY, baseZ] = base.offset;
  const [baseScaleX, baseScaleY, baseScaleZ] = base.scale;
  const brakeScale = 0.92 + Math.min(0.52, vehicle.brakeLightIntensity * 0.52);

  return {
    offset: [
      baseX,
      baseY + vehicle.heightMeters * 0.012,
      baseZ - vehicle.lengthMeters * 0.008,
    ],
    scale: [
      baseScaleX * brakeScale,
      baseScaleY * brakeScale,
      Math.max(0.028, baseScaleZ * 1.25),
    ],
    localRotation: base.localRotation,
  };
}

function getVehiclePartTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  if (
    part === "twoWheelFrontWheel" ||
    part === "twoWheelRearWheel" ||
    part === "twoWheelFrontRim" ||
    part === "twoWheelRearRim"
  ) {
    return getTwoWheelWheelTransform(
      vehicle,
      part,
      part === "twoWheelFrontRim" || part === "twoWheelRearRim",
    );
  }

  if (
    part === "twoWheelFrame" ||
    part === "twoWheelFork" ||
    part === "twoWheelHandlebar" ||
    part === "twoWheelSeat" ||
    part === "bicyclePedalBar"
  ) {
    return getTwoWheelFrameTransform(vehicle, part);
  }

  if (
    part === "motorcycleFuelTank" ||
    part === "motorcycleRearFender" ||
    part === "motorcycleExhaust" ||
    part === "motorcycleHeadlight"
  ) {
    return getMotorcycleAccessoryTransform(vehicle, part);
  }

  if (
    part === "riderTorso" ||
    part === "riderHead" ||
    part === "riderHelmet" ||
    part === "riderLeftArm" ||
    part === "riderRightArm" ||
    part === "riderLeftLeg" ||
    part === "riderRightLeg"
  ) {
    return getRiderTransform(vehicle, part);
  }

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

  if (part === "frontGrille") {
    return getFrontGrilleTransform(vehicle);
  }

  if (part === "lowerFrontLip") {
    return getLowerFrontLipTransform(vehicle);
  }

  if (part === "sportFrontSplitter") {
    return getSportFrontSplitterTransform(vehicle);
  }

  if (part === "suvBullBarLeft") {
    return getBullBarTransform(vehicle, -1);
  }

  if (part === "suvBullBarRight") {
    return getBullBarTransform(vehicle, 1);
  }

  if (part === "hoodScoop") {
    return getHoodScoopTransform(vehicle);
  }

  if (part === "frontLeftIndicator") {
    return getIndicatorTransform(vehicle, 1, -1);
  }

  if (part === "frontRightIndicator") {
    return getIndicatorTransform(vehicle, 1, 1);
  }

  if (part === "rearLeftIndicator") {
    return getIndicatorTransform(vehicle, -1, -1);
  }

  if (part === "rearRightIndicator") {
    return getIndicatorTransform(vehicle, -1, 1);
  }

  if (part === "rearBrakeLightLeft") {
    return getBrakeLightTransform(vehicle, -1);
  }

  if (part === "rearBrakeLightRight") {
    return getBrakeLightTransform(vehicle, 1);
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

  if (
    part === "taxiSign" ||
    part === "policeLightBarLeft" ||
    part === "policeLightBarRight" ||
    part === "microbusRoofBand"
  ) {
    return getRoofAccessoryTransform(vehicle, part);
  }

  if (part === "deliveryCargoBox" || part === "truckCargoBox") {
    return getCargoBoxTransform(vehicle, part);
  }

  return getWheelTransform(vehicle, part, false);
}

function getTrafficPartUpdateStride(_part: TrafficPart): number {
  /*
    Luzes, freios, indicadores, vidros e acessórios são instâncias separadas.
    Quando esses detalhes atualizavam a cada 2/3 frames, eles ficavam com
    matriz antiga enquanto o corpo já tinha avançado/rotacionado. Com a
    redução de 50% do pool, é mais barato e visualmente correto manter todas
    as partes rígidas sincronizadas a cada frame.
  */
  return 1;
}

function isBodyTierTrafficPart(part: TrafficPart): boolean {
  return (
    part === "body" ||
    part === "hood" ||
    part === "trunk" ||
    part === "cabinFrame" ||
    part === "frontLeftWheel" ||
    part === "frontRightWheel" ||
    part === "rearLeftWheel" ||
    part === "rearRightWheel" ||
    part === "twoWheelFrame" ||
    part === "twoWheelFrontWheel" ||
    part === "twoWheelRearWheel" ||
    part === "riderTorso" ||
    part === "riderHead"
  );
}

function isCoreTierTrafficPart(part: TrafficPart): boolean {
  if (isBodyTierTrafficPart(part)) {
    return true;
  }

  return (
    part === "windshield" ||
    part === "rearGlass" ||
    part === "frontBumper" ||
    part === "rearBumper" ||
    part === "frontLeftHeadlight" ||
    part === "frontRightHeadlight" ||
    part === "rearLeftTailLight" ||
    part === "rearRightTailLight" ||
    part === "rearBrakeLightLeft" ||
    part === "rearBrakeLightRight" ||
    part === "frontGrille" ||
    part === "taxiSign" ||
    part === "policeLightBarLeft" ||
    part === "policeLightBarRight" ||
    part === "deliveryCargoBox" ||
    part === "truckCargoBox" ||
    part === "twoWheelFork" ||
    part === "twoWheelHandlebar" ||
    part === "twoWheelSeat" ||
    part === "motorcycleFuelTank" ||
    part === "motorcycleHeadlight"
  );
}

function shouldRenderTrafficPartForTier(
  part: TrafficPart,
  tier: HomeDriveTrafficRenderTier,
): boolean {
  switch (tier) {
    case "full":
      return true;

    case "core":
      return isCoreTierTrafficPart(part);

    case "body":
      return isBodyTierTrafficPart(part);

    case "hidden":
    default:
      return false;
  }
}

function setVehiclePartMatrix(
  dummy: Object3D,
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  elapsedSeconds: number,
): void {
  if (!shouldRenderTrafficPart(vehicle, part, elapsedSeconds)) {
    hideTrafficPartMatrix(dummy);
    return;
  }

  const transform = getVehiclePartTransform(vehicle, part);
  const [localX, localY, localZ] = transform.offset;
  const [scaleX, scaleY, scaleZ] = transform.scale;
  const [localRotX, localRotY, localRotZ] = transform.localRotation;

  const renderHeadingRad = vehicle.headingRad + vehicle.visualYawOffsetRad;
  const renderRollRad = vehicle.visualRollRad + vehicle.damage * 0.08;

  TRAFFIC_BODY_EULER.set(
    vehicle.visualPitchRad,
    renderHeadingRad,
    renderRollRad,
  );
  TRAFFIC_BODY_QUATERNION.setFromEuler(TRAFFIC_BODY_EULER);
  TRAFFIC_PART_LOCAL_OFFSET
    .set(localX, localY, localZ)
    .applyQuaternion(TRAFFIC_BODY_QUATERNION);

  dummy.position.set(
    vehicle.position.x + TRAFFIC_PART_LOCAL_OFFSET.x,
    TRAFFIC_PART_LOCAL_OFFSET.y,
    vehicle.position.z + TRAFFIC_PART_LOCAL_OFFSET.z,
  );

  dummy.rotation.set(
    vehicle.visualPitchRad + localRotX,
    renderHeadingRad + localRotY,
    renderRollRad + localRotZ,
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
  renderTiersRef,
  packVisibleInstances,
}: Readonly<{
  trafficRef: HomeDriveTrafficRef;
  batch: TrafficBatch;
  geometry: BufferGeometry;
  part: TrafficPart;
  material: Material;
  renderOrder: number;
  renderTiersRef: HomeDriveTrafficRenderTiersRef;
  packVisibleInstances: boolean;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const frameIndexRef = useRef(0);
  const updateStride = getTrafficPartUpdateStride(part);

  const syncInstances = () => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const traffic = trafficRef.current;
    const vehicles = traffic.vehicles;
    const elapsedSeconds = traffic.elapsedSeconds;
    const renderTiers = renderTiersRef.current;
    let packedInstanceIndex = 0;

    batch.indexes.forEach((vehicleIndex, legacyInstanceIndex) => {
      const vehicle = vehicles[vehicleIndex];
      const tier = renderTiers[vehicleIndex] ?? "full";

      if (!vehicle || !shouldRenderTrafficPartForTier(part, tier)) {
        if (!packVisibleInstances) {
          hideTrafficPartMatrix(dummy);
          mesh.setMatrixAt(legacyInstanceIndex, dummy.matrix);
        }

        return;
      }

      setVehiclePartMatrix(dummy, vehicle, part, elapsedSeconds);
      mesh.setMatrixAt(
        packVisibleInstances ? packedInstanceIndex : legacyInstanceIndex,
        dummy.matrix,
      );
      packedInstanceIndex += 1;
    });

    mesh.count = packVisibleInstances ? packedInstanceIndex : batch.indexes.length;
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }

    syncInstances();
  }, [batch.indexes, dummy, part]);

  useFrame(() => {
    frameIndexRef.current += 1;

    if (updateStride > 1 && frameIndexRef.current % updateStride !== 0) {
      return;
    }

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

function HomeDriveThreeTraffic({
  trafficRef,
  runtimeRef,
  isPortrait,
}: HomeDriveThreeTrafficProps) {
  const vehicles = trafficRef.current.vehicles;
  const trafficPerformance = useMemo(
    () => getHomeDriveTrafficPerformanceProfile(isPortrait),
    [isPortrait],
  );
  const renderTiersRef = useRef<readonly HomeDriveTrafficRenderTier[]>([]);
  const visibilityAccumulatorRef = useRef(0);

  const syncVisibilityMask = () => {
    const runtime = runtimeRef.current;
    const traffic = trafficRef.current;
    const tiers: HomeDriveTrafficRenderTier[] = traffic.vehicles.map(() => "hidden");
    const candidates = traffic.vehicles
      .map((vehicle, index) => {
        const tier = getHomeDriveTrafficRenderTier(
          vehicle,
          runtime.car.position,
          runtime.car.headingRad,
          runtime.car.speedMps,
          trafficPerformance,
        );

        if (tier === "hidden") {
          return null;
        }

        const relation = getHomeDriveTrafficSpatialRelation(
          vehicle.position,
          runtime.car.position,
          runtime.car.headingRad,
        );
        const tierWeight =
          tier === "full" ? -900 : tier === "core" ? -420 : -120;
        const forwardPenalty = relation.forwardMeters < 0
          ? Math.abs(relation.forwardMeters) * 2.2
          : relation.forwardMeters * 0.16;

        return {
          index,
          tier,
          score: tierWeight + relation.distanceMeters + relation.lateralAbsMeters * 0.65 + forwardPenalty,
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
      .sort((first, second) => first.score - second.score)
      .slice(0, trafficPerformance.renderMaxVisibleVehicles);

    candidates.forEach((candidate) => {
      tiers[candidate.index] = candidate.tier;
    });

    renderTiersRef.current = tiers;
  };

  useLayoutEffect(() => {
    syncVisibilityMask();
  }, [trafficPerformance]);

  useFrame((_, deltaSeconds) => {
    visibilityAccumulatorRef.current += deltaSeconds;

    if (visibilityAccumulatorRef.current < 1 / trafficPerformance.renderMaskHz) {
      return;
    }

    visibilityAccumulatorRef.current = 0;
    syncVisibilityMask();
  });

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
  const sphereGeometry = useMemo(() => new SphereGeometry(1, 14, 10), []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      wheelGeometry.dispose();
      sphereGeometry.dispose();
    };
  }, [boxGeometry, sphereGeometry, wheelGeometry]);

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
              renderTiersRef={renderTiersRef}
              packVisibleInstances={trafficPerformance.packVisibleInstancesEnabled}
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
            config.geometryKind === "wheel"
              ? wheelGeometry
              : config.geometryKind === "sphere"
                ? sphereGeometry
                : boxGeometry
          }
          part={config.part}
          material={config.material}
          renderOrder={config.renderOrder}
          renderTiersRef={renderTiersRef}
          packVisibleInstances={trafficPerformance.packVisibleInstancesEnabled}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeTraffic);
