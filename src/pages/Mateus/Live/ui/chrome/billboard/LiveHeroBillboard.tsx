// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboard.tsx

import { useMemo } from "react";

import { useLiveMetrics } from "../../../application/useLiveMetrics";
import { LIVE_METRIC_DEFAULT_ACCENTS } from "../../../domain/live.constants";
import {
  LIVE_HERO_BILLBOARD_COUNTERS,
  LIVE_HERO_BILLBOARD_DEFAULT_COUNTER_ID,
  LIVE_HERO_BILLBOARD_TOKENS,
} from "../../../domain/liveHero.tokens";
import type {
  LiveMetricId,
  LiveMetricSnapshot,
  LiveMetricTone,
  LiveProjectAggregate,
} from "../../../domain/live.types";
import LiveHeroBillboardCounter from "./LiveHeroBillboardCounter";
import LiveHeroBillboardMarquee from "./LiveHeroBillboardMarquee";
import LiveHeroBillboardScreen from "./LiveHeroBillboardScreen";
import type {
  BillboardCssVariables,
  LiveHeroBillboardCounterClassNames,
  LiveHeroBillboardMarqueeClassNames,
  LiveHeroBillboardProps,
  LiveHeroLane,
} from "./LiveHeroBillboard.types";
import rootStyles from "./styles/LiveHeroBillboardRoot.module.css";
import screenStyles from "./styles/LiveHeroBillboardScreen.module.css";
import marqueeStyles from "./styles/LiveHeroBillboardMarquee.module.css";
import counterStyles from "./styles/LiveHeroBillboardCounter.module.css";
import "./styles/LiveHeroBillboardMotion.module.css";
import "./styles/LiveHeroBillboardResponsive.module.css";

function resolveAccentColor(tone: LiveMetricTone, explicit?: string): string {
  if (explicit) {
    return explicit;
  }

  return LIVE_METRIC_DEFAULT_ACCENTS[tone];
}

function formatFixedDigits(
  value: number,
  minDigits = LIVE_HERO_BILLBOARD_TOKENS.digits,
): string {
  const normalizedValue = Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;

  return String(normalizedValue).padStart(minDigits, "0");
}

function resolveCounterDefinition(metricId: LiveMetricId) {
  return (
    LIVE_HERO_BILLBOARD_COUNTERS.find((counter) => counter.id === metricId) ??
    LIVE_HERO_BILLBOARD_COUNTERS[0]
  );
}

function resolveMetricSnapshot(
  metricId: LiveMetricId,
  metrics: readonly LiveMetricSnapshot[],
  summary?: LiveProjectAggregate,
): LiveMetricSnapshot | null {
  const metric = metrics.find((item) => item.id === metricId);

  if (metric) {
    return metric;
  }

  if (!summary || metricId !== LIVE_HERO_BILLBOARD_DEFAULT_COUNTER_ID) {
    return null;
  }

  const counterDefinition = resolveCounterDefinition(metricId);

  return {
    id: metricId,
    label: counterDefinition.label,
    shortLabel: counterDefinition.shortLabel,
    description:
      "Projetos ativos agora, em execução ou evolução contínua.",
    value: summary.activeProjects,
    formattedValue: formatFixedDigits(summary.activeProjects),
    tone: counterDefinition.tone,
    emphasis: "hero",
    trendDirection: "steady",
    interactive: false,
    ariaLabel: `${counterDefinition.label}: ${summary.activeProjects}`,
  };
}

function resolveLaneContent(
  metricId: LiveMetricId,
  snapshot: LiveMetricSnapshot | null,
  accentColor?: string,
): LiveHeroLane {
  const counterDefinition = resolveCounterDefinition(metricId);
  const value = snapshot?.value ?? 0;
  const tone: LiveMetricTone = snapshot?.tone ?? counterDefinition.tone;
  const label = snapshot?.label ?? counterDefinition.label;

  return {
    id: metricId,
    eyebrow: counterDefinition.eyebrow.toUpperCase(),
    label,
    value,
    formattedValue: formatFixedDigits(value),
    tone,
    accent: resolveAccentColor(tone, accentColor),
    ariaLabel: snapshot?.ariaLabel ?? `${label}: ${value}`,
  };
}

export default function LiveHeroBillboard({
  className,
  metrics,
  summary,
  isRunning,
  compact = false,
  initialCounterId = LIVE_HERO_BILLBOARD_DEFAULT_COUNTER_ID,
  accentColor,
}: LiveHeroBillboardProps) {
  const metricsState = useLiveMetrics();

  const resolvedMetrics = metrics ?? metricsState.snapshots;
  const resolvedSummary = summary ?? metricsState.summary;
  const resolvedIsRunning = isRunning ?? metricsState.isRunning;

  const lane = useMemo<LiveHeroLane>(() => {
    const snapshot = resolveMetricSnapshot(
      initialCounterId,
      resolvedMetrics,
      resolvedSummary,
    );

    return resolveLaneContent(initialCounterId, snapshot, accentColor);
  }, [accentColor, initialCounterId, resolvedMetrics, resolvedSummary]);

  const digits = useMemo(
    () =>
      formatFixedDigits(lane.value, LIVE_HERO_BILLBOARD_TOKENS.digits).split(""),
    [lane.value],
  );

  const style = useMemo<BillboardCssVariables>(() => {
    return {
      "--live-hero-accent": lane.accent,
      "--live-hero-billboard-min-height":
        LIVE_HERO_BILLBOARD_TOKENS.dimensions.minHeight,
      "--live-hero-billboard-max-width":
        LIVE_HERO_BILLBOARD_TOKENS.dimensions.maxWidth,
      "--live-hero-billboard-compact-max-width":
        LIVE_HERO_BILLBOARD_TOKENS.dimensions.compactMaxWidth,
      "--live-hero-billboard-radius":
        LIVE_HERO_BILLBOARD_TOKENS.dimensions.borderRadius,
      "--live-hero-billboard-padding": compact
        ? LIVE_HERO_BILLBOARD_TOKENS.spacing.compactPadding
        : LIVE_HERO_BILLBOARD_TOKENS.spacing.padding,
      "--live-hero-value-size": compact
        ? LIVE_HERO_BILLBOARD_TOKENS.typography.compactValueSize
        : LIVE_HERO_BILLBOARD_TOKENS.typography.valueSize,
      "--live-hero-marquee-duration": compact ? "9.5s" : "11.5s",
    };
  }, [compact, lane.accent]);

  const marqueeClassNames = useMemo<LiveHeroBillboardMarqueeClassNames>(
    () => ({
      header: screenStyles.header,
      marqueeViewport: marqueeStyles.marqueeViewport,
      marqueeTrack: marqueeStyles.marqueeTrack,
      marqueeWord: marqueeStyles.marqueeWord,
    }),
    [],
  );

  const counterClassNames = useMemo<LiveHeroBillboardCounterClassNames>(
    () => ({
      counter: counterStyles.counter,
      digitSlot: counterStyles.digitSlot,
      digitGlyph: counterStyles.digitGlyph,
    }),
    [],
  );

  return (
    <LiveHeroBillboardScreen
      className={className}
      compact={compact}
      isRunning={resolvedIsRunning}
      lane={lane}
      style={style}
      classNames={{
        root: `${rootStyles.root} ${screenStyles.root}`,
        compact: rootStyles.compact,
        screen: screenStyles.screen,
        board: screenStyles.board,
        hiddenLabel: rootStyles.hiddenLabel,
      }}
    >
      <LiveHeroBillboardMarquee
        lane={lane}
        classNames={marqueeClassNames}
      />

      <LiveHeroBillboardCounter
        lane={lane}
        digits={digits}
        classNames={counterClassNames}
      />
    </LiveHeroBillboardScreen>
  );
}
