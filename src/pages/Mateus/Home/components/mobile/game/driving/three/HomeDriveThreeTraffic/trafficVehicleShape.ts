// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficVehicleShape.ts
// Perfil de forma de cada veículo e dados de roda.

import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart, VehicleShapeProfile } from "./trafficTypes";

export function isTwoWheelVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "motorcycle" || vehicle.kind === "bicycle";
}

function isMotorcycleVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "motorcycle";
}

export function isBicycleVehicle(vehicle: HomeDriveTrafficVehicle): boolean {
  return vehicle.kind === "bicycle";
}

export function isTwoWheelTrafficPart(part: TrafficPart): boolean {
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

export function getVehicleShapeProfile(
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

export function getWheelRadiusMeters(vehicle: HomeDriveTrafficVehicle): number {
  const profile = getVehicleShapeProfile(vehicle);

  return Math.max(
    0.34,
    Math.min(0.68, vehicle.heightMeters * profile.wheelRadiusFactor),
  );
}

export function getWheelWidthMeters(vehicle: HomeDriveTrafficVehicle): number {
  const profile = getVehicleShapeProfile(vehicle);

  if (isBicycleVehicle(vehicle)) {
    return Math.max(0.045, Math.min(0.08, vehicle.widthMeters * profile.wheelWidthFactor));
  }

  if (isMotorcycleVehicle(vehicle)) {
    return Math.max(0.08, Math.min(0.16, vehicle.widthMeters * profile.wheelWidthFactor));
  }

  return Math.max(0.28, vehicle.widthMeters * profile.wheelWidthFactor);
}

export function isLeftSidePart(part: TrafficPart): boolean {
  return part.includes("Left") || part.startsWith("left");
}

export function isFrontWheelPart(part: TrafficPart): boolean {
  return part.startsWith("front");
}

export function isRearWheelPart(part: TrafficPart): boolean {
  return part.startsWith("rear");
}
