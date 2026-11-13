// src/pages/Mateus/Home/components/mobile/game/driving/three/parkedVehicles/homeDriveThree.parkedVehicleDetails.damage.ts

import type { HomeDriveParkedVehicle } from "../../domain/parkedVehicles";
import {
	type HomeDriveThreeParkedVehicleDetailPart,
	clamp,
	getDamage,
	getDamageSide,
	getDamageLocalZ,
	createPart,
} from "./homeDriveThree.parkedVehicleDetails.profile";

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getPartDamageInfluence(
  vehicle: HomeDriveParkedVehicle,
  part: HomeDriveThreeParkedVehicleDetailPart,
): number {
  const damage = getDamage(vehicle);

  if (damage <= 0.03) {
    return 0;
  }

  const side = getDamageSide(vehicle);
  const damageZ = getDamageLocalZ(vehicle);
  const [localX, , localZ] = part.localPosition;
  const xSign = Math.sign(localX) || side;
  const sideProximity = xSign === side
    ? 1
    : Math.abs(localX) <= vehicle.widthMeters * 0.12
      ? 0.28
      : 0;

  if (sideProximity <= 0) {
    return 0;
  }

  const longitudinalSpan = vehicle.lengthMeters * clamp(0.18 + damage * 0.24, 0.18, 0.42);
  const longitudinalProximity = clamp01(
    1 - Math.abs(localZ - damageZ) / Math.max(0.0001, longitudinalSpan),
  );
  const sameEnd =
    Math.sign(localZ || damageZ || 0) === Math.sign(damageZ || 0) &&
    Math.abs(localZ) >= vehicle.lengthMeters * 0.26;

  const nearCenterLine = Math.abs(localX) <= vehicle.widthMeters * 0.18;

  let partWeight = 0.58;

  switch (part.partKind) {
    case "body":
    case "cabin":
    case "cargo-box":
      partWeight = 1;
      break;

    case "glass":
      partWeight = 0.82;
      break;

    case "mirror":
    case "handle":
    case "door-line":
    case "chrome-trim":
    case "roof-rack":
      partWeight = 0.92;
      break;

    case "headlight":
    case "tail-light":
    case "license-plate":
    case "bumper":
      partWeight = sameEnd ? 0.94 : 0.16;
      break;

    case "wheel":
      partWeight = sameEnd ? 0.34 : 0.12;
      break;

    case "damage-panel":
      partWeight = 0;
      break;

    default:
      partWeight = nearCenterLine ? 0.44 : 0.7;
      break;
  }

  if (partWeight <= 0) {
    return 0;
  }

  const zoneWeight = sameEnd
    ? Math.max(longitudinalProximity, 0.66)
    : longitudinalProximity * 0.92 + (nearCenterLine ? longitudinalProximity * 0.16 : 0);

  return clamp01(damage * sideProximity * partWeight * zoneWeight);
}

export function applyDamageToPart(
  vehicle: HomeDriveParkedVehicle,
  part: HomeDriveThreeParkedVehicleDetailPart,
): HomeDriveThreeParkedVehicleDetailPart {
  const damage = getDamage(vehicle);
  const influence = getPartDamageInfluence(vehicle, part);

  if (damage <= 0.03 || influence <= 0.001) {
    return part;
  }

  const side = getDamageSide(vehicle);
  const damageZ = getDamageLocalZ(vehicle);
  let [x, y, z] = part.localPosition;
  let [sx, sy, sz] = part.localScale;
  let [rx, ry, rz] = part.localRotation;

  const crushDepth = vehicle.widthMeters * (0.055 + damage * 0.14) * influence;
  const verticalSink = vehicle.heightMeters * (0.018 + damage * 0.05) * influence;
  const shearTowardImpact = (damageZ - z) * 0.14 * influence;
  const sameEndSign = Math.sign(z || damageZ || 0) === Math.sign(damageZ || 0) ? 1 : 0;
  const endCrush = sameEndSign * damage * influence;

  x -= side * crushDepth;
  y -= verticalSink;
  z += shearTowardImpact;

  rz += side * damage * 0.26 * influence;
  ry += side * damage * 0.1 * influence;
  rx += damage * 0.04 * influence;

  sx *= clamp(1 - influence * 0.22, 0.62, 1.05);
  sy *= clamp(1 - influence * 0.08, 0.72, 1.06);
  sz *= clamp(1 - influence * 0.1, 0.66, 1.06);

  switch (part.partKind) {
    case "body":
    case "cabin":
    case "cargo-box":
      x -= side * vehicle.widthMeters * 0.03 * influence;
      sx *= clamp(1 - influence * 0.14, 0.58, 1.04);
      sz *= clamp(1 - influence * 0.08, 0.72, 1.02);
      break;

    case "glass":
      x -= side * vehicle.widthMeters * 0.022 * influence;
      y -= vehicle.heightMeters * 0.012 * influence;
      ry += side * damage * 0.08 * influence;
      sy *= clamp(1 - influence * 0.12, 0.62, 1);
      break;

    case "mirror":
      x -= side * vehicle.widthMeters * 0.05 * influence;
      y -= vehicle.heightMeters * 0.04 * influence;
      z += shearTowardImpact * 0.85;
      rz += side * (0.18 + damage * 0.22) * influence;
      ry += side * (0.12 + damage * 0.14) * influence;
      sx *= clamp(1 - influence * 0.3, 0.42, 1);
      sy *= clamp(1 - influence * 0.28, 0.38, 1);
      sz *= clamp(1 - influence * 0.34, 0.44, 1);
      break;

    case "handle":
    case "door-line":
    case "chrome-trim":
    case "roof-rack":
      x -= side * vehicle.widthMeters * 0.025 * influence;
      y -= vehicle.heightMeters * 0.014 * influence;
      z += shearTowardImpact * 0.65;
      rz += side * damage * 0.1 * influence;
      sx *= clamp(1 - influence * 0.22, 0.5, 1);
      sy *= clamp(1 - influence * 0.2, 0.46, 1);
      break;

    case "headlight":
    case "tail-light":
    case "license-plate":
    case "bumper": {
      const endDirection = Math.sign(z || damageZ || 0) || Math.sign(damageZ || 1);
      x -= side * vehicle.widthMeters * 0.028 * endCrush;
      z -= endDirection * vehicle.lengthMeters * 0.045 * endCrush;
      y -= vehicle.heightMeters * 0.02 * endCrush;
      ry += side * damage * 0.16 * endCrush;
      rz += side * damage * 0.12 * endCrush;
      sx *= clamp(1 - endCrush * 0.18, 0.44, 1.02);
      sy *= clamp(1 - endCrush * 0.12, 0.5, 1.02);
      break;
    }

    case "wheel":
      x -= side * vehicle.widthMeters * 0.012 * endCrush;
      z -= Math.sign(z || 1) * vehicle.lengthMeters * 0.016 * endCrush;
      ry += side * damage * 0.04 * endCrush;
      break;

    default:
      break;
  }

  const nextLocalPosition: readonly [number, number, number] = [x, y, z];
  const nextLocalRotation: readonly [number, number, number] = [rx, ry, rz];
  const nextLocalScale: readonly [number, number, number] = [sx, sy, sz];

  return {
    ...part,
    localPosition: nextLocalPosition,
    localRotation: nextLocalRotation,
    localScale: nextLocalScale,
  };
}

export function pushDamageParts(
  parts: HomeDriveThreeParkedVehicleDetailPart[],
  vehicle: HomeDriveParkedVehicle,
): void {
  const damage = getDamage(vehicle);

  if (damage <= 0.03) {
    return;
  }

  const side = getDamageSide(vehicle);
  const z = getDamageLocalZ(vehicle);
  const dentWidth = vehicle.widthMeters * clamp(0.026 + damage * 0.018, 0.026, 0.052);
  const dentHeight = vehicle.heightMeters * clamp(0.16 + damage * 0.28, 0.16, 0.5);
  const dentLength = vehicle.lengthMeters * clamp(0.18 + damage * 0.26, 0.18, 0.46);
  const cavityWidth = vehicle.widthMeters * clamp(0.05 + damage * 0.05, 0.05, 0.1);
  const cavityHeight = vehicle.heightMeters * clamp(0.12 + damage * 0.14, 0.12, 0.26);
  const cavityLength = vehicle.lengthMeters * clamp(0.12 + damage * 0.18, 0.12, 0.28);
  const creaseWidth = vehicle.widthMeters * clamp(0.012 + damage * 0.012, 0.012, 0.026);
  const sameEndZ = z >= 0 ? vehicle.lengthMeters * 0.5 : -vehicle.lengthMeters * 0.5;

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "damage-panel",
      [
        side * vehicle.widthMeters * 0.522,
        vehicle.heightMeters * (0.34 + damage * 0.14),
        z,
      ],
      [dentWidth, dentHeight, dentLength],
      [0, 0, side * damage * 0.22],
      9,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "rubber",
      [
        side * vehicle.widthMeters * 0.492,
        vehicle.heightMeters * (0.34 + damage * 0.08),
        z,
      ],
      [cavityWidth, cavityHeight, cavityLength],
      [0, side * damage * 0.08, side * damage * 0.04],
      8,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "damage-panel",
      [
        side * vehicle.widthMeters * 0.532,
        vehicle.heightMeters * (0.27 + damage * 0.06),
        z - vehicle.lengthMeters * 0.11,
      ],
      [
        dentWidth * 0.78,
        vehicle.heightMeters * clamp(0.045 + damage * 0.05, 0.045, 0.105),
        dentLength * 0.82,
      ],
      [0, 0, -side * damage * 0.1],
      10,
    ),
  );

  parts.push(
    createPart(
      vehicle,
      "damage-panel",
      "box",
      "chrome-trim",
      [
        side * vehicle.widthMeters * 0.506,
        vehicle.heightMeters * (0.36 + damage * 0.08),
        z + vehicle.lengthMeters * 0.04,
      ],
      [creaseWidth, vehicle.heightMeters * 0.24, dentLength * 0.76],
      [0, side * damage * 0.1, side * damage * 0.16],
      10,
    ),
  );

  if (damage >= 0.28) {
    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "damage-panel",
        [
          side * vehicle.widthMeters * 0.44,
          vehicle.heightMeters * (0.54 + damage * 0.06),
          z,
        ],
        [vehicle.widthMeters * 0.028, vehicle.heightMeters * 0.18, dentLength * 0.58],
        [0, side * damage * 0.08, side * damage * 0.18],
        10,
      ),
    );
  }

  if (damage >= 0.42) {
    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "damage-panel",
        [
          side * vehicle.widthMeters * 0.22,
          vehicle.heightMeters * 0.22,
          sameEndZ * 1.02,
        ],
        [
          vehicle.widthMeters * clamp(0.26 + damage * 0.22, 0.26, 0.48),
          vehicle.heightMeters * 0.085,
          vehicle.lengthMeters * 0.038,
        ],
        [0, side * damage * 0.08, side * damage * 0.12],
        10,
      ),
    );

    parts.push(
      createPart(
        vehicle,
        "damage-panel",
        "box",
        "rubber",
        [
          side * vehicle.widthMeters * 0.16,
          vehicle.heightMeters * 0.18,
          sameEndZ * 0.98,
        ],
        [vehicle.widthMeters * 0.16, vehicle.heightMeters * 0.05, vehicle.lengthMeters * 0.024],
        [0, side * damage * 0.1, side * damage * 0.06],
        9,
      ),
    );
  }
}
