// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficPartVisibility.ts
// Regras de visibilidade das peças (setas, freio, nível).

import { Object3D } from "three";
import type {
  HomeDriveTrafficRenderTier,
} from "../../domain/homeDrive.trafficPerformance";
import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart } from "./trafficTypes";
import {
  isBicycleVehicle,
  isTwoWheelTrafficPart,
  isTwoWheelVehicle,
} from "./trafficVehicleShape";

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

export function shouldRenderTrafficPart(
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

export function hideTrafficPartMatrix(dummy: Object3D): void {
  dummy.position.set(0, -9999, 0);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(0.0001, 0.0001, 0.0001);
  dummy.updateMatrix();
}

export function getTrafficPartUpdateStride(_part: TrafficPart): number {
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

export function shouldRenderTrafficPartForTier(
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
