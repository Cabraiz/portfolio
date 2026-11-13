// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	type HomeDriveThreeParkedVehicleDetailPart,
	getDetailProfile,
} from "./homeDriveThree.parkedVehicleDetails.profile";
import {
	applyDamageToPart,
	pushDamageParts,
} from "./homeDriveThree.parkedVehicleDetails.damage";
import {
	pushTwoWheelerParts,
} from "./homeDriveThree.parkedVehicleDetails.twoWheeler";
import {
	pushFourWheelerBodyParts,
} from "./homeDriveThree.parkedVehicleDetails.fourWheeler";
export type {
	HomeDriveThreeParkedVehicleGeometryKind,
	HomeDriveThreeParkedVehiclePartKind,
	HomeDriveThreeParkedVehicleDetailPart,
} from "./homeDriveThree.parkedVehicleDetails.profile";

export function getHomeDriveThreeParkedVehicleDetailParts(
  vehicle: HomeDriveParkedVehicle,
): readonly HomeDriveThreeParkedVehicleDetailPart[] {
  const profile = getDetailProfile(vehicle);
  const parts: HomeDriveThreeParkedVehicleDetailPart[] = [];

  if (profile.isTwoWheeler) {
    pushTwoWheelerParts(parts, vehicle, profile);
    pushDamageParts(parts, vehicle);
    return parts.map((part) => applyDamageToPart(vehicle, part));
  }

  pushFourWheelerBodyParts(parts, vehicle, profile);
  pushDamageParts(parts, vehicle);

  return parts.map((part) => applyDamageToPart(vehicle, part));
}


