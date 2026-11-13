// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficPartTransform.ts
// Escolhe a transformação de cada peça e grava a matriz.

import { Euler, Object3D, Quaternion, Vector3 } from "three";
import type {
  HomeDriveTrafficVehicle,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficPart, VehiclePartTransform } from "./trafficTypes";
import {
  getBodyTransform,
  getBumperTransform,
  getCabinTransform,
  getHoodTransform,
  getLightTransform,
  getMirrorTransform,
  getRearGlassTransform,
  getSideGlassTransform,
  getTrunkTransform,
  getWheelTransform,
  getWindshieldTransform,
} from "./trafficBodyTransforms";
import {
  hideTrafficPartMatrix,
  shouldRenderTrafficPart,
} from "./trafficPartVisibility";
import {
  getBullBarTransform,
  getCargoBoxTransform,
  getFrontGrilleTransform,
  getHoodScoopTransform,
  getLowerFrontLipTransform,
  getRoofAccessoryTransform,
  getSportFrontSplitterTransform,
  getTwoWheelWheelTransform,
} from "./trafficAccessoryTransforms";
import {
  getBrakeLightTransform,
  getIndicatorTransform,
  getMotorcycleAccessoryTransform,
  getRiderTransform,
  getTwoWheelFrameTransform,
} from "./trafficTwoWheelTransforms";

const TRAFFIC_BODY_EULER = new Euler();
const TRAFFIC_BODY_QUATERNION = new Quaternion();
const TRAFFIC_PART_LOCAL_OFFSET = new Vector3();

function getVehiclePartTransform(
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
): VehiclePartTransform {
  if (
    part === "twoWheelFrontWheel" ||
    part === "twoWheelRearWheel" ||
    part === "twoWheelFrontRim" ||
    part === "twoWheelRearRim"
  ) {
    return getTwoWheelWheelTransform(
      vehicle,
      part,
      part === "twoWheelFrontRim" || part === "twoWheelRearRim",
    );
  }

  if (
    part === "twoWheelFrame" ||
    part === "twoWheelFork" ||
    part === "twoWheelHandlebar" ||
    part === "twoWheelSeat" ||
    part === "bicyclePedalBar"
  ) {
    return getTwoWheelFrameTransform(vehicle, part);
  }

  if (
    part === "motorcycleFuelTank" ||
    part === "motorcycleRearFender" ||
    part === "motorcycleExhaust" ||
    part === "motorcycleHeadlight"
  ) {
    return getMotorcycleAccessoryTransform(vehicle, part);
  }

  if (
    part === "riderTorso" ||
    part === "riderHead" ||
    part === "riderHelmet" ||
    part === "riderLeftArm" ||
    part === "riderRightArm" ||
    part === "riderLeftLeg" ||
    part === "riderRightLeg"
  ) {
    return getRiderTransform(vehicle, part);
  }

  if (part === "body") {
    return getBodyTransform(vehicle);
  }

  if (part === "hood") {
    return getHoodTransform(vehicle);
  }

  if (part === "trunk") {
    return getTrunkTransform(vehicle);
  }

  if (part === "cabinFrame") {
    return getCabinTransform(vehicle);
  }

  if (part === "windshield") {
    return getWindshieldTransform(vehicle);
  }

  if (part === "rearGlass") {
    return getRearGlassTransform(vehicle);
  }

  if (part === "leftSideGlass") {
    return getSideGlassTransform(vehicle, -1);
  }

  if (part === "rightSideGlass") {
    return getSideGlassTransform(vehicle, 1);
  }

  if (part === "frontBumper") {
    return getBumperTransform(vehicle, 1);
  }

  if (part === "rearBumper") {
    return getBumperTransform(vehicle, -1);
  }

  if (part === "frontGrille") {
    return getFrontGrilleTransform(vehicle);
  }

  if (part === "lowerFrontLip") {
    return getLowerFrontLipTransform(vehicle);
  }

  if (part === "sportFrontSplitter") {
    return getSportFrontSplitterTransform(vehicle);
  }

  if (part === "suvBullBarLeft") {
    return getBullBarTransform(vehicle, -1);
  }

  if (part === "suvBullBarRight") {
    return getBullBarTransform(vehicle, 1);
  }

  if (part === "hoodScoop") {
    return getHoodScoopTransform(vehicle);
  }

  if (part === "frontLeftIndicator") {
    return getIndicatorTransform(vehicle, 1, -1);
  }

  if (part === "frontRightIndicator") {
    return getIndicatorTransform(vehicle, 1, 1);
  }

  if (part === "rearLeftIndicator") {
    return getIndicatorTransform(vehicle, -1, -1);
  }

  if (part === "rearRightIndicator") {
    return getIndicatorTransform(vehicle, -1, 1);
  }

  if (part === "rearBrakeLightLeft") {
    return getBrakeLightTransform(vehicle, -1);
  }

  if (part === "rearBrakeLightRight") {
    return getBrakeLightTransform(vehicle, 1);
  }

  if (part === "frontLeftHeadlight") {
    return getLightTransform(vehicle, 1, -1);
  }

  if (part === "frontRightHeadlight") {
    return getLightTransform(vehicle, 1, 1);
  }

  if (part === "rearLeftTailLight") {
    return getLightTransform(vehicle, -1, -1);
  }

  if (part === "rearRightTailLight") {
    return getLightTransform(vehicle, -1, 1);
  }

  if (part === "leftMirror") {
    return getMirrorTransform(vehicle, -1);
  }

  if (part === "rightMirror") {
    return getMirrorTransform(vehicle, 1);
  }

  if (
    part === "frontLeftRim" ||
    part === "frontRightRim" ||
    part === "rearLeftRim" ||
    part === "rearRightRim"
  ) {
    return getWheelTransform(vehicle, part, true);
  }

  if (
    part === "taxiSign" ||
    part === "policeLightBarLeft" ||
    part === "policeLightBarRight" ||
    part === "microbusRoofBand"
  ) {
    return getRoofAccessoryTransform(vehicle, part);
  }

  if (part === "deliveryCargoBox" || part === "truckCargoBox") {
    return getCargoBoxTransform(vehicle, part);
  }

  return getWheelTransform(vehicle, part, false);
}

export function setVehiclePartMatrix(
  dummy: Object3D,
  vehicle: HomeDriveTrafficVehicle,
  part: TrafficPart,
  elapsedSeconds: number,
): void {
  if (!shouldRenderTrafficPart(vehicle, part, elapsedSeconds)) {
    hideTrafficPartMatrix(dummy);
    return;
  }

  const transform = getVehiclePartTransform(vehicle, part);
  const [localX, localY, localZ] = transform.offset;
  const [scaleX, scaleY, scaleZ] = transform.scale;
  const [localRotX, localRotY, localRotZ] = transform.localRotation;

  const renderHeadingRad = vehicle.headingRad + vehicle.visualYawOffsetRad;
  const renderRollRad = vehicle.visualRollRad + vehicle.damage * 0.08;

  TRAFFIC_BODY_EULER.set(
    vehicle.visualPitchRad,
    renderHeadingRad,
    renderRollRad,
  );
  TRAFFIC_BODY_QUATERNION.setFromEuler(TRAFFIC_BODY_EULER);
  TRAFFIC_PART_LOCAL_OFFSET
    .set(localX, localY, localZ)
    .applyQuaternion(TRAFFIC_BODY_QUATERNION);

  dummy.position.set(
    vehicle.position.x + TRAFFIC_PART_LOCAL_OFFSET.x,
    TRAFFIC_PART_LOCAL_OFFSET.y,
    vehicle.position.z + TRAFFIC_PART_LOCAL_OFFSET.z,
  );

  dummy.rotation.set(
    vehicle.visualPitchRad + localRotX,
    renderHeadingRad + localRotY,
    renderRollRad + localRotZ,
  );

  dummy.scale.set(scaleX, scaleY, scaleZ);
  dummy.updateMatrix();
}
