import type { HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";

export type HomeDriveRoadsideKind = "lamp" | "palm" | "post" | "banner";

export type HomeDriveRoadsideItem = Readonly<{
  id: string;
  side: "left" | "right";
  depth: number;
  kind: HomeDriveRoadsideKind;
}>;

export type HomeDriveRoadsideVisual = Readonly<{
  width: number;
  height: number;
  glow: string;
  shaft: string;
  accent: string;
}>;

function buildBaseDepths(densityMultiplier: number): readonly number[] {
  const base = [0.12, 0.26, 0.4, 0.56, 0.74];
  return base.map((value) => Math.min(0.88, value * densityMultiplier));
}

export function getHomeDriveRoadsideItems(
  routeSegment: HomeDriveRouteSegment,
): readonly HomeDriveRoadsideItem[] {
  const density =
    routeSegment.trafficDensity >= 0.45
      ? 1.04
      : routeSegment.trafficDensity <= 0.2
        ? 0.92
        : 1;

  const baseDepths = buildBaseDepths(density);

  switch (routeSegment.ambience) {
    case "coast":
      return baseDepths.flatMap((depth, index) => [
        {
          id: `left-palm-${index}`,
          side: "left" as const,
          depth,
          kind: index % 2 === 0 ? "palm" : "lamp",
        },
        {
          id: `right-lamp-${index}`,
          side: "right" as const,
          depth: Math.min(0.9, depth + 0.04),
          kind: index % 2 === 0 ? "lamp" : "palm",
        },
      ]);

    case "nightlife":
      return baseDepths.flatMap((depth, index) => [
        {
          id: `left-banner-${index}`,
          side: "left" as const,
          depth,
          kind: index % 2 === 0 ? "banner" : "lamp",
        },
        {
          id: `right-banner-${index}`,
          side: "right" as const,
          depth: Math.min(0.9, depth + 0.05),
          kind: index % 2 === 0 ? "lamp" : "banner",
        },
      ]);

    case "stadium":
      return baseDepths.flatMap((depth, index) => [
        {
          id: `left-post-${index}`,
          side: "left" as const,
          depth,
          kind: "post",
        },
        {
          id: `right-post-${index}`,
          side: "right" as const,
          depth: Math.min(0.9, depth + 0.03),
          kind: index % 2 === 0 ? "banner" : "post",
        },
      ]);

    default:
      return baseDepths.flatMap((depth, index) => [
        {
          id: `left-lamp-${index}`,
          side: "left" as const,
          depth,
          kind: index % 3 === 0 ? "post" : "lamp",
        },
        {
          id: `right-lamp-${index}`,
          side: "right" as const,
          depth: Math.min(0.9, depth + 0.04),
          kind: index % 3 === 0 ? "post" : "lamp",
        },
      ]);
  }
}

export function getHomeDriveRoadsideVisual(
  kind: HomeDriveRoadsideKind,
  routeSegment: HomeDriveRouteSegment,
): HomeDriveRoadsideVisual {
  const accent =
    routeSegment.ambience === "stadium"
      ? "rgba(198, 164, 255, 0.72)"
      : routeSegment.ambience === "nightlife"
        ? "rgba(255, 167, 116, 0.72)"
        : "rgba(255, 208, 138, 0.72)";

  switch (kind) {
    case "palm":
      return {
        width: 18,
        height: 68,
        glow: "rgba(120, 182, 112, 0.14)",
        shaft:
          "linear-gradient(180deg, rgba(76,58,42,0.88), rgba(24,18,14,0.96))",
        accent,
      };

    case "banner":
      return {
        width: 16,
        height: 64,
        glow: "rgba(255, 176, 108, 0.12)",
        shaft:
          "linear-gradient(180deg, rgba(88,88,96,0.9), rgba(22,22,26,0.98))",
        accent,
      };

    case "post":
      return {
        width: 12,
        height: 58,
        glow: "rgba(196, 182, 124, 0.08)",
        shaft:
          "linear-gradient(180deg, rgba(80,80,88,0.9), rgba(18,18,22,0.98))",
        accent,
      };

    case "lamp":
    default:
      return {
        width: 14,
        height: 62,
        glow: "rgba(255, 196, 126, 0.12)",
        shaft:
          "linear-gradient(180deg, rgba(86,86,92,0.9), rgba(18,18,22,0.98))",
        accent,
      };
  }
}
