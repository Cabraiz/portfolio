// src/pages/Mateus/Home/components/mobile/game/driving/three/crosswalks/homeDriveThree.crosswalkMaterials.ts

import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";

export const HOME_DRIVE_THREE_CROSSWALK_COLORS = Object.freeze({
  stripe: "#f2efe0",
  stripeWorn: "#d7d2bc",
  stripeOld: "#aaa58f",
  schoolYellow: "#d6b044",
  signalPole: "#343837",
  signalWalk: "#48c774",
  signalWait: "#d89b3d",
  signalDanger: "#d84e42",
  shadow: "#111513",
});

export const HOME_DRIVE_THREE_CROSSWALK_MATERIALS = Object.freeze({
  stripe: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.stripe,
    side: DoubleSide,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),

  stripeWorn: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.stripeWorn,
    side: DoubleSide,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),

  stripeOld: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.stripeOld,
    side: DoubleSide,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),

  schoolYellow: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.schoolYellow,
    side: DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),

  signalPole: new MeshStandardMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.signalPole,
    roughness: 0.84,
    metalness: 0.08,
  }),

  signalWalk: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.signalWalk,
    toneMapped: false,
  }),

  signalWait: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.signalWait,
    toneMapped: false,
  }),

  signalDanger: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.signalDanger,
    toneMapped: false,
  }),

  shadow: new MeshBasicMaterial({
    color: HOME_DRIVE_THREE_CROSSWALK_COLORS.shadow,
    side: DoubleSide,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),
});
