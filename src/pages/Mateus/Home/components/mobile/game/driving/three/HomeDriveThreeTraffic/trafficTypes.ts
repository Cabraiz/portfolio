// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficTypes.ts
// Tipos do tráfego 3D (props, lotes e peças).

import type { Material } from "three";
import type {
  HomeDriveTrafficRenderTier,
} from "../../domain/homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficRuntimeState,
} from "../../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";

export type HomeDriveTrafficRef = {
  current: HomeDriveTrafficRuntimeState;
};

type HomeDriveRuntimeRef = {
  current: HomeDriveRuntimeState;
};

export type HomeDriveTrafficRenderTiersRef = {
  current: readonly HomeDriveTrafficRenderTier[];
};

export type HomeDriveThreeTrafficProps = Readonly<{
  trafficRef: HomeDriveTrafficRef;
  runtimeRef: HomeDriveRuntimeRef;
  isPortrait: boolean;
}>;

export type TrafficBatch = Readonly<{
  id: string;
  indexes: readonly number[];
  material: Material;
}>;

type TrafficGeometryKind = "box" | "wheel" | "sphere";

export type TrafficPart =
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

export type VehiclePartTransform = Readonly<{
  offset: readonly [number, number, number];
  scale: readonly [number, number, number];
  localRotation: readonly [number, number, number];
}>;

export type VehicleShapeProfile = Readonly<{
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

export type SharedPartConfig = Readonly<{
  part: TrafficPart;
  geometryKind: TrafficGeometryKind;
  material: Material;
  renderOrder: number;
}>;
