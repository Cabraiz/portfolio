// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.fourWheeler.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	type HomeDriveThreeParkedVehicleDetailPart,
	type VehicleDetailProfile,
	clamp,
	getPaintMaterialKey,
	createPart,
} from "./homeDriveThree.parkedVehicleDetails.profile";
import {
	pushWheelParts,
	pushLightsAndPlates,
	pushMirrorsHandlesAndTrim,
} from "./homeDriveThree.parkedVehicleDetails.trim";

export function pushFourWheelerBodyParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
  profile: VehicleDetailProfile,
): void {
  const bodyHeight = vehicle.heightMeters * profile.bodyHeightRatio;
  const bodyY = bodyHeight * 0.5 + 0.08;
  const lowerBodyPaint = getPaintMaterialKey(vehicle, 101);
  const upperBodyPaint = getPaintMaterialKey(vehicle, 103, profile.isTruck || profile.isBus ? "matte" : "dark");
  const cargoPaint = getPaintMaterialKey(vehicle, 107, "matte");

  const hoodLength = clamp(vehicle.lengthMeters * profile.hoodLengthRatio, 0.45, vehicle.lengthMeters * 0.34);
  const trunkLength = clamp(
    profile.isPickup ? vehicle.lengthMeters * profile.pickupBedLengthRatio : vehicle.lengthMeters * profile.trunkLengthRatio,
    profile.isPickup ? vehicle.lengthMeters * 0.18 : 0.34,
    vehicle.lengthMeters * (profile.isBus || profile.isTruck ? 0.14 : 0.28),
  );
  const lowerBodyLength = clamp(
    vehicle.lengthMeters * profile.lowerBodyLengthRatio,
    vehicle.lengthMeters * 0.58,
    vehicle.lengthMeters * 0.92,
  );

  const lowerBodyWidth = vehicle.widthMeters * (profile.isBus ? 0.98 : profile.isTruck ? 0.94 : 0.96);

  parts.push(
    createPart(
      vehicle,
      "body",
      "box",
      lowerBodyPaint,
      [0, bodyY, 0],
      [lowerBodyWidth, bodyHeight, lowerBodyLength],
      [0, 0, 0],
      1,
    ),
  );

  if (!profile.isBus && !profile.isTruck) {
    parts.push(
      createPart(
        vehicle,
        "body",
        "box",
        lowerBodyPaint,
        [0, bodyY + bodyHeight * 0.13, vehicle.lengthMeters * (0.5 - profile.hoodLengthRatio * 0.5)],
        [vehicle.widthMeters * 0.88, bodyHeight * profile.hoodHeightRatio, hoodLength],
        [0, 0, 0],
        1,
      ),
    );
  }

  if (profile.isPickup) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        cargoPaint,
        [0, bodyY + bodyHeight * 0.16, -vehicle.lengthMeters * 0.15],
        [vehicle.widthMeters * 0.84, vehicle.heightMeters * 0.28, vehicle.lengthMeters * profile.pickupBedLengthRatio],
        [0, 0, 0],
        2,
      ),
    );
  } else if (!profile.isBus) {
    parts.push(
      createPart(
        vehicle,
        "body",
        "box",
        lowerBodyPaint,
        [0, bodyY + bodyHeight * 0.12, -vehicle.lengthMeters * (0.5 - profile.trunkLengthRatio * 0.52)],
        [vehicle.widthMeters * (profile.isWagon ? 0.88 : 0.82), bodyHeight * profile.trunkHeightRatio, trunkLength],
        [0, 0, 0],
        1,
      ),
    );
  }

  parts.push(
    createPart(
      vehicle,
      "cabin",
      "box",
      upperBodyPaint,
      [0, bodyY + bodyHeight * 0.58, vehicle.lengthMeters * profile.cabinZRatio],
      [
        vehicle.widthMeters * profile.cabinWidthRatio,
        vehicle.heightMeters * profile.cabinHeightRatio,
        vehicle.lengthMeters * profile.cabinLengthRatio,
      ],
      [0, 0, 0],
      2,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "glass",
      "box",
      "glass",
      [0, bodyY + bodyHeight * 0.82, vehicle.lengthMeters * (profile.cabinZRatio + 0.01)],
      [
        vehicle.widthMeters * (profile.cabinWidthRatio * 0.9),
        vehicle.heightMeters * profile.glassHeightRatio,
        vehicle.lengthMeters * (profile.cabinLengthRatio * 0.82),
      ],
      [0, 0, 0],
      4,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "bumper",
      "box",
      profile.isPolice ? "chrome-trim" : "bumper",
      [0, vehicle.heightMeters * (profile.isBus ? 0.2 : 0.22), vehicle.lengthMeters * 0.525],
      [vehicle.widthMeters * 0.86, vehicle.heightMeters * 0.1, vehicle.lengthMeters * 0.045],
      [0, 0, 0],
      5,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "bumper",
      "box",
      "bumper",
      [0, vehicle.heightMeters * 0.22, -vehicle.lengthMeters * 0.525],
      [vehicle.widthMeters * 0.86, vehicle.heightMeters * 0.1, vehicle.lengthMeters * 0.045],
      [0, 0, 0],
      5,
    ),
  );

  if (profile.hasCargoBox && !profile.isPickup) {
    parts.push(
      createPart(
        vehicle,
        "cargo-box",
        "box",
        cargoPaint,
        [0, bodyY + bodyHeight * 0.44, -vehicle.lengthMeters * 0.1],
        [
          vehicle.widthMeters * (profile.isTruck ? 0.92 : 0.82),
          vehicle.heightMeters * (profile.isTruck ? 0.62 : 0.58),
          vehicle.lengthMeters * (profile.isTruck ? 0.54 : 0.48),
        ],
        [0, 0, 0],
        2,
      ),
    );
  }

  if (profile.hasTaxiSign) {
    parts.push(
      createPart(
        vehicle,
        "taxi-sign",
        "box",
        "taxi-sign",
        [0, vehicle.heightMeters * 1.02, vehicle.lengthMeters * 0.02],
        [vehicle.widthMeters * 0.34, vehicle.heightMeters * 0.075, vehicle.lengthMeters * 0.16],
        [0, 0, 0],
        10,
      ),
    );
  }

  if (profile.hasRoofRack && !profile.isBus && !profile.isTruck) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "roof-rack",
          "box",
          "rubber",
          [side * vehicle.widthMeters * 0.24, vehicle.heightMeters * 1.02, 0],
          [vehicle.widthMeters * 0.035, vehicle.heightMeters * 0.035, vehicle.lengthMeters * 0.46],
          [0, 0, 0],
          10,
        ),
      );
    }
  }

  if (profile.isEmergency) {
    parts.push(
      createPart(
        vehicle,
        "chrome-trim",
        "box",
        "tail-light",
        [0, vehicle.heightMeters * 0.96, 0],
        [vehicle.widthMeters * 0.58, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.1],
        [0, 0, 0],
        9,
      ),
    );
  }

  if (profile.isPolice) {
    for (const side of [-1, 1] as const) {
      parts.push(
        createPart(
          vehicle,
          "chrome-trim",
          "box",
          side < 0 ? "headlight" : "tail-light",
          [side * vehicle.widthMeters * 0.1, vehicle.heightMeters * 0.98, 0],
          [vehicle.widthMeters * 0.18, vehicle.heightMeters * 0.06, vehicle.lengthMeters * 0.08],
          [0, 0, 0],
          9,
        ),
      );
    }
  }

  pushWheelParts(parts, vehicle, profile);
  pushLightsAndPlates(parts, vehicle, profile);
  pushMirrorsHandlesAndTrim(parts, vehicle, profile);
}
