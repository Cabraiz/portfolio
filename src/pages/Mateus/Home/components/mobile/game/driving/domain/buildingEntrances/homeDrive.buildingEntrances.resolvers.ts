// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.resolvers.ts
// Resolução dos atributos da entrada.

import type { HomeDriveBuildingKind } from "../homeDrive.building.types";
import type {
  HomeDriveBuildingEntranceCanopyKind,
  HomeDriveBuildingEntranceCondition,
  HomeDriveBuildingEntranceKind,
  HomeDriveBuildingEntranceMaterial,
  HomeDriveBuildingEntranceResolutionInput,
  HomeDriveBuildingEntranceSignKind,
} from "./homeDrive.buildingEntrances.types";
import {
  clamp,
  lerp,
  hasPremiumBias,
  hasCommercialBias,
  hasAgedBias,
  isDenseUrban,
} from "./homeDrive.buildingEntrances.helpers";

export function resolveEntranceCondition(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceCondition {
  if (entranceKind === "broken-door") {
    return seed > 0.62 ? "broken" : "damaged";
  }

  const aged = hasAgedBias(input);

  if (aged && seed > 0.78) {
    return "damaged";
  }

  if (aged && seed > 0.48) {
    return "aged";
  }

  if (seed > 0.76) {
    return "used";
  }

  return "clean";
}

export function resolveDamageLevel(
  condition: HomeDriveBuildingEntranceCondition,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): 0 | 1 | 2 | 3 {
  if (entranceKind === "broken-door") {
    return seed > 0.58 ? 3 : 2;
  }

  switch (condition) {
    case "broken":
      return 3;
    case "damaged":
      return seed > 0.55 ? 2 : 1;
    case "aged":
    case "used":
      return seed > 0.72 ? 1 : 0;
    case "clean":
    default:
      return 0;
  }
}

export function resolveEntranceWidthMeters(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): number {
  const facadeWidth = Math.max(3.2, input.widthMeters);
  const maxSafeWidth = Math.max(1.4, facadeWidth * 0.42);

  const width = (() => {
    switch (entranceKind) {
      case "portaria":
        return lerp(2.25, 3.7, seed);
      case "double-door":
        return lerp(1.85, 2.85, seed);
      case "tall-door":
        return lerp(1.24, 1.82, seed);
      case "garage-door":
        return lerp(2.7, 4.6, seed);
      case "service-gate":
        return lerp(1.75, 2.95, seed);
      case "shopfront-door":
        return lerp(2.15, 4.2, seed);
      case "broken-door":
        return lerp(1.05, 1.72, seed);
      case "single-door":
      default:
        return lerp(1.05, 1.62, seed);
    }
  })();

  return clamp(width, 0.82, maxSafeWidth);
}

export function resolveEntranceHeightMeters(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  widthMeters: number,
  seed: number,
): number {
  const buildingSafeHeight = Math.max(2.2, input.heightMeters * 0.55);

  const height = (() => {
    switch (entranceKind) {
      case "portaria":
        return lerp(3.05, 4.35, seed);
      case "double-door":
        return lerp(2.55, 3.35, seed);
      case "tall-door":
        return lerp(3.1, 4.05, seed);
      case "garage-door":
        return lerp(2.65, 3.8, seed);
      case "service-gate":
        return lerp(2.25, 3.18, seed);
      case "shopfront-door":
        return lerp(2.85, 4.15, seed);
      case "broken-door":
        return lerp(2.05, 2.75, seed);
      case "single-door":
      default:
        return lerp(2.15, 2.85, seed);
    }
  })();

  return clamp(height, 1.85, Math.max(widthMeters * 0.82, buildingSafeHeight));
}

export function resolveLocalX(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  widthMeters: number,
  seed: number,
): number {
  const facadeWidth = Math.max(3.2, input.widthMeters);
  const availableHalf = Math.max(0, facadeWidth * 0.5 - widthMeters * 0.68);

  if (
    entranceKind === "portaria" ||
    entranceKind === "garage-door" ||
    entranceKind === "shopfront-door"
  ) {
    return clamp((seed - 0.5) * availableHalf * 0.54, -availableHalf, availableHalf);
  }

  if (input.kind === "house") {
    return clamp((seed - 0.5) * availableHalf * 1.38, -availableHalf, availableHalf);
  }

  return clamp((seed - 0.5) * availableHalf * 0.82, -availableHalf, availableHalf);
}

export function resolveCanopyKind(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceCanopyKind {
  const premium = hasPremiumBias(input);

  if (entranceKind === "garage-door" || entranceKind === "service-gate") {
    return seed > 0.76 ? "thin-metal" : "none";
  }

  if (entranceKind === "portaria") {
    if (premium && seed > 0.42) {
      return "glass";
    }

    return seed > 0.34 ? "flat-slab" : "none";
  }

  if (entranceKind === "shopfront-door") {
    if (seed > 0.72) {
      return "fabric";
    }

    return seed > 0.32 ? "thin-metal" : "none";
  }

  if (entranceKind === "double-door" || entranceKind === "tall-door") {
    return seed > 0.64 ? "flat-slab" : "none";
  }

  if (input.kind === "house") {
    return seed > 0.82 ? "thin-metal" : "none";
  }

  return seed > 0.78 ? "flat-slab" : "none";
}

export function resolveSignKind(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): HomeDriveBuildingEntranceSignKind {
  const dense = isDenseUrban(input);
  const commercial = hasCommercialBias(input);

  if (entranceKind === "garage-door") {
    if (seed > 0.42 || dense) {
      return "no-parking";
    }

    return "garage";
  }

  if (entranceKind === "service-gate") {
    if (seed > 0.62) {
      return "service";
    }

    return seed > 0.28 ? "private-property" : "none";
  }

  if (entranceKind === "portaria") {
    if (seed > 0.62) {
      return "reception";
    }

    return dense && seed > 0.34 ? "no-parking" : "none";
  }

  if (commercial && seed > 0.72) {
    return "no-parking";
  }

  if (input.kind === "house" && seed > 0.88) {
    return "private-property";
  }

  return "none";
}

export function shouldHaveIntercom(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): boolean {
  if (entranceKind === "portaria") {
    return seed > 0.12;
  }

  if (input.kind === "apartment" || input.kind === "office") {
    return seed > 0.38;
  }

  if (entranceKind === "double-door" || entranceKind === "tall-door") {
    return seed > 0.72;
  }

  return false;
}

export function shouldHaveSidePillars(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
  seed: number,
): boolean {
  if (entranceKind === "portaria") {
    return seed > 0.16;
  }

  if (entranceKind === "double-door" && hasPremiumBias(input)) {
    return seed > 0.44;
  }

  if (entranceKind === "garage-door" || entranceKind === "service-gate") {
    return seed > 0.72;
  }

  return false;
}

export function shouldHaveCenterDivider(
  entranceKind: HomeDriveBuildingEntranceKind,
): boolean {
  return (
    entranceKind === "double-door" ||
    entranceKind === "portaria" ||
    entranceKind === "shopfront-door" ||
    entranceKind === "garage-door"
  );
}

export function shouldHaveGlassHighlights(
  material: HomeDriveBuildingEntranceMaterial,
  entranceKind: HomeDriveBuildingEntranceKind,
): boolean {
  return (
    material === "glass" ||
    entranceKind === "portaria" ||
    entranceKind === "shopfront-door"
  );
}

export function shouldHaveHandle(
  entranceKind: HomeDriveBuildingEntranceKind,
  material: HomeDriveBuildingEntranceMaterial,
): boolean {
  return (
    entranceKind !== "garage-door" &&
    material !== "rolling-steel" &&
    entranceKind !== "service-gate"
  );
}

export function getFallbackEntranceKind(
  buildingKind: HomeDriveBuildingKind,
): HomeDriveBuildingEntranceKind {
  switch (buildingKind) {
    case "apartment":
      return "portaria";
    case "office":
      return "double-door";
    case "commerce":
      return "shopfront-door";
    case "warehouse":
      return "garage-door";
    case "house":
    default:
      return "single-door";
  }
}

export function getFallbackMaterial(
  entranceKind: HomeDriveBuildingEntranceKind,
): HomeDriveBuildingEntranceMaterial {
  switch (entranceKind) {
    case "portaria":
    case "shopfront-door":
      return "glass";
    case "garage-door":
      return "rolling-steel";
    case "service-gate":
      return "metal";
    case "broken-door":
      return "wood";
    case "double-door":
    case "tall-door":
    case "single-door":
    default:
      return "painted";
  }
}
