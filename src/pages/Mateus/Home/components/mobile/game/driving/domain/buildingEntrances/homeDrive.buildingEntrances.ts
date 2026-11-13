// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.ts

import type {
  HomeDriveBuildingEntranceKind,
  HomeDriveBuildingEntranceMaterial,
  HomeDriveBuildingEntranceProfile,
  HomeDriveBuildingEntranceResolutionInput,
} from "./homeDrive.buildingEntrances.types";
import { normalizeSeed, seeded01, weightedPick } from "./homeDrive.buildingEntrances.helpers";
import { getKindWeights, getMaterialWeights } from "./homeDrive.buildingEntrances.weights";
import {
  resolveEntranceCondition,
  resolveDamageLevel,
  resolveEntranceWidthMeters,
  resolveEntranceHeightMeters,
  resolveLocalX,
  resolveCanopyKind,
  resolveSignKind,
  shouldHaveIntercom,
  shouldHaveSidePillars,
  shouldHaveCenterDivider,
  shouldHaveGlassHighlights,
  shouldHaveHandle,
  getFallbackEntranceKind,
  getFallbackMaterial,
} from "./homeDrive.buildingEntrances.resolvers";

export function createHomeDriveBuildingEntranceProfile(
  input: HomeDriveBuildingEntranceResolutionInput,
): HomeDriveBuildingEntranceProfile {
  const baseSeed = normalizeSeed(
    input.facadeSeed,
    seeded01(input.buildingId, input.roadId, input.variant, "entrance"),
  );

  const kindSeed = seeded01(input.buildingId, input.roadId, baseSeed, "kind");
  const materialSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "material",
  );
  const conditionSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "condition",
  );
  const damageSeed = seeded01(
    input.buildingId,
    input.roadId,
    baseSeed,
    "damage",
  );
  const widthSeed = seeded01(input.buildingId, baseSeed, "width");
  const heightSeed = seeded01(input.buildingId, baseSeed, "height");
  const localXSeed = seeded01(input.buildingId, baseSeed, "local-x");
  const canopySeed = seeded01(input.buildingId, baseSeed, "canopy");
  const signSeed = seeded01(input.buildingId, baseSeed, "sign");
  const intercomSeed = seeded01(input.buildingId, baseSeed, "intercom");
  const pillarSeed = seeded01(input.buildingId, baseSeed, "pillars");
  const detailSeed = seeded01(input.buildingId, baseSeed, "detail");

  const kind = weightedPick<HomeDriveBuildingEntranceKind>(
    getKindWeights(input),
    kindSeed,
    getFallbackEntranceKind(input.kind),
  );

  const material = weightedPick<HomeDriveBuildingEntranceMaterial>(
    getMaterialWeights(input, kind),
    materialSeed,
    getFallbackMaterial(kind),
  );

  const condition = resolveEntranceCondition(input, kind, conditionSeed);
  const damageLevel = resolveDamageLevel(condition, kind, damageSeed);

  const widthMeters = resolveEntranceWidthMeters(input, kind, widthSeed);
  const heightMeters = resolveEntranceHeightMeters(
    input,
    kind,
    widthMeters,
    heightSeed,
  );

  const localX = resolveLocalX(input, kind, widthMeters, localXSeed);
  const canopyKind = resolveCanopyKind(input, kind, canopySeed);
  const signKind = resolveSignKind(input, kind, signSeed);

  const isGate = kind === "garage-door" || kind === "service-gate";
  const isPremiumEntrance = kind === "portaria" || kind === "double-door";
  const isGlassEntrance = shouldHaveGlassHighlights(material, kind);

  return {
    kind,
    material,
    condition,

    localX,
    widthMeters,
    heightMeters,
    baseYOffsetMeters: isGate ? 0.02 : 0,
    protrusionMeters: isPremiumEntrance ? 0.08 : 0.045,

    hasFrame: true,
    hasHandle: shouldHaveHandle(kind, material),
    hasIntercom: shouldHaveIntercom(input, kind, intercomSeed),
    hasSidePillars: shouldHaveSidePillars(input, kind, pillarSeed),
    hasCenterDivider: shouldHaveCenterDivider(kind),
    hasGlassHighlights: isGlassEntrance,

    canopyKind,
    signKind,
    damageLevel,
    detailSeed,
  };
}

export function getHomeDriveBuildingEntranceIsPublic(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return (
    entrance.kind === "portaria" ||
    entrance.kind === "shopfront-door" ||
    entrance.signKind === "reception"
  );
}

export function getHomeDriveBuildingEntranceHasNoParkingSign(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return entrance.signKind === "no-parking";
}

export function getHomeDriveBuildingEntranceIsGarageLike(
  entrance: HomeDriveBuildingEntranceProfile,
): boolean {
  return entrance.kind === "garage-door" || entrance.kind === "service-gate";
}

export function getHomeDriveBuildingEntranceVisualPriority(
  entrance: HomeDriveBuildingEntranceProfile,
): number {
  switch (entrance.kind) {
    case "portaria":
      return 5;
    case "shopfront-door":
      return 4;
    case "garage-door":
    case "double-door":
      return 3;
    case "tall-door":
    case "service-gate":
      return 2;
    case "broken-door":
    case "single-door":
    default:
      return 1;
  }
}
