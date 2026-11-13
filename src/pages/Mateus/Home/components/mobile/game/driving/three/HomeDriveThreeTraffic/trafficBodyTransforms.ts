// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficBodyTransforms.ts
// Transformações da carroceria, vidros, para-choques e rodas.

import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart, VehiclePartTransform } from "./trafficTypes";
import {
  getVehicleShapeProfile,
  getWheelRadiusMeters,
  getWheelWidthMeters,
  isFrontWheelPart,
  isLeftSidePart,
  isRearWheelPart,
} from "./trafficVehicleShape";

export function getBodyTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getHoodTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getTrunkTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getCabinTransform(vehicle: HomeDriveTrafficVehicle): VehiclePartTransform {
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

export function getWindshieldTransform(
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

export function getRearGlassTransform(
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

export function getSideGlassTransform(
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

export function getBumperTransform(
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

export function getLightTransform(
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

export function getMirrorTransform(
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

export function getWheelTransform(
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
