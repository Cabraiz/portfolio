import type { HomeDriveAmbience, HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";

export type HomeDriveSkyMood = "afternoon" | "sunset" | "night";

export type HomeDriveSkyPreset = Readonly<{
  id: HomeDriveSkyMood;
  label: string;

  top: string;
  upper: string;
  middle: string;
  horizon: string;
  lower: string;

  sun: string;
  sunShadow: string;
  sunGlow: string;
  moon: string;
  moonShade: string;

  cloud: string;
  cloudShade: string;
  cloudAccent: string;

  star: string;
  starDim: string;
  pixelDust: string;

  vignette: string;
  haze: string;
  horizonGlow: string;

  sunOpacity: number;
  moonOpacity: number;
  starOpacity: number;
  cloudOpacity: number;
  dustOpacity: number;
  contrastOpacity: number;
}>;

export type HomeDriveSkyCssVars = Readonly<{
  "--home-drive-sky-top": string;
  "--home-drive-sky-upper": string;
  "--home-drive-sky-middle": string;
  "--home-drive-sky-horizon": string;
  "--home-drive-sky-lower": string;

  "--home-drive-sky-sun": string;
  "--home-drive-sky-sun-shadow": string;
  "--home-drive-sky-sun-glow": string;
  "--home-drive-sky-moon": string;
  "--home-drive-sky-moon-shade": string;

  "--home-drive-sky-cloud": string;
  "--home-drive-sky-cloud-shade": string;
  "--home-drive-sky-cloud-accent": string;

  "--home-drive-sky-star": string;
  "--home-drive-sky-star-dim": string;
  "--home-drive-sky-pixel-dust": string;

  "--home-drive-sky-vignette": string;
  "--home-drive-sky-haze": string;
  "--home-drive-sky-horizon-glow": string;

  "--home-drive-sky-sun-opacity": number;
  "--home-drive-sky-moon-opacity": number;
  "--home-drive-sky-star-opacity": number;
  "--home-drive-sky-cloud-opacity": number;
  "--home-drive-sky-dust-opacity": number;
  "--home-drive-sky-contrast-opacity": number;
}>;

export const HOME_DRIVE_SKY_AFTERNOON_PRESET: HomeDriveSkyPreset = {
  id: "afternoon",
  label: "Tarde",

  top: "#4ca7ff",
  upper: "#63c1ff",
  middle: "#8bdcff",
  horizon: "#ffd58c",
  lower: "#f7a95e",

  sun: "#fff0a8",
  sunShadow: "#ffb25f",
  sunGlow: "rgba(255, 215, 132, 0.34)",
  moon: "#f3ead2",
  moonShade: "#b7c3db",

  cloud: "#fff4d6",
  cloudShade: "#f3c67f",
  cloudAccent: "#ffe5af",

  star: "#ffffff",
  starDim: "#d8e6ff",
  pixelDust: "rgba(255, 244, 210, 0.34)",

  vignette: "rgba(20, 34, 56, 0.18)",
  haze: "rgba(255, 226, 166, 0.18)",
  horizonGlow: "rgba(255, 196, 108, 0.38)",

  sunOpacity: 1,
  moonOpacity: 0,
  starOpacity: 0,
  cloudOpacity: 0.92,
  dustOpacity: 0.16,
  contrastOpacity: 0.1,
};

export const HOME_DRIVE_SKY_SUNSET_PRESET: HomeDriveSkyPreset = {
  id: "sunset",
  label: "Pôr do sol",

  top: "#27305f",
  upper: "#55406f",
  middle: "#b6576e",
  horizon: "#ffae63",
  lower: "#d96848",

  sun: "#ffdb7a",
  sunShadow: "#ff7848",
  sunGlow: "rgba(255, 138, 82, 0.38)",
  moon: "#f3ead2",
  moonShade: "#b7c3db",

  cloud: "#ffd08c",
  cloudShade: "#9f405e",
  cloudAccent: "#ff9d68",

  star: "#fff6d7",
  starDim: "#d8ddff",
  pixelDust: "rgba(255, 204, 145, 0.32)",

  vignette: "rgba(13, 12, 30, 0.32)",
  haze: "rgba(255, 149, 92, 0.19)",
  horizonGlow: "rgba(255, 127, 76, 0.42)",

  sunOpacity: 0.9,
  moonOpacity: 0,
  starOpacity: 0.16,
  cloudOpacity: 0.82,
  dustOpacity: 0.18,
  contrastOpacity: 0.18,
};

export const HOME_DRIVE_SKY_NIGHT_PRESET: HomeDriveSkyPreset = {
  id: "night",
  label: "Noite",

  top: "#050816",
  upper: "#091126",
  middle: "#101a3a",
  horizon: "#25204a",
  lower: "#120e24",

  sun: "#000000",
  sunShadow: "#000000",
  sunGlow: "rgba(0, 0, 0, 0)",
  moon: "#f5e8c8",
  moonShade: "#9ba8c7",

  cloud: "#2e385f",
  cloudShade: "#12172d",
  cloudAccent: "#56618f",

  star: "#fff7d7",
  starDim: "#b8c8ff",
  pixelDust: "rgba(166, 190, 255, 0.34)",

  vignette: "rgba(0, 0, 0, 0.48)",
  haze: "rgba(112, 126, 188, 0.13)",
  horizonGlow: "rgba(91, 76, 170, 0.34)",

  sunOpacity: 0,
  moonOpacity: 1,
  starOpacity: 0.9,
  cloudOpacity: 0.44,
  dustOpacity: 0.21,
  contrastOpacity: 0.38,
};

export const HOME_DRIVE_SKY_PRESETS = {
  afternoon: HOME_DRIVE_SKY_AFTERNOON_PRESET,
  sunset: HOME_DRIVE_SKY_SUNSET_PRESET,
  night: HOME_DRIVE_SKY_NIGHT_PRESET,
} as const;

export function clampHomeDriveSkyProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value > 1) {
    return Math.max(0, Math.min(1, value / 100));
  }

  return Math.max(0, Math.min(1, value));
}

export function getHomeDriveSkyMoodByProgress(progress: number): HomeDriveSkyMood {
  const normalizedProgress = clampHomeDriveSkyProgress(progress);

  if (normalizedProgress >= 0.68) {
    return "night";
  }

  if (normalizedProgress >= 0.42) {
    return "sunset";
  }

  return "afternoon";
}

export function getHomeDriveSkyMoodByAmbience(
  ambience: HomeDriveAmbience,
): HomeDriveSkyMood {
  switch (ambience) {
    case "nightlife":
    case "stadium":
      return "night";

    case "downtown":
      return "sunset";

    case "coast":
    case "academic":
    case "residential":
    default:
      return "afternoon";
  }
}

export function getHomeDriveSkyMood(
  routeSegment: HomeDriveRouteSegment,
  routeProgress: number,
): HomeDriveSkyMood {
  const progressMood = getHomeDriveSkyMoodByProgress(routeProgress);
  const ambienceMood = getHomeDriveSkyMoodByAmbience(routeSegment.ambience);

  if (progressMood === "night" || ambienceMood === "night") {
    return "night";
  }

  if (progressMood === "sunset" || ambienceMood === "sunset") {
    return "sunset";
  }

  return "afternoon";
}

export function getHomeDriveSkyPreset(
  routeSegment: HomeDriveRouteSegment,
  routeProgress: number,
): HomeDriveSkyPreset {
  return HOME_DRIVE_SKY_PRESETS[getHomeDriveSkyMood(routeSegment, routeProgress)];
}

export function getHomeDriveSkyCssVars(
  preset: HomeDriveSkyPreset,
): HomeDriveSkyCssVars {
  return {
    "--home-drive-sky-top": preset.top,
    "--home-drive-sky-upper": preset.upper,
    "--home-drive-sky-middle": preset.middle,
    "--home-drive-sky-horizon": preset.horizon,
    "--home-drive-sky-lower": preset.lower,

    "--home-drive-sky-sun": preset.sun,
    "--home-drive-sky-sun-shadow": preset.sunShadow,
    "--home-drive-sky-sun-glow": preset.sunGlow,
    "--home-drive-sky-moon": preset.moon,
    "--home-drive-sky-moon-shade": preset.moonShade,

    "--home-drive-sky-cloud": preset.cloud,
    "--home-drive-sky-cloud-shade": preset.cloudShade,
    "--home-drive-sky-cloud-accent": preset.cloudAccent,

    "--home-drive-sky-star": preset.star,
    "--home-drive-sky-star-dim": preset.starDim,
    "--home-drive-sky-pixel-dust": preset.pixelDust,

    "--home-drive-sky-vignette": preset.vignette,
    "--home-drive-sky-haze": preset.haze,
    "--home-drive-sky-horizon-glow": preset.horizonGlow,

    "--home-drive-sky-sun-opacity": preset.sunOpacity,
    "--home-drive-sky-moon-opacity": preset.moonOpacity,
    "--home-drive-sky-star-opacity": preset.starOpacity,
    "--home-drive-sky-cloud-opacity": preset.cloudOpacity,
    "--home-drive-sky-dust-opacity": preset.dustOpacity,
    "--home-drive-sky-contrast-opacity": preset.contrastOpacity,
  };
}
