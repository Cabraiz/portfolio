// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.trim.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	type HomeDriveThreeParkedVehicleDetailPart,
	type VehicleDetailProfile,
	createPart,
} from "./homeDriveThree.parkedVehicleDetails.profile";

export function pushWheelParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const wheelRadius = vehicle.heightMeters * profile.wheelRadiusRatio;
  const wheelWidth = vehicle.widthMeters * profile.wheelWidthRatio;
  const wheelX = vehicle.widthMeters * profile.wheelXRatio;
  const frontWheelZ = vehicle.lengthMeters * profile.frontWheelZRatio;
  const rearWheelZ = vehicle.lengthMeters * profile.rearWheelZRatio;
  const wheelY = wheelRadius + 0.02;

  const wheelScale: readonly [number, number, number] = [
    wheelRadius,
    wheelWidth,
    wheelRadius,
  ];

  const wheelRotation: readonly [number, number, number] = [Math.PI / 2, 0, 0];

  for (const side of [-1, 1] as const) {
    for (const longitudinal of [-1, 1] as const) {
      const z = longitudinal > 0 ? frontWheelZ : -rearWheelZ;
      parts.push(
        createPart(
          vehicle,
          "wheel",
          "wheel",
          "rubber",
          [side * wheelX, wheelY, z],
          wheelScale,
          wheelRotation,
          3,
        ),
      );

      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "cylinder",
          profile.isTruck || profile.isBus ? "chrome-trim" : "wheel-hub",
          [side * (wheelX + 0.01 * side), wheelY, z],
          [wheelRadius * 0.52, wheelWidth * 0.18, wheelRadius * 0.52],
          wheelRotation,
          4,
        ),
      );
    }
  }
}

export function pushLightsAndPlates(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const frontZ = vehicle.lengthMeters * 0.505;
  const rearZ = -vehicle.lengthMeters * 0.505;
  const lightY = vehicle.heightMeters * (profile.isBus ? 0.42 : 0.34);
  const lightX = vehicle.widthMeters * (profile.isBus ? 0.36 : 0.31);

  for (const side of [-1, 1] as const) {
    parts.push(
      createPart(
        vehicle,
        "headlight",
        "box",
        "headlight",
        [side * lightX, lightY, frontZ],
        [vehicle.widthMeters * (profile.isBus ? 0.1 : 0.14), vehicle.heightMeters * 0.07, 0.035],
        [0, 0, 0],
        5,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "tail-light",
        "box",
        "tail-light",
        [side * lightX, lightY, rearZ],
        [vehicle.widthMeters * (profile.isBus ? 0.09 : 0.12), vehicle.heightMeters * 0.075, 0.035],
        [0, 0, 0],
        5,
      ),
    );
  }

  if (!profile.isTwoWheeler) {
    parts.push(
      createPart(
        vehicle,
        "license-plate",
        "box",
        "license-plate",
        [0, vehicle.heightMeters * 0.24, frontZ + 0.012],
        [vehicle.widthMeters * 0.24, vehicle.heightMeters * 0.065, 0.018],
        [0, 0, 0],
        6,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "license-plate",
        "box",
        "license-plate",
        [0, vehicle.heightMeters * 0.24, rearZ - 0.012],
        [vehicle.widthMeters * 0.24, vehicle.heightMeters * 0.065, 0.018],
        [0, 0, 0],
        6,
      ),
    );
  }
}

export function pushMirrorsHandlesAndTrim(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const mirrorY = vehicle.heightMeters * (profile.isVan || profile.isBus ? 0.7 : 0.64);
  const mirrorZ = vehicle.lengthMeters * (profile.isTruck ? 0.18 : 0.08);
  const mirrorX = vehicle.widthMeters * (profile.isBus ? 0.52 : 0.56);

  for (const side of [-1, 1] as const) {
    parts.push(
      createPart(
        vehicle,
        "mirror",
        "box",
        "mirror",
        [side * mirrorX, mirrorY, mirrorZ],
        [vehicle.widthMeters * 0.07, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.045],
        [0, 0, side * 0.08],
        7,
      ),
    );

    if (!profile.isBus && !profile.isTruck) {
      for (const z of [-0.18, 0.18] as const) {
        parts.push(
          createPart(
            vehicle,
            "handle",
            "box",
            "handle",
            [side * vehicle.widthMeters * 0.512, vehicle.heightMeters * 0.43, vehicle.lengthMeters * z],
            [vehicle.widthMeters * 0.035, vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.075],
            [0, 0, 0],
            7,
          ),
        );
      }

      parts.push(
        createPart(
          vehicle,
          "door-line",
          "box",
          "door-line",
          [side * vehicle.widthMeters * 0.506, vehicle.heightMeters * 0.44, 0],
          [vehicle.widthMeters * 0.012, vehicle.heightMeters * 0.36, 0.018],
          [0, 0, 0],
          6,
        ),
      );
    }
  }

  if (profile.hasChromeTrim) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          "chrome-trim",
          [side * vehicle.widthMeters * 0.514, vehicle.heightMeters * 0.5, 0],
          [vehicle.widthMeters * 0.015, vehicle.heightMeters * 0.025, vehicle.lengthMeters * 0.62],
          [0, 0, 0],
          8,
        ),
      );
    }
  }

  if (profile.hasBullBar) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          "chrome-trim",
          [side * vehicle.widthMeters * 0.22, vehicle.heightMeters * 0.24, vehicle.lengthMeters * 0.52],
          [vehicle.widthMeters * 0.03, vehicle.heightMeters * 0.18, vehicle.lengthMeters * 0.02],
          [0, 0, 0],
          8,
        ),
      );
    }
  }
}
