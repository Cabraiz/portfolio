// src/pages/Mateus/Live/ui/board/LiveStatsBoard.tsx

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import type {
  LiveMetricId,
  LiveMetricSnapshot,
  LiveStatusBucket,
} from "../../domain/live.types";
import styles from "./LiveStatsBoard.module.css";

export type LiveStatsBoardProps = Readonly<{
  className?: string;
  title?: string;
  subtitle?: string;

  metrics?: readonly LiveMetricSnapshot[];
  heroMetrics?: readonly LiveMetricSnapshot[];
  secondaryMetrics?: readonly LiveMetricSnapshot[];
  statusBuckets?: readonly LiveStatusBucket[];

  elapsedMs?: number;
  isRunning?: boolean;
  hasAnimatedMetrics?: boolean;

  selectedMetricId?: LiveMetricId | null;
  onMetricSelect?: (metricId: LiveMetricId) => void;

  onToggleRunning?: () => void;
  onRestart?: () => void;
}>;

type MetricCardProps = Readonly<{
  metric: LiveMetricSnapshot;
  selected: boolean;
  compact?: boolean;
  onSelect: (metricId: LiveMetricId) => void;
}>;

type MetricCssVariables = CSSProperties & {
  "--live-board-accent"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function formatElapsedMs(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
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

function getSelectedMetricSummary(metric: LiveMetricSnapshot | null): string {
  if (!metric) {
    return "Selecione um indicador para detalhar o sinal ativo.";
  }

  const interactionLabel = metric.interactive
    ? "Interativo"
    : "Leitura direta";

  return `${metric.description} · ${interactionLabel} · Tendência ${getTrendLabel(metric).toLowerCase()}.`;
}

function MetricCard({
  metric,
  selected,
  compact = false,
  onSelect,
}: MetricCardProps) {
  const style: MetricCssVariables = {
    "--live-board-accent": metric.accentToken,
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onSelect(metric.id);
  };

  return (
    <button
      type="button"
      className={joinClassNames(
        styles.metricCard,
        compact ? styles.metricCardCompact : styles.metricCardHero,
      )}
      style={style}
      onClick={handleClick}
      aria-pressed={selected}
      aria-label={metric.ariaLabel}
      data-live-metric="true"
      data-live-metric-id={metric.id}
      data-selected={selected ? "true" : "false"}
      data-tone={metric.tone}
      data-emphasis={metric.emphasis}
      data-interactive={metric.interactive ? "true" : "false"}
      data-trend={metric.trendDirection}
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

      <strong className={styles.metricValue}>{metric.formattedValue}</strong>

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

export default function LiveStatsBoard({
  className,
  title = "Painel operacional ao vivo",
  subtitle = "Placar editorial com sinais de entrega, operação e projetos em movimento.",
  metrics,
  heroMetrics,
  secondaryMetrics,
  statusBuckets,
  elapsedMs,
  isRunning,
  hasAnimatedMetrics,
  selectedMetricId,
  onMetricSelect,
  onToggleRunning,
  onRestart,
}: LiveStatsBoardProps) {
  const internalMetrics = useLiveMetrics();

  const resolvedMetrics = metrics ?? internalMetrics.snapshots;

  const resolvedHeroMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    if (heroMetrics) {
      return heroMetrics;
    }

    const heroOnly = resolvedMetrics.filter((metric) => metric.emphasis === "hero");

    return heroOnly.length > 0 ? heroOnly : resolvedMetrics.slice(0, 3);
  }, [heroMetrics, resolvedMetrics]);

  const resolvedSecondaryMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    if (secondaryMetrics) {
      return secondaryMetrics;
    }

    const secondaryOnly = resolvedMetrics.filter(
      (metric) => !resolvedHeroMetrics.some((heroMetric) => heroMetric.id === metric.id),
    );

    return secondaryOnly;
  }, [resolvedHeroMetrics, resolvedMetrics, secondaryMetrics]);

  const resolvedStatusBuckets = statusBuckets ?? internalMetrics.statusBuckets;
  const resolvedElapsedMs = elapsedMs ?? internalMetrics.elapsedMs;
  const resolvedIsRunning = isRunning ?? internalMetrics.isRunning;
  const resolvedHasAnimatedMetrics =
    hasAnimatedMetrics ?? internalMetrics.hasAnimatedMetrics;

  const handleToggleRunning = onToggleRunning ?? internalMetrics.toggle;
  const handleRestart = onRestart ?? internalMetrics.restart;

  const [internalSelectedMetricId, setInternalSelectedMetricId] =
    useState<LiveMetricId | null>(null);

  const allMetrics = useMemo(
    () => [...resolvedHeroMetrics, ...resolvedSecondaryMetrics],
    [resolvedHeroMetrics, resolvedSecondaryMetrics],
  );

  useEffect(() => {
    if (selectedMetricId) {
      return;
    }

    const stillExists = allMetrics.some(
      (metric) => metric.id === internalSelectedMetricId,
    );

    if (!stillExists) {
      setInternalSelectedMetricId(allMetrics[0]?.id ?? null);
    }
  }, [allMetrics, internalSelectedMetricId, selectedMetricId]);

  const effectiveSelectedMetricId =
    selectedMetricId ?? internalSelectedMetricId ?? null;

  const selectedMetric =
    allMetrics.find((metric) => metric.id === effectiveSelectedMetricId) ?? null;

  const totalTrackedProjects = useMemo(() => {
    return resolvedStatusBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  }, [resolvedStatusBuckets]);

  const handleSelectMetric = (metricId: LiveMetricId) => {
    if (!selectedMetricId) {
      setInternalSelectedMetricId(metricId);
    }

    onMetricSelect?.(metricId);
  };

  return (
    <section
      className={joinClassNames(styles.root, className)}
      aria-label="Painel de métricas ao vivo"
      data-live-board="true"
    >
      <header className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <div className={styles.liveBadge}>
            <span
              className={styles.liveDot}
              data-running={resolvedIsRunning ? "true" : "false"}
              aria-hidden="true"
            />
            <span className={styles.liveBadgeLabel}>
              {resolvedIsRunning ? "Ao vivo" : "Pausado"}
            </span>
          </div>

          <div className={styles.headlineBlock}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.toolbarAside}>
          <div className={styles.commandInfo}>
            <span className={styles.commandLabel}>uptime</span>
            <strong className={styles.commandValue}>
              {formatElapsedMs(resolvedElapsedMs)}
            </strong>
          </div>

          <div className={styles.commandInfo}>
            <span className={styles.commandLabel}>simulação</span>
            <strong className={styles.commandValue}>
              {resolvedHasAnimatedMetrics ? "ativa" : "manual"}
            </strong>
          </div>

          <div className={styles.commandActions}>
            <button
              type="button"
              className={styles.commandButton}
              onClick={handleToggleRunning}
            >
              {resolvedIsRunning ? "Pausar" : "Rodar"}
            </button>

            <button
              type="button"
              className={joinClassNames(
                styles.commandButton,
                styles.commandButtonGhost,
              )}
              onClick={handleRestart}
            >
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <div className={styles.heroGrid}>
        {resolvedHeroMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            selected={metric.id === effectiveSelectedMetricId}
            onSelect={handleSelectMetric}
          />
        ))}
      </div>

      <div className={styles.midRow}>
        <div className={styles.signalStrip} aria-label="Resumo por status">
          <div className={styles.signalStripHeader}>
            <span className={styles.signalStripLabel}>Radar de operação</span>
            <span className={styles.signalStripValue}>
              {totalTrackedProjects} projetos rastreados
            </span>
          </div>

          <div className={styles.pillRow}>
            {resolvedStatusBuckets.map((bucket) => (
              <div
                key={bucket.status}
                className={styles.statusPill}
                data-status={bucket.status}
              >
                <span className={styles.statusPillLabel}>{bucket.label}</span>
                <strong className={styles.statusPillValue}>{bucket.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.focusPanel} aria-live="polite">
          <span className={styles.focusLabel}>Sinal em foco</span>
          <strong className={styles.focusValue}>
            {selectedMetric?.label ?? "Nenhum indicador"}
          </strong>
          <p className={styles.focusDescription}>
            {getSelectedMetricSummary(selectedMetric)}
          </p>
        </aside>
      </div>

      <div className={styles.secondaryGrid}>
        {resolvedSecondaryMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            compact
            selected={metric.id === effectiveSelectedMetricId}
            onSelect={handleSelectMetric}
          />
        ))}
      </div>
    </section>
  );
}
