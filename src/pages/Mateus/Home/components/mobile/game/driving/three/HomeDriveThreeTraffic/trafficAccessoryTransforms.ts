// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficAccessoryTransforms.ts
// Transformações de acessórios (teto, carga, frente) e roda de duas rodas.

import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart, VehiclePartTransform } from "./trafficTypes";
import {
  getVehicleShapeProfile,
  getWheelRadiusMeters,
  getWheelWidthMeters,
} from "./trafficVehicleShape";

export function getRoofAccessoryTransform(
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

export function getCargoBoxTransform(
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

export function getFrontGrilleTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getLowerFrontLipTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getSportFrontSplitterTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getBullBarTransform(
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

export function getHoodScoopTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getTwoWheelWheelTransform(
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
