// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.commerceNames.ts

import type { HomeDriveBuildingKind } from "./homeDrive.building.types";
import type {
  HomeDriveCommerceCategory,
  HomeDriveCommerceNameInput,
  HomeDriveCommerceSignStyle,
  HomeDriveCommerceAwningStyle,
  HomeDriveCommerceDescriptor,
} from "./homeDrive.commerceNames.types";
import {
  COMMERCE_NAMES,
  COMMERCE_SUFFIXES,
} from "./homeDrive.commerceNames.catalog";

export type {
  HomeDriveCommerceCategory,
  HomeDriveCommerceSignStyle,
  HomeDriveCommerceAwningStyle,
  HomeDriveCommerceDescriptor,
  HomeDriveCommerceNameInput,
} from "./homeDrive.commerceNames.types";

export function getHomeDriveStableStringSeed(value: string, salt = 0): number {
  let hash = 2166136261 ^ salt;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function pickSeeded<T>(items: readonly T[], seed: number, fallback: T): T {
  if (items.length <= 0) {
    return fallback;
  }

  const index = Math.min(
    items.length - 1,
    Math.floor(Math.max(0, Math.min(0.999999, seed)) * items.length),
  );

  return items[index] ?? fallback;
}

function getDistrictPreferredCategories(
  districtId: string | undefined,
): readonly HomeDriveCommerceCategory[] {
  switch (districtId) {
    case "centro":
      return [
        "bank",
        "pharmacy",
        "market",
        "tech",
        "office",
        "restaurant",
        "cafe",
        "clothing",
      ];

    case "aldeota":
    case "meireles":
      return [
        "cafe",
        "restaurant",
        "clinic",
        "gym",
        "clothing",
        "office",
        "pharmacy",
        "petshop",
      ];

    case "praia-de-iracema":
      return ["bar", "restaurant", "cafe", "clothing", "market", "generic"];

    case "benfica":
      return ["cafe", "bar", "restaurant", "tech", "market", "bakery", "generic"];

    case "castelao":
      return [
        "bar",
        "restaurant",
        "auto-parts",
        "hardware",
        "market",
        "warehouse",
        "generic",
      ];

    default:
      return [
        "market",
        "bakery",
        "pharmacy",
        "cafe",
        "restaurant",
        "hardware",
        "salon",
        "generic",
      ];
  }
}

function getBuildingKindPreferredCategories(
  kind: HomeDriveBuildingKind,
): readonly HomeDriveCommerceCategory[] {
  switch (kind) {
    case "commerce":
      return [
        "market",
        "bakery",
        "pharmacy",
        "cafe",
        "bar",
        "restaurant",
        "tech",
        "clothing",
        "salon",
        "petshop",
        "generic",
      ];

    case "office":
      return ["office", "bank", "clinic", "tech", "gym"];

    case "warehouse":
      return ["warehouse", "hardware", "auto-parts", "market"];

    case "apartment":
      return ["market", "bakery", "pharmacy", "cafe", "salon", "generic"];

    case "house":
    default:
      return ["generic", "bakery", "market", "salon"];
  }
}

export function shouldHomeDriveBuildingHaveCommerceSign(
  building: HomeDriveCommerceNameInput,
): boolean {
  if (building.kind === "commerce" || building.kind === "office") {
    return true;
  }

  if (building.kind === "warehouse") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:warehouse-sign`, 17);

    return seed > 0.22;
  }

  if (building.kind === "apartment") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:apartment-sign`, 23);

    return seed > 0.68;
  }

  if (building.kind === "house") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:house-sign`, 29);

    return seed > 0.88;
  }

  return false;
}

export function pickHomeDriveCommerceCategory(
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceCategory {
  const districtCategories = getDistrictPreferredCategories(building.districtId);
  const kindCategories = getBuildingKindPreferredCategories(building.kind);

  const mixedCategories = [
    ...kindCategories,
    ...districtCategories,
    ...kindCategories.slice(0, 3),
  ];

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:${building.roadId}:${building.segmentId}:category:${building.variant}`,
    41,
  );

  return pickSeeded<HomeDriveCommerceCategory>(
    mixedCategories,
    seed,
    "generic",
  );
}

export function pickHomeDriveCommerceSignStyle(
  category: HomeDriveCommerceCategory,
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceSignStyle {
  if (category === "pharmacy") {
    return "pharmacy";
  }

  if (category === "market") {
    return "market";
  }

  if (category === "warehouse" || building.kind === "warehouse") {
    return "industrial";
  }

  if (building.kind === "office") {
    return "glass";
  }

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:sign-style:${building.variant}`,
    53,
  );

  if (seed > 0.84) {
    return "vertical";
  }

  if (seed > 0.66) {
    return "neon";
  }

  if (seed > 0.44) {
    return "panel";
  }

  if (seed > 0.22) {
    return "classic";
  }

  return "painted";
}

export function pickHomeDriveCommerceAwningStyle(
  category: HomeDriveCommerceCategory,
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceAwningStyle {
  if (building.kind !== "commerce" && building.kind !== "apartment") {
    return "none";
  }

  if (
    category === "bank" ||
    category === "office" ||
    category === "warehouse" ||
    category === "clinic"
  ) {
    return "none";
  }

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:awning:${building.variant}`,
    67,
  );

  if (seed > 0.78) {
    return "striped";
  }

  if (seed > 0.54) {
    return "fabric";
  }

  if (seed > 0.32) {
    return "flat";
  }

  if (seed > 0.16) {
    return "metal";
  }

  return "none";
}

export function getHomeDriveCommerceDescriptor(
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceDescriptor {
  const category = pickHomeDriveCommerceCategory(building);
  const signStyle = pickHomeDriveCommerceSignStyle(category, building);
  const awningStyle = pickHomeDriveCommerceAwningStyle(category, building);

  const nameSeed = getHomeDriveStableStringSeed(
    `${building.id}:${category}:name:${building.variant}`,
    79,
  );

  const suffixSeed = getHomeDriveStableStringSeed(
    `${building.id}:${category}:suffix:${building.variant}`,
    83,
  );

  const baseName = pickSeeded(
    COMMERCE_NAMES[category],
    nameSeed,
    COMMERCE_NAMES.generic[0],
  );

  const suffix = pickSeeded(COMMERCE_SUFFIXES, suffixSeed, "");

  return {
    category,
    name: suffix ? `${baseName} ${suffix}` : baseName,
    signStyle,
    awningStyle,
    seed: getHomeDriveStableStringSeed(`${building.id}:descriptor`, 97),
  };
}
