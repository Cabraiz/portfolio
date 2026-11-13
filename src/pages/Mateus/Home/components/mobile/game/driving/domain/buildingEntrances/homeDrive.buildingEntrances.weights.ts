// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.weights.ts
// Pesos de tipo e material.

import type {
  HomeDriveBuildingEntranceKind,
  HomeDriveBuildingEntranceKindWeights,
  HomeDriveBuildingEntranceMaterialWeights,
  HomeDriveBuildingEntranceResolutionInput,
} from "./homeDrive.buildingEntrances.types";
import {
  hasPremiumBias,
  hasCommercialBias,
  hasServiceBias,
  hasAgedBias,
  isDenseUrban,
} from "./homeDrive.buildingEntrances.helpers";

export function getKindWeights(
  input: HomeDriveBuildingEntranceResolutionInput,
): HomeDriveBuildingEntranceKindWeights {
  const premium = hasPremiumBias(input);
  const commercial = hasCommercialBias(input);
  const service = hasServiceBias(input);
  const aged = hasAgedBias(input);
  const dense = isDenseUrban(input);

  switch (input.kind) {
    case "house":
      return {
        "single-door": 4.8,
        "double-door": premium ? 1.05 : 0.34,
        "tall-door": 0.92,
        "portaria": 0,
        "garage-door": 0.72,
        "broken-door": aged ? 0.88 : 0.22,
        "service-gate": service ? 0.88 : 0.42,
        "shopfront-door": 0,
      };

    case "apartment":
      return {
        "single-door": 1.28,
        "double-door": 2.25,
        "tall-door": 0.84,
        "portaria": premium ? 3.6 : 2.1,
        "garage-door": dense ? 0.44 : 0.2,
        "broken-door": aged ? 0.42 : 0.1,
        "service-gate": 0.32,
        "shopfront-door": 0,
      };

    case "office":
      return {
        "single-door": 0.48,
        "double-door": 2.2,
        "tall-door": 1.15,
        "portaria": premium ? 3.8 : 2.45,
        "garage-door": 0.18,
        "broken-door": 0.04,
        "service-gate": 0.32,
        "shopfront-door": 0.94,
      };

    case "commerce":
      return {
        "single-door": 0.92,
        "double-door": 1.55,
        "tall-door": 0.52,
        "portaria": premium ? 0.65 : 0.16,
        "garage-door": service ? 1.2 : 0.42,
        "broken-door": aged ? 0.52 : 0.12,
        "service-gate": 0.65,
        "shopfront-door": commercial ? 3.75 : 2.4,
      };

    case "warehouse":
      return {
        "single-door": 0.38,
        "double-door": 0.24,
        "tall-door": 0.42,
        "portaria": 0.05,
        "garage-door": 3.6,
        "broken-door": aged ? 0.42 : 0.14,
        "service-gate": 2.35,
        "shopfront-door": 0.12,
      };

    default:
      return {
        "single-door": 1,
      };
  }
}

export function getMaterialWeights(
  input: HomeDriveBuildingEntranceResolutionInput,
  entranceKind: HomeDriveBuildingEntranceKind,
): HomeDriveBuildingEntranceMaterialWeights {
  const premium = hasPremiumBias(input);
  const aged = hasAgedBias(input);

  if (entranceKind === "portaria") {
    return {
      glass: premium ? 4.2 : 2.8,
      metal: 0.62,
      painted: 0.32,
      dark: 0.44,
      wood: 0.1,
      "rolling-steel": 0,
    };
  }

  if (entranceKind === "shopfront-door") {
    return {
      glass: 3.8,
      metal: 0.72,
      painted: 0.35,
      dark: 0.24,
      wood: 0.05,
      "rolling-steel": 0.42,
    };
  }

  if (entranceKind === "garage-door") {
    return {
      "rolling-steel": 3.5,
      metal: 2.15,
      painted: 0.42,
      dark: 0.28,
      wood: 0.08,
      glass: 0,
    };
  }

  if (entranceKind === "service-gate") {
    return {
      metal: 2.65,
      "rolling-steel": 1.15,
      painted: 0.88,
      dark: 0.72,
      wood: 0.16,
      glass: 0,
    };
  }

  if (entranceKind === "broken-door") {
    return {
      wood: aged ? 2.15 : 1.35,
      metal: 1.25,
      painted: 1.15,
      dark: 0.9,
      glass: 0.1,
      "rolling-steel": 0.12,
    };
  }

  switch (input.kind) {
    case "house":
      return {
        wood: 2.6,
        painted: 1.95,
        metal: 0.64,
        dark: 0.3,
        glass: premium ? 0.28 : 0.08,
        "rolling-steel": 0,
      };

    case "apartment":
      return {
        glass: premium ? 1.8 : 0.88,
        metal: 1.34,
        painted: 0.85,
        dark: 0.72,
        wood: 0.44,
        "rolling-steel": 0,
      };

    case "office":
      return {
        glass: 3.2,
        metal: 1.05,
        dark: 0.6,
        painted: 0.28,
        wood: 0.04,
        "rolling-steel": 0,
      };

    case "commerce":
      return {
        glass: 2.55,
        metal: 0.95,
        painted: 0.85,
        dark: 0.42,
        wood: 0.18,
        "rolling-steel": 0.22,
      };

    case "warehouse":
      return {
        metal: 2.4,
        "rolling-steel": 2.1,
        painted: 0.58,
        dark: 0.52,
        wood: 0.08,
        glass: 0,
      };

    default:
      return {
        painted: 1,
      };
  }
}
