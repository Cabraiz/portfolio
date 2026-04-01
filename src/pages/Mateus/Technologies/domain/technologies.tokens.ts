// src/pages/Mateus/Technologies/domain/technologies.tokens.ts

import type {
  TechnologyCategoryId,
  TechnologyShapeVariant,
} from "./technologies.types";

export type TechnologyCategoryAccentToken = Readonly<{
  background: string;
  backgroundSoft: string;
  border: string;
  text: string;
  accent: string;
  glow: string;
}>;

export type TechnologyHexGridTokens = Readonly<{
  columns: number;
  itemMinWidth: number;
  itemHeight: number;
  gapX: number;
  gapY: number;
  staggerOffsetY: number;
}>;

export type TechnologySurfaceTokens = Readonly<{
  radius: string;
  borderWidth: string;
  shadowRest: string;
  shadowHover: string;
  shadowActive: string;
  transition: string;
}>;

export type TechnologySpotlightTokens = Readonly<{
  panelMinHeight: string;
  panelRadius: string;
  mediaRadius: string;
  contentGap: string;
}>;

export const TECHNOLOGY_SHAPE_RADII: Readonly<
  Record<TechnologyShapeVariant, string>
> = {
  hex: "28px",
  "rounded-hex": "32px",
  pill: "999px",
  panel: "30px",
};

export const TECHNOLOGY_CATEGORY_ACCENTS: Readonly<
  Record<TechnologyCategoryId, TechnologyCategoryAccentToken>
> = {
  cloud: {
    background: "linear-gradient(180deg, rgba(14, 25, 42, 0.96), rgba(9, 17, 30, 0.98))",
    backgroundSoft: "rgba(96, 165, 250, 0.10)",
    border: "rgba(96, 165, 250, 0.28)",
    text: "rgba(239, 246, 255, 0.96)",
    accent: "#60a5fa",
    glow: "0 18px 44px rgba(96, 165, 250, 0.18)",
  },
  frontend: {
    background: "linear-gradient(180deg, rgba(25, 15, 42, 0.96), rgba(17, 10, 28, 0.98))",
    backgroundSoft: "rgba(192, 132, 252, 0.11)",
    border: "rgba(192, 132, 252, 0.26)",
    text: "rgba(250, 245, 255, 0.96)",
    accent: "#c084fc",
    glow: "0 18px 44px rgba(192, 132, 252, 0.16)",
  },
  "backend-jvm": {
    background: "linear-gradient(180deg, rgba(35, 21, 16, 0.96), rgba(23, 13, 10, 0.98))",
    backgroundSoft: "rgba(251, 146, 60, 0.10)",
    border: "rgba(251, 146, 60, 0.24)",
    text: "rgba(255, 247, 237, 0.96)",
    accent: "#fb923c",
    glow: "0 18px 44px rgba(251, 146, 60, 0.15)",
  },
  "backend-js": {
    background: "linear-gradient(180deg, rgba(31, 31, 16, 0.96), rgba(20, 20, 10, 0.98))",
    backgroundSoft: "rgba(250, 204, 21, 0.10)",
    border: "rgba(250, 204, 21, 0.24)",
    text: "rgba(254, 252, 232, 0.96)",
    accent: "#facc15",
    glow: "0 18px 44px rgba(250, 204, 21, 0.14)",
  },
  python: {
    background: "linear-gradient(180deg, rgba(14, 32, 24, 0.96), rgba(9, 21, 16, 0.98))",
    backgroundSoft: "rgba(74, 222, 128, 0.10)",
    border: "rgba(74, 222, 128, 0.24)",
    text: "rgba(240, 253, 244, 0.96)",
    accent: "#4ade80",
    glow: "0 18px 44px rgba(74, 222, 128, 0.14)",
  },
  data: {
    background: "linear-gradient(180deg, rgba(10, 31, 36, 0.96), rgba(8, 21, 24, 0.98))",
    backgroundSoft: "rgba(34, 211, 238, 0.10)",
    border: "rgba(34, 211, 238, 0.24)",
    text: "rgba(236, 254, 255, 0.96)",
    accent: "#22d3ee",
    glow: "0 18px 44px rgba(34, 211, 238, 0.14)",
  },
  qa: {
    background: "linear-gradient(180deg, rgba(34, 20, 34, 0.96), rgba(23, 12, 23, 0.98))",
    backgroundSoft: "rgba(244, 114, 182, 0.10)",
    border: "rgba(244, 114, 182, 0.24)",
    text: "rgba(253, 242, 248, 0.96)",
    accent: "#f472b6",
    glow: "0 18px 44px rgba(244, 114, 182, 0.14)",
  },
  observability: {
    background: "linear-gradient(180deg, rgba(22, 27, 36, 0.96), rgba(14, 18, 25, 0.98))",
    backgroundSoft: "rgba(148, 163, 184, 0.11)",
    border: "rgba(148, 163, 184, 0.24)",
    text: "rgba(248, 250, 252, 0.96)",
    accent: "#94a3b8",
    glow: "0 18px 44px rgba(148, 163, 184, 0.16)",
  },
};

export const TECHNOLOGY_HEX_GRID_DESKTOP_TOKENS: TechnologyHexGridTokens = {
  columns: 4,
  itemMinWidth: 208,
  itemHeight: 188,
  gapX: 18,
  gapY: 18,
  staggerOffsetY: 104,
};

export const TECHNOLOGY_HEX_GRID_MOBILE_TOKENS: TechnologyHexGridTokens = {
  columns: 1,
  itemMinWidth: 0,
  itemHeight: 148,
  gapX: 12,
  gapY: 12,
  staggerOffsetY: 0,
};

export const TECHNOLOGY_SURFACE_TOKENS: TechnologySurfaceTokens = {
  radius: "30px",
  borderWidth: "1px",
  shadowRest: "0 8px 24px rgba(15, 23, 42, 0.16)",
  shadowHover: "0 18px 40px rgba(15, 23, 42, 0.22)",
  shadowActive: "0 26px 52px rgba(15, 23, 42, 0.28)",
  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, opacity 180ms ease",
};

export const TECHNOLOGY_SPOTLIGHT_TOKENS: TechnologySpotlightTokens = {
  panelMinHeight: "420px",
  panelRadius: "34px",
  mediaRadius: "24px",
  contentGap: "18px",
};
