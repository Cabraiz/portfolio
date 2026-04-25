import type { HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";
import type { HomeDriveRoadShoulderStyle } from "./homeDrive.roadCurves";

export type HomeDriveRoadProfileId =
  | "boulevard"
  | "avenue"
  | "urban-core"
  | "corridor";

export type HomeDriveRoadPalette = Readonly<{
  asphaltNear: string;
  asphaltFar: string;
  asphaltAltNear: string;
  asphaltAltFar: string;

  laneMark: string;
  laneMarkDim: string;

  roadEdge: string;
  roadEdgeShadow: string;

  rumbleA: string;
  rumbleB: string;

  sideNear: string;
  sideFar: string;
  sideAlt: string;

  shoulderGlow: string;
  textureLine: string;
  textureShade: string;
}>;

export type HomeDriveRoadProfile = Readonly<{
  id: HomeDriveRoadProfileId;

  /**
   * Campos antigos mantidos para compatibilidade com qualquer uso existente.
   */
  leftInset: string;
  rightInset: string;
  sideLineInset: string;
  centerWidth: string;
  shoulderGlow: string;
  roadTint: string;
  borderTop: string;
  perspective: number;
  rotateXDeg: number;
  laneDriftMultiplier: number;

  /**
   * Campos novos para renderer pseudo-3D.
   * Valores em porcentagem do viewBox SVG 0..100.
   */
  horizonY: number;
  roadBottomY: number;
  horizonRoadWidth: number;
  baseRoadWidth: number;
  rumbleWidth: number;
  shoulderWidth: number;

  laneCount: number;
  laneMarkWidth: number;

  textureOpacity: number;
  scanlineOpacity: number;
  edgeLightOpacity: number;

  defaultShoulderStyle: HomeDriveRoadShoulderStyle;
  palette: HomeDriveRoadPalette;
}>;

type HomeDriveRoadProfileOverrides = Omit<
  Partial<HomeDriveRoadProfile>,
  "palette"
> &
  Readonly<{
    palette?: Partial<HomeDriveRoadPalette>;
  }>;

const BOULEVARD_PROFILE: HomeDriveRoadProfile = {
  id: "boulevard",

  leftInset: "-18%",
  rightInset: "-18%",
  sideLineInset: "12%",
  centerWidth: "1.65%",
  shoulderGlow: "rgba(255, 196, 118, 0.08)",
  roadTint:
    "linear-gradient(180deg, rgba(72,72,78,0.96), rgba(24,24,28,0.98) 28%, rgba(10,10,12,1) 100%)",
  borderTop: "rgba(255,255,255,0.08)",
  perspective: 720,
  rotateXDeg: 67,
  laneDriftMultiplier: -14,

  horizonY: 13,
  roadBottomY: 100,
  horizonRoadWidth: 34,
  baseRoadWidth: 158,
  rumbleWidth: 7.2,
  shoulderWidth: 20,

  laneCount: 2,
  laneMarkWidth: 1.15,

  textureOpacity: 0.34,
  scanlineOpacity: 0.16,
  edgeLightOpacity: 0.42,

  defaultShoulderStyle: "coast-sand",
  palette: {
    asphaltNear: "#33373d",
    asphaltFar: "#555b63",
    asphaltAltNear: "#2c3036",
    asphaltAltFar: "#4d535c",

    laneMark: "#f7e9b8",
    laneMarkDim: "rgba(247, 233, 184, 0.46)",

    roadEdge: "rgba(255, 255, 255, 0.28)",
    roadEdgeShadow: "rgba(0, 0, 0, 0.32)",

    rumbleA: "#d8453f",
    rumbleB: "#f5efe0",

    sideNear: "#d8bd78",
    sideFar: "#f0cf86",
    sideAlt: "#cda860",

    shoulderGlow: "rgba(255, 206, 138, 0.16)",
    textureLine: "rgba(255, 255, 255, 0.12)",
    textureShade: "rgba(0, 0, 0, 0.2)",
  },
};

const AVENUE_PROFILE: HomeDriveRoadProfile = {
  id: "avenue",

  leftInset: "-16%",
  rightInset: "-16%",
  sideLineInset: "12.5%",
  centerWidth: "1.62%",
  shoulderGlow: "rgba(182, 174, 126, 0.07)",
  roadTint:
    "linear-gradient(180deg, rgba(68,68,74,0.94), rgba(22,22,26,0.98) 30%, rgba(10,10,12,1) 100%)",
  borderTop: "rgba(255,255,255,0.08)",
  perspective: 720,
  rotateXDeg: 67,
  laneDriftMultiplier: -14,

  horizonY: 14,
  roadBottomY: 100,
  horizonRoadWidth: 32,
  baseRoadWidth: 152,
  rumbleWidth: 6.8,
  shoulderWidth: 19,

  laneCount: 2,
  laneMarkWidth: 1.08,

  textureOpacity: 0.32,
  scanlineOpacity: 0.14,
  edgeLightOpacity: 0.36,

  defaultShoulderStyle: "classic-rumble",
  palette: {
    asphaltNear: "#32363c",
    asphaltFar: "#545963",
    asphaltAltNear: "#2b2f35",
    asphaltAltFar: "#4a5059",

    laneMark: "#f6eabf",
    laneMarkDim: "rgba(246, 234, 191, 0.42)",

    roadEdge: "rgba(255, 255, 255, 0.24)",
    roadEdgeShadow: "rgba(0, 0, 0, 0.3)",

    rumbleA: "#d8443d",
    rumbleB: "#f2efe7",

    sideNear: "#385f34",
    sideFar: "#5aa850",
    sideAlt: "#2d7b39",

    shoulderGlow: "rgba(182, 174, 126, 0.12)",
    textureLine: "rgba(255, 255, 255, 0.1)",
    textureShade: "rgba(0, 0, 0, 0.18)",
  },
};

const URBAN_CORE_PROFILE: HomeDriveRoadProfile = {
  id: "urban-core",

  leftInset: "-14%",
  rightInset: "-14%",
  sideLineInset: "13%",
  centerWidth: "1.52%",
  shoulderGlow: "rgba(168, 148, 108, 0.05)",
  roadTint:
    "linear-gradient(180deg, rgba(62,62,66,0.96), rgba(20,20,22,0.99) 32%, rgba(8,8,9,1) 100%)",
  borderTop: "rgba(255,255,255,0.08)",
  perspective: 700,
  rotateXDeg: 68,
  laneDriftMultiplier: -12,

  horizonY: 15,
  roadBottomY: 100,
  horizonRoadWidth: 30,
  baseRoadWidth: 146,
  rumbleWidth: 6.4,
  shoulderWidth: 18,

  laneCount: 2,
  laneMarkWidth: 1,

  textureOpacity: 0.38,
  scanlineOpacity: 0.18,
  edgeLightOpacity: 0.3,

  defaultShoulderStyle: "urban-dark",
  palette: {
    asphaltNear: "#2d3036",
    asphaltFar: "#494d55",
    asphaltAltNear: "#25282e",
    asphaltAltFar: "#414650",

    laneMark: "#e7dcc2",
    laneMarkDim: "rgba(231, 220, 194, 0.34)",

    roadEdge: "rgba(255, 255, 255, 0.18)",
    roadEdgeShadow: "rgba(0, 0, 0, 0.36)",

    rumbleA: "#a43a36",
    rumbleB: "#d8d4c8",

    sideNear: "#1c2025",
    sideFar: "#2d333b",
    sideAlt: "#232830",

    shoulderGlow: "rgba(168, 148, 108, 0.08)",
    textureLine: "rgba(255, 255, 255, 0.08)",
    textureShade: "rgba(0, 0, 0, 0.24)",
  },
};

const CORRIDOR_PROFILE: HomeDriveRoadProfile = {
  id: "corridor",

  leftInset: "-16%",
  rightInset: "-16%",
  sideLineInset: "12.5%",
  centerWidth: "1.6%",
  shoulderGlow: "rgba(138, 132, 182, 0.06)",
  roadTint:
    "linear-gradient(180deg, rgba(66,66,72,0.94), rgba(22,22,26,0.98) 28%, rgba(9,9,11,1) 100%)",
  borderTop: "rgba(255,255,255,0.08)",
  perspective: 740,
  rotateXDeg: 66,
  laneDriftMultiplier: -14,

  horizonY: 13,
  roadBottomY: 100,
  horizonRoadWidth: 32,
  baseRoadWidth: 154,
  rumbleWidth: 6.8,
  shoulderWidth: 19,

  laneCount: 2,
  laneMarkWidth: 1.08,

  textureOpacity: 0.4,
  scanlineOpacity: 0.18,
  edgeLightOpacity: 0.38,

  defaultShoulderStyle: "stadium-night",
  palette: {
    asphaltNear: "#2e3138",
    asphaltFar: "#4b5060",
    asphaltAltNear: "#262a31",
    asphaltAltFar: "#42485a",

    laneMark: "#efe5c4",
    laneMarkDim: "rgba(239, 229, 196, 0.38)",

    roadEdge: "rgba(255, 255, 255, 0.22)",
    roadEdgeShadow: "rgba(0, 0, 0, 0.34)",

    rumbleA: "#7d5dff",
    rumbleB: "#ece6ff",

    sideNear: "#121425",
    sideFar: "#242a4c",
    sideAlt: "#1a1d35",

    shoulderGlow: "rgba(188, 156, 255, 0.13)",
    textureLine: "rgba(221, 215, 255, 0.09)",
    textureShade: "rgba(0, 0, 0, 0.26)",
  },
};

export const HOME_DRIVE_ROAD_PROFILES = {
  boulevard: BOULEVARD_PROFILE,
  avenue: AVENUE_PROFILE,
  "urban-core": URBAN_CORE_PROFILE,
  corridor: CORRIDOR_PROFILE,
} as const;

function withProfileOverrides(
  profile: HomeDriveRoadProfile,
  overrides: HomeDriveRoadProfileOverrides,
): HomeDriveRoadProfile {
  const { palette, ...profileOverrides } = overrides;

  return {
    ...profile,
    ...profileOverrides,
    palette: {
      ...profile.palette,
      ...(palette ?? {}),
    },
  };
}

export function getHomeDriveRoadProfile(
  routeSegment: HomeDriveRouteSegment,
): HomeDriveRoadProfile {
  const base = HOME_DRIVE_ROAD_PROFILES[routeSegment.roadTone];

  if (routeSegment.ambience === "coast") {
    return withProfileOverrides(base, {
      defaultShoulderStyle: "coast-sand",
      shoulderGlow: "rgba(255, 206, 138, 0.1)",
      borderTop: "rgba(255,255,255,0.1)",
      horizonY: 12,
      horizonRoadWidth: Math.max(base.horizonRoadWidth, 36),
      baseRoadWidth: Math.max(base.baseRoadWidth, 164),
      rumbleWidth: Math.max(base.rumbleWidth, 7.4),
      shoulderWidth: Math.max(base.shoulderWidth, 21),
      textureOpacity: 0.3,
      palette: {
        sideNear: "#d9bd78",
        sideFar: "#f3d48d",
        sideAlt: "#cba85f",
        shoulderGlow: "rgba(255, 206, 138, 0.18)",
      },
    });
  }

  if (routeSegment.ambience === "nightlife") {
    return withProfileOverrides(base, {
      defaultShoulderStyle: "urban-dark",
      shoulderGlow: "rgba(255, 160, 112, 0.08)",
      horizonRoadWidth: Math.max(base.horizonRoadWidth, 34),
      baseRoadWidth: Math.max(base.baseRoadWidth, 158),
      rumbleWidth: Math.max(base.rumbleWidth, 7),
      shoulderWidth: Math.max(base.shoulderWidth, 20),
      textureOpacity: 0.42,
      palette: {
        rumbleA: "#ff6a4a",
        rumbleB: "#ffe0c8",
        sideNear: "#21141c",
        sideFar: "#382130",
        sideAlt: "#2b1824",
        shoulderGlow: "rgba(255, 146, 102, 0.16)",
      },
    });
  }

  if (routeSegment.ambience === "stadium") {
    return withProfileOverrides(base, {
      defaultShoulderStyle: "stadium-night",
      shoulderGlow: "rgba(188, 156, 255, 0.08)",
      horizonRoadWidth: Math.max(base.horizonRoadWidth, 34),
      baseRoadWidth: Math.max(base.baseRoadWidth, 160),
      rumbleWidth: Math.max(base.rumbleWidth, 7.2),
      shoulderWidth: Math.max(base.shoulderWidth, 20),
      textureOpacity: 0.48,
      edgeLightOpacity: 0.48,
      palette: {
        rumbleA: "#7d5dff",
        rumbleB: "#efe8ff",
        sideNear: "#101326",
        sideFar: "#252a52",
        sideAlt: "#191d38",
        shoulderGlow: "rgba(188, 156, 255, 0.16)",
      },
    });
  }

  return base;
}
