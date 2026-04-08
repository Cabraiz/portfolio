// src/pages/Mateus/Live/ui/board/LiveMetricTicker.tsx

import { useMemo, type CSSProperties } from "react";

import { useLiveCounterTicker } from "../../hooks/useLiveCounterTicker";
import type { LiveMetricSnapshot } from "../../domain/live.types";
import styles from "./LiveStatsBoard.module.css";

export type LiveMetricTickerProps = Readonly<{
  metric: LiveMetricSnapshot;
  className?: string;
  startValue?: number;
  durationMs?: number;
  delayMs?: number;
  autoplay?: boolean;
  paused?: boolean;
  restartKey?: string | number;
  locale?: string;
  respectReducedMotion?: boolean;
  emphasizeCompleteState?: boolean;
}>;

type MetricCssVariables = CSSProperties & {
  "--live-board-accent"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function inferPrecision(value: number): number {
  const normalized = value.toString();

  if (!normalized.includes(".")) {
    return 0;
  }

  const [, decimals = ""] = normalized.split(".");
  return Math.min(decimals.length, 3);
}

function stripAffixes(
  formattedValue: string,
  prefix?: string,
  suffix?: string,
): string {
  let normalized = formattedValue.trim();

  if (prefix && normalized.startsWith(prefix)) {
    normalized = normalized.slice(prefix.length).trim();
  }

  if (suffix && normalized.endsWith(suffix)) {
    normalized = normalized.slice(0, -suffix.length).trim();
  }

  return normalized;
}

function shouldUseCompactFormatting(metric: LiveMetricSnapshot): boolean {
  const normalized = stripAffixes(
    metric.formattedValue,
    metric.prefix,
    metric.suffix,
  );

  return /[A-Za-zÀ-ÿ]/.test(normalized);
}

function createMetricFormatter(
  metric: LiveMetricSnapshot,
  locale: string,
): (value: number) => string {
  const precision = inferPrecision(metric.value);
  const useCompact = shouldUseCompactFormatting(metric);

  return (value: number) => {
    const formattedNumber = new Intl.NumberFormat(locale, {
      notation: useCompact ? "compact" : "standard",
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    }).format(value);

    return `${metric.prefix ?? ""}${formattedNumber}${metric.suffix ?? ""}`;
  };
}

export default function LiveMetricTicker({
  metric,
  className,
  startValue = 0,
  durationMs = 980,
  delayMs = 0,
  autoplay = true,
  paused = false,
  restartKey,
  locale = "pt-BR",
  respectReducedMotion = true,
  emphasizeCompleteState = false,
}: LiveMetricTickerProps) {
  const formatter = useMemo(() => {
    return createMetricFormatter(metric, locale);
  }, [locale, metric]);

  const {
    displayValue,
    isRunning,
    isComplete,
    progress,
  } = useLiveCounterTicker({
    targetValue: metric.value,
    startValue,
    durationMs,
    delayMs,
    autoplay,
    paused,
    restartKey,
    formatter,
    respectReducedMotion,
  });

  const style: MetricCssVariables = {
    "--live-board-accent": metric.accentToken,
  };

  const resolvedValue =
    !autoplay || paused ? metric.formattedValue : displayValue;

  return (
    <strong
      className={joinClassNames(styles.metricValue, className)}
      style={style}
      aria-label={metric.ariaLabel}
      data-running={isRunning ? "true" : "false"}
      data-complete={isComplete ? "true" : "false"}
      data-progress-state={
        progress <= 0
          ? "idle"
          : progress >= 1
            ? "complete"
            : "animating"
      }
      data-emphasize-complete={emphasizeCompleteState ? "true" : "false"}
    >
      {resolvedValue}
    </strong>
  );
}
