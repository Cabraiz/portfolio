// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboard.types.ts

import type { CSSProperties } from "react";

import type {
  LiveMetricId,
  LiveMetricSnapshot,
  LiveMetricTone,
  LiveProjectAggregate,
} from "../../../domain/live.types";

export type LiveHeroBillboardProps = Readonly<{
  className?: string;
  metrics?: readonly LiveMetricSnapshot[];
  summary?: LiveProjectAggregate;
  isRunning?: boolean;
  compact?: boolean;
  autoRotate?: boolean;
  pauseOnHover?: boolean;
  rotationIntervalMs?: number;
  initialCounterId?: LiveMetricId;
  accentColor?: string;
}>;

export type LiveHeroLane = Readonly<{
  id: LiveMetricId;
  eyebrow: string;
  label: string;
  value: number;
  formattedValue: string;
  tone: LiveMetricTone;
  accent: string;
  ariaLabel: string;
}>;

export type BillboardCssVariables = CSSProperties & {
  "--live-hero-accent"?: string;
  "--live-hero-billboard-min-height"?: string;
  "--live-hero-billboard-max-width"?: string;
  "--live-hero-billboard-compact-max-width"?: string;
  "--live-hero-billboard-radius"?: string;
  "--live-hero-billboard-padding"?: string;
  "--live-hero-value-size"?: string;
  "--live-hero-marquee-duration"?: string;
};

export type DigitSlotCssVariables = CSSProperties & {
  "--digit-flicker-delay"?: string;
};

export type LiveHeroBillboardMarqueeClassNames = Readonly<{
  header: string;
  marqueeViewport: string;
  marqueeTrack: string;
  marqueeWord: string;
}>;

export type LiveHeroBillboardCounterClassNames = Readonly<{
  counter: string;
  digitSlot: string;
  digitGlyph: string;
}>;

export type LiveHeroBillboardMarqueeProps = Readonly<{
  lane: LiveHeroLane;
  copyCount?: number;
  classNames: LiveHeroBillboardMarqueeClassNames;
}>;

export type LiveHeroBillboardCounterProps = Readonly<{
  lane: LiveHeroLane;
  digits: readonly string[];
  classNames: LiveHeroBillboardCounterClassNames;
}>;
