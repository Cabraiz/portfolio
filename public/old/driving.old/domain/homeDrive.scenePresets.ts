import type { HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";
import type { HomeDriveSkyMood } from "./homeDrive.types";

export type HomeDriveScenePreset = Readonly<{
  id:
    | "coast"
    | "nightlife"
    | "downtown"
    | "academic"
    | "residential"
    | "stadium";
  skyMood: HomeDriveSkyMood;
  skyGlow: string;
  haze: string;
  buildingTint: string;
  windowTint: string;
  roadsideAccent: string;
  roadsideGlow: string;
  landmarkLabelBackground: string;
  landmarkLabelText: string;
  dashboardTint: string;
  glassReflection: string;
  skylineOpacity: number;
  roadsideDensity: number;
  ambientNoiseOpacity: number;
}>;

const COAST_PRESET: HomeDriveScenePreset = {
  id: "coast",
  skyMood: "afternoon",
  skyGlow: "rgba(255, 194, 122, 0.22)",
  haze: "rgba(91, 136, 188, 0.12)",
  buildingTint:
    "linear-gradient(180deg, rgba(38,45,58,0.92), rgba(10,12,18,0.98))",
  windowTint: "rgba(255, 220, 168, 0.12)",
  roadsideAccent: "rgba(255, 208, 138, 0.72)",
  roadsideGlow: "rgba(255, 196, 126, 0.12)",
  landmarkLabelBackground: "rgba(6, 10, 14, 0.72)",
  landmarkLabelText: "#f5ead6",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 14%, rgba(8,8,10,0.52) 15%, rgba(12,12,14,0.95) 45%, rgba(6,6,7,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 36%, rgba(255,255,255,0) 100%)",
  skylineOpacity: 0.62,
  roadsideDensity: 1,
  ambientNoiseOpacity: 0.08,
};

const NIGHTLIFE_PRESET: HomeDriveScenePreset = {
  id: "nightlife",
  skyMood: "night",
  skyGlow: "rgba(255, 164, 96, 0.2)",
  haze: "rgba(116, 136, 188, 0.1)",
  buildingTint:
    "linear-gradient(180deg, rgba(46,33,48,0.92), rgba(12,10,16,0.98))",
  windowTint: "rgba(255, 165, 115, 0.14)",
  roadsideAccent: "rgba(255, 167, 116, 0.72)",
  roadsideGlow: "rgba(255, 146, 102, 0.18)",
  landmarkLabelBackground: "rgba(14, 8, 12, 0.72)",
  landmarkLabelText: "#f7e4da",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 14%, rgba(12,8,10,0.54) 15%, rgba(18,12,16,0.95) 45%, rgba(7,5,8,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(255,216,190,0.08), rgba(255,216,190,0.02) 36%, rgba(255,216,190,0) 100%)",
  skylineOpacity: 0.66,
  roadsideDensity: 1.1,
  ambientNoiseOpacity: 0.09,
};

const DOWNTOWN_PRESET: HomeDriveScenePreset = {
  id: "downtown",
  skyMood: "sunset",
  skyGlow: "rgba(218, 171, 109, 0.14)",
  haze: "rgba(119, 128, 150, 0.08)",
  buildingTint:
    "linear-gradient(180deg, rgba(42,42,46,0.94), rgba(10,10,12,0.99))",
  windowTint: "rgba(255, 240, 184, 0.08)",
  roadsideAccent: "rgba(214, 182, 122, 0.72)",
  roadsideGlow: "rgba(214, 182, 122, 0.12)",
  landmarkLabelBackground: "rgba(10, 10, 12, 0.76)",
  landmarkLabelText: "#f3ede0",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 14%, rgba(10,10,12,0.54) 15%, rgba(14,14,16,0.96) 45%, rgba(6,6,7,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015) 36%, rgba(255,255,255,0) 100%)",
  skylineOpacity: 0.7,
  roadsideDensity: 0.92,
  ambientNoiseOpacity: 0.07,
};

const ACADEMIC_PRESET: HomeDriveScenePreset = {
  id: "academic",
  skyMood: "afternoon",
  skyGlow: "rgba(209, 171, 108, 0.14)",
  haze: "rgba(102, 120, 92, 0.08)",
  buildingTint:
    "linear-gradient(180deg, rgba(44,40,36,0.94), rgba(12,10,10,0.99))",
  windowTint: "rgba(255, 229, 174, 0.08)",
  roadsideAccent: "rgba(202, 172, 104, 0.72)",
  roadsideGlow: "rgba(202, 172, 104, 0.12)",
  landmarkLabelBackground: "rgba(14, 12, 10, 0.76)",
  landmarkLabelText: "#f3ead8",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 14%, rgba(12,10,8,0.54) 15%, rgba(16,14,12,0.96) 45%, rgba(7,6,5,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(255,244,220,0.06), rgba(255,244,220,0.015) 36%, rgba(255,244,220,0) 100%)",
  skylineOpacity: 0.58,
  roadsideDensity: 0.86,
  ambientNoiseOpacity: 0.06,
};

const RESIDENTIAL_PRESET: HomeDriveScenePreset = {
  id: "residential",
  skyMood: "afternoon",
  skyGlow: "rgba(196, 176, 124, 0.16)",
  haze: "rgba(114, 137, 113, 0.08)",
  buildingTint:
    "linear-gradient(180deg, rgba(36,40,39,0.94), rgba(10,12,12,0.99))",
  windowTint: "rgba(255, 230, 175, 0.08)",
  roadsideAccent: "rgba(176, 196, 120, 0.72)",
  roadsideGlow: "rgba(176, 196, 120, 0.1)",
  landmarkLabelBackground: "rgba(10, 12, 10, 0.76)",
  landmarkLabelText: "#eef0df",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 14%, rgba(8,10,8,0.54) 15%, rgba(12,14,12,0.96) 45%, rgba(6,7,6,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015) 36%, rgba(255,255,255,0) 100%)",
  skylineOpacity: 0.56,
  roadsideDensity: 0.9,
  ambientNoiseOpacity: 0.05,
};

const STADIUM_PRESET: HomeDriveScenePreset = {
  id: "stadium",
  skyMood: "night",
  skyGlow: "rgba(175, 126, 255, 0.18)",
  haze: "rgba(122, 118, 182, 0.1)",
  buildingTint:
    "linear-gradient(180deg, rgba(35,35,49,0.94), rgba(10,10,14,0.99))",
  windowTint: "rgba(214, 196, 255, 0.1)",
  roadsideAccent: "rgba(198, 164, 255, 0.72)",
  roadsideGlow: "rgba(180, 146, 255, 0.14)",
  landmarkLabelBackground: "rgba(12, 10, 18, 0.76)",
  landmarkLabelText: "#efe7ff",
  dashboardTint:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 14%, rgba(10,8,14,0.54) 15%, rgba(14,12,18,0.96) 45%, rgba(7,6,10,1) 100%)",
  glassReflection:
    "linear-gradient(180deg, rgba(232,224,255,0.08), rgba(232,224,255,0.02) 36%, rgba(232,224,255,0) 100%)",
  skylineOpacity: 0.6,
  roadsideDensity: 0.82,
  ambientNoiseOpacity: 0.08,
};

export const HOME_DRIVE_SCENE_PRESETS = {
  coast: COAST_PRESET,
  nightlife: NIGHTLIFE_PRESET,
  downtown: DOWNTOWN_PRESET,
  academic: ACADEMIC_PRESET,
  residential: RESIDENTIAL_PRESET,
  stadium: STADIUM_PRESET,
} as const;

export function getHomeDriveScenePreset(
  routeSegment: HomeDriveRouteSegment,
): HomeDriveScenePreset {
  return HOME_DRIVE_SCENE_PRESETS[routeSegment.ambience];
}
