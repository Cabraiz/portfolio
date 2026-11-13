// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficTwoWheelTransforms.ts
// Transformações de moto, bicicleta, piloto, setas e freio.

import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart, VehiclePartTransform } from "./trafficTypes";
import { getWheelRadiusMeters, isBicycleVehicle } from "./trafficVehicleShape";
import { getLightTransform } from "./trafficBodyTransforms";

export function getTwoWheelFrameTransform(
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

export function getMotorcycleAccessoryTransform(
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

export function getRiderTransform(
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

export function getIndicatorTransform(
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

export function getBrakeLightTransform(
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
