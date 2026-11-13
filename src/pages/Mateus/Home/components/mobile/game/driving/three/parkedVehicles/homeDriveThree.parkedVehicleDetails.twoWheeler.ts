// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.twoWheeler.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	type HomeDriveThreeParkedVehicleDetailPart,
	type VehicleDetailProfile,
	getPaintMaterialKey,
	createPart,
} from "./homeDriveThree.parkedVehicleDetails.profile";

export function pushTwoWheelerParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const wheelRadius = vehicle.heightMeters * (profile.isBicycle ? 0.22 : 0.2);
  const wheelWidth = vehicle.widthMeters * (profile.isBicycle ? 0.045 : 0.09);
  const frontZ = vehicle.lengthMeters * 0.34;
  const rearZ = -vehicle.lengthMeters * 0.32;
  const wheelY = wheelRadius + 0.02;

  const paintMaterialKey = getPaintMaterialKey(vehicle, 311);
  const accentMaterialKey = profile.isBicycle
    ? "chrome-trim"
    : getPaintMaterialKey(vehicle, 313, "dark");

  for (const z of [rearZ, frontZ] as const) {
    parts.push(
      createPart(
        vehicle,
        "wheel",
        "wheel",
        "rubber",
        [0, wheelY, z],
        [wheelRadius, wheelWidth, wheelRadius],
        [Math.PI / 2, 0, 0],
        3,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "cylinder",
        "wheel-hub",
        [0, wheelY, z],
        [wheelRadius * 0.42, wheelWidth * 0.7, wheelRadius * 0.42],
        [Math.PI / 2, 0, 0],
        4,
      ),
    );
  }

  parts.push(
    createPart(
      vehicle,
      "body",
      "box",
      accentMaterialKey,
      [0, vehicle.heightMeters * 0.28, 0],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.14, vehicle.lengthMeters * 0.44],
      [0, 0, 0],
      1,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "chrome-trim",
      "box",
      accentMaterialKey,
      [0, vehicle.heightMeters * 0.46, vehicle.lengthMeters * 0.02],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.18, vehicle.lengthMeters * 0.12],
      [profile.isBicycle ? 0.46 : 0.22, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "handle",
      "box",
      "chrome-trim",
      [0, vehicle.heightMeters * 0.56, frontZ - vehicle.lengthMeters * 0.06],
      [vehicle.widthMeters * (profile.isBicycle ? 0.56 : 0.44), vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.035],
      [0, 0, 0],
      5,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "cabin",
      "box",
      paintMaterialKey,
      [0, vehicle.heightMeters * (profile.isBicycle ? 0.38 : 0.44), vehicle.lengthMeters * 0.02],
      [vehicle.widthMeters * (profile.isBicycle ? 0.14 : 0.28), vehicle.heightMeters * (profile.isBicycle ? 0.1 : 0.15), vehicle.lengthMeters * (profile.isBicycle ? 0.16 : 0.18)],
      [0, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "headlight",
      "box",
      profile.isBicycle ? "chrome-trim" : "headlight",
      [0, vehicle.heightMeters * 0.44, frontZ + vehicle.lengthMeters * 0.025],
      [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.08, vehicle.lengthMeters * 0.03],
      [0, 0, 0],
      6,
    ),
  );

  if (profile.isMotorcycle) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        getPaintMaterialKey(vehicle, 317, "matte"),
        [0, vehicle.heightMeters * 0.32, rearZ + vehicle.lengthMeters * 0.12],
        [vehicle.widthMeters * 0.22, vehicle.heightMeters * 0.12, vehicle.lengthMeters * 0.22],
        [0, 0, 0],
        2,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        "chrome-trim",
        [vehicle.widthMeters * 0.12, vehicle.heightMeters * 0.22, rearZ + vehicle.lengthMeters * 0.02],
        [vehicle.widthMeters * 0.06, vehicle.heightMeters * 0.05, vehicle.lengthMeters * 0.22],
        [0, 0, 0],
        4,
      ),
    );
  }

  if (profile.isBicycle) {
    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        accentMaterialKey,
        [0, vehicle.heightMeters * 0.42, rearZ * 0.18],
        [vehicle.widthMeters * 0.08, vehicle.heightMeters * 0.16, vehicle.lengthMeters * 0.38],
        [0.84, 0, 0],
        2,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        accentMaterialKey,
        [0, vehicle.heightMeters * 0.32, frontZ * 0.14],
        [vehicle.widthMeters * 0.08, vehicle.heightMeters * 0.16, vehicle.lengthMeters * 0.34],
        [-0.62, 0, 0],
        2,
      ),
    );
  }
}
