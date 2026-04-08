// src/pages/Mateus/Live/ui/board/LiveMetricCard.tsx

import { type CSSProperties } from "react";

import type { LiveMetricId, LiveMetricSnapshot } from "../../domain/live.types";
import LiveMetricTicker from "./LiveMetricTicker";
import styles from "./LiveStatsBoard.module.css";

export type LiveMetricCardProps = Readonly<{
  metric: LiveMetricSnapshot;
  className?: string;
  selected?: boolean;
  compact?: boolean;
  startValue?: number;
  paused?: boolean;
  restartKey?: string | number;
  onSelect?: (metricId: LiveMetricId) => void;
  onMouseEnter?: (metricId: LiveMetricId) => void;
  onMouseLeave?: (metricId: LiveMetricId) => void;
}>;

type MetricCssVariables = CSSProperties & {
  "--live-board-accent"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function getTrendLabel(metric: LiveMetricSnapshot): string {
  switch (metric.trendDirection) {
    case "up":
      return "Subindo";
    case "pulse":
      return "Pulsando";
    case "steady":
    default:
      return "Estável";
  }
}

function getTrendGlyph(metric: LiveMetricSnapshot): string {
  switch (metric.trendDirection) {
    case "up":
      return "↑";
    case "pulse":
      return "•";
    case "steady":
    default:
      return "—";
  }
}

export default function LiveMetricCard({
  metric,
  className,
  selected = false,
  compact = false,
  startValue = 0,
  paused = false,
  restartKey,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: LiveMetricCardProps) {
  const style: MetricCssVariables = {
    "--live-board-accent": metric.accentToken,
  };

  return (
    <button
      type="button"
      className={joinClassNames(
        styles.metricCard,
        compact ? styles.metricCardCompact : styles.metricCardHero,
        className,
      )}
      style={style}
      aria-label={metric.ariaLabel}
      aria-pressed={selected}
      data-live-metric="true"
      data-live-metric-id={metric.id}
      data-selected={selected ? "true" : "false"}
      data-tone={metric.tone}
      data-emphasis={metric.emphasis}
      data-interactive={metric.interactive ? "true" : "false"}
      data-trend={metric.trendDirection}
      onClick={() => {
        onSelect?.(metric.id);
      }}
      onMouseEnter={() => {
        onMouseEnter?.(metric.id);
      }}
      onMouseLeave={() => {
        onMouseLeave?.(metric.id);
      }}
    >
      <div className={styles.metricCardTopRow}>
        <span className={styles.metricEyebrow}>
          {compact ? metric.shortLabel : metric.label}
        </span>

        <span className={styles.metricTrend}>
          <span className={styles.metricTrendGlyph} aria-hidden="true">
            {getTrendGlyph(metric)}
          </span>
          {getTrendLabel(metric)}
        </span>
      </div>

      <LiveMetricTicker
        metric={metric}
        startValue={startValue}
        paused={paused}
        restartKey={restartKey}
      />

      <p className={styles.metricDescription}>{metric.description}</p>

      <div className={styles.metricFooter}>
        {metric.badge ? (
          <span className={styles.metricBadge}>{metric.badge}</span>
        ) : (
          <span className={styles.metricBadgeMuted}>
            {metric.unitLabel ?? "Indicador"}
          </span>
        )}

        {metric.interactive ? (
          <span className={styles.metricHint}>Explorar</span>
        ) : (
          <span className={styles.metricHintMuted}>Snapshot</span>
        )}
      </div>
    </button>
  );
}
