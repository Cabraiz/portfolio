// src/pages/Mateus/Live/domain/liveHero.tokens.ts

import type { LiveMetricId, LiveMetricTone } from "./live.types";

export type LiveHeroBillboardCounterDefinition = Readonly<{
  id: LiveMetricId;
  eyebrow: string;
  label: string;
  shortLabel: string;
  description: string;
  tone: LiveMetricTone;
}>;

export type LiveHeroBillboardTokens = Readonly<{
  digits: number;
  laneOrder: readonly LiveMetricId[];
  hoverTiltDeg: number;
  pulseOpacity: number;
  gridLineOpacity: number;
  dimensions: Readonly<{
    minHeight: string;
    maxWidth: string;
    compactMaxWidth: string;
    borderRadius: string;
    laneMinHeight: string;
  }>;
  spacing: Readonly<{
    padding: string;
    compactPadding: string;
    gap: string;
    compactGap: string;
    laneGap: string;
  }>;
  typography: Readonly<{
    livePillSize: string;
    eyebrowSize: string;
    labelSize: string;
    valueSize: string;
    compactValueSize: string;
    footerSize: string;
    descriptionSize: string;
    trackingWide: string;
    trackingWider: string;
    valueTracking: string;
  }>;
  surface: Readonly<{
    border: string;
    background: string;
    shadow: string;
    innerGlow: string;
    scanline: string;
    laneBackground: string;
    laneBorder: string;
  }>;
}>;

export const LIVE_HERO_BILLBOARD_LANE_ORDER = [
  "projects-active",
] as const satisfies readonly LiveMetricId[];

export const LIVE_HERO_BILLBOARD_COUNTERS =
  [
    {
      id: "projects-active",
      eyebrow: "em andamento",
      label: "Projetos em andamento",
      shortLabel: "Andamento",
      description: "Projetos ativos agora.",
      tone: "info",
    },
  ] as const satisfies readonly LiveHeroBillboardCounterDefinition[];

export const LIVE_HERO_BILLBOARD_DEFAULT_COUNTER_ID =
  LIVE_HERO_BILLBOARD_LANE_ORDER[0];

export const LIVE_HERO_BILLBOARD_TOKENS = {
  digits: 4,

  laneOrder: LIVE_HERO_BILLBOARD_LANE_ORDER,

  hoverTiltDeg: 2.1,
  pulseOpacity: 0.82,
  gridLineOpacity: 0.14,

  dimensions: {
    minHeight: "clamp(220px, 22vw, 300px)",
    maxWidth: "100%",
    compactMaxWidth: "100%",
    borderRadius: "28px",
    laneMinHeight: "clamp(164px, 19vw, 248px)",
  },

  spacing: {
    padding: "clamp(18px, 2vw, 24px)",
    compactPadding: "18px",
    gap: "16px",
    compactGap: "12px",
    laneGap: "clamp(16px, 1.6vw, 22px)",
  },

  typography: {
    livePillSize: "0.68rem",
    eyebrowSize: "0.78rem",
    labelSize: "0.92rem",
    valueSize: "clamp(4.4rem, 9.2vw, 7rem)",
    compactValueSize: "clamp(3.4rem, 8vw, 5.4rem)",
    footerSize: "0.72rem",
    descriptionSize: "0.82rem",
    trackingWide: "0.16em",
    trackingWider: "0.22em",
    valueTracking: "-0.06em",
  },

  surface: {
    border: "1px solid rgba(96, 165, 250, 0.24)",
    background:
      "linear-gradient(180deg, rgba(10, 17, 28, 0.96), rgba(5, 9, 16, 0.98))",
    shadow: "0 24px 64px rgba(0, 0, 0, 0.34)",
    innerGlow:
      "radial-gradient(circle at 50% 18%, rgba(96, 165, 250, 0.18), transparent 56%)",
    scanline:
      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 22%)",
    laneBackground:
      "linear-gradient(180deg, rgba(255,255,255,0.018), rgba(255,255,255,0.006)), linear-gradient(180deg, rgba(8,13,22,0.72), rgba(5,8,14,0.90))",
    laneBorder: "1px solid rgba(255, 255, 255, 0.08)",
  },
} as const satisfies LiveHeroBillboardTokens;
