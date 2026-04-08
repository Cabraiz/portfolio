// src/pages/Mateus/Live/ui/shell/LiveSectionShell.tsx

import type { CSSProperties, ReactNode } from "react";

import { LIVE_SECTION_ID } from "../../domain/live.constants";
import styles from "./LiveSectionShell.module.css";

export type LiveShellMetricTone = "neutral" | "info" | "success" | "warning";

export type LiveShellMetricItem = Readonly<{
  id: string;
  label: string;
  value: string;
  helperText?: string;
  badge?: string;
  tone?: LiveShellMetricTone;
}>;

type LiveSectionShellProps = Readonly<{
  id?: string;
  className?: string;
  sectionClassName?: string;
  contentClassName?: string;
  compact?: boolean;

  eyebrow?: string;
  statusLabel?: string;
  title?: string;
  description?: string;
  caption?: string;

  heroSlot?: ReactNode;
  metrics?: readonly LiveShellMetricItem[];
  metricsSlot?: ReactNode;
  filtersSlot?: ReactNode;
  sceneSlot?: ReactNode;
  spotlightSlot?: ReactNode;
  supportingSlot?: ReactNode;
  children?: ReactNode;

  emptyEyebrow?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  hasResults?: boolean;

  accentColor?: string;
  accentGlowColor?: string;
  signalColor?: string;

  ariaLabel?: string;
}>;

type LiveShellCssVariables = CSSProperties & {
  "--live-shell-accent"?: string;
  "--live-shell-accent-glow"?: string;
  "--live-shell-signal"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function hasRenderableNode(node: ReactNode): boolean {
  if (node === null || node === undefined || node === false) {
    return false;
  }

  if (Array.isArray(node)) {
    return node.length > 0;
  }

  return true;
}

function hasTextContent(value?: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveMetricToneClassName(tone?: LiveShellMetricTone): string | null {
  switch (tone) {
    case "info":
      return styles.metricCardInfo;
    case "success":
      return styles.metricCardSuccess;
    case "warning":
      return styles.metricCardWarning;
    case "neutral":
    default:
      return null;
  }
}

function renderMetricCards(
  metrics: readonly LiveShellMetricItem[]
): ReactNode {
  if (!metrics.length) {
    return null;
  }

  return metrics.map((metric) => (
    <article
      key={metric.id}
      className={joinClassNames(
        styles.metricCard,
        resolveMetricToneClassName(metric.tone)
      )}
      data-live-metric="true"
      data-live-metric-id={metric.id}
    >
      <div className={styles.metricCardTopRow}>
        <span className={styles.metricLabel}>{metric.label}</span>

        {metric.badge ? (
          <span className={styles.metricBadge}>{metric.badge}</span>
        ) : null}
      </div>

      <strong className={styles.metricValue}>{metric.value}</strong>

      {metric.helperText ? (
        <span className={styles.metricHelper}>{metric.helperText}</span>
      ) : null}
    </article>
  ));
}

export default function LiveSectionShell({
  id = LIVE_SECTION_ID,
  className,
  sectionClassName,
  contentClassName,
  compact = false,
  eyebrow,
  statusLabel,
  title = "Tudo em curso, ao vivo.",
  description = "",
  caption = "",
  heroSlot,
  metrics = [],
  metricsSlot,
  filtersSlot,
  sceneSlot,
  spotlightSlot,
  supportingSlot,
  children,
  emptyEyebrow = "Live board",
  emptyTitle = "Nenhum sinal carregado para o painel ao vivo.",
  emptyDescription = "Adicione métricas, projetos ou nós interativos para transformar esta área em um radar visual de trabalho em andamento.",
  hasResults = true,
  accentColor,
  accentGlowColor,
  signalColor,
  ariaLabel = "Seção ao vivo",
}: LiveSectionShellProps) {
  const rootStyle: LiveShellCssVariables = {
    "--live-shell-accent": accentColor,
    "--live-shell-accent-glow": accentGlowColor,
    "--live-shell-signal": signalColor,
  };

  const resolvedMetrics = hasRenderableNode(metricsSlot)
    ? metricsSlot
    : renderMetricCards(metrics);

  const resolvedSupportingContent = hasRenderableNode(supportingSlot)
    ? supportingSlot
    : children;

  const hasHero = hasRenderableNode(heroSlot);
  const hasMetrics = hasRenderableNode(resolvedMetrics);
  const hasFilters = hasRenderableNode(filtersSlot);
  const hasScene = hasRenderableNode(sceneSlot);
  const hasSpotlight = hasRenderableNode(spotlightSlot);
  const hasSupportingContent = hasRenderableNode(resolvedSupportingContent);

  const hasEyebrow = hasTextContent(eyebrow);
  const hasStatusLabel = hasTextContent(statusLabel);
  const shouldRenderEyebrowRow = hasEyebrow || hasStatusLabel;

  const resolvedTitle = hasTextContent(title)
    ? title.trim()
    : "Tudo em curso, ao vivo.";
  const resolvedDescription = hasTextContent(description)
    ? description.trim()
    : null;
  const resolvedCaption = hasTextContent(caption) ? caption.trim() : null;

  return (
    <div
      className={joinClassNames(
        styles.root,
        compact && styles.rootCompact,
        className
      )}
      style={rootStyle}
    >
      <section
        id={id}
        className={joinClassNames(styles.section, sectionClassName)}
        aria-labelledby={`${id}-title`}
      >
        <div className={styles.background} aria-hidden="true">
          <div className={styles.backgroundGlowPrimary} />
          <div className={styles.backgroundGlowSecondary} />
          <div className={styles.backgroundGrid} />
          <div className={styles.backgroundScanlines} />
        </div>

        <div className={joinClassNames(styles.content, contentClassName)}>
          <header className={styles.header} aria-label={ariaLabel}>
            <div className={styles.heroShell} data-live-board="true">
              <div className={styles.heroCopy}>
                {shouldRenderEyebrowRow ? (
                  <div className={styles.eyebrowRow}>
                    {hasEyebrow ? (
                      <span className={styles.eyebrow}>{eyebrow}</span>
                    ) : null}

                    {hasEyebrow && hasStatusLabel ? (
                      <span className={styles.statusDot} aria-hidden="true" />
                    ) : null}

                    {hasStatusLabel ? (
                      <span className={styles.statusLabel}>{statusLabel}</span>
                    ) : null}
                  </div>
                ) : null}

                <div className={styles.titleBlock}>
                  <h2 id={`${id}-title`} className={styles.title}>
                    {resolvedTitle}
                  </h2>

                  {resolvedDescription ? (
                    <p className={styles.description}>{resolvedDescription}</p>
                  ) : null}

                  {resolvedCaption ? (
                    <p className={styles.caption}>{resolvedCaption}</p>
                  ) : null}
                </div>
              </div>

              {hasHero ? (
                <div className={styles.heroMedia}>{heroSlot}</div>
              ) : null}
            </div>

            {hasMetrics ? (
              <div className={styles.metricsRow}>{resolvedMetrics}</div>
            ) : null}
          </header>

          <div className={styles.body}>
            <div className={styles.mainColumn}>
              {hasFilters ? (
                <div className={styles.filtersRow}>{filtersSlot}</div>
              ) : null}

              <div className={styles.canvasPanel}>
                <div className={styles.canvasInner}>
                  {hasResults && hasScene ? (
                    <div className={styles.sceneArea}>{sceneSlot}</div>
                  ) : (
                    <div
                      className={styles.emptyState}
                      role="status"
                      aria-live="polite"
                    >
                      <div className={styles.emptyStateOrb} aria-hidden="true" />

                      <div className={styles.emptyStateContent}>
                        <span className={styles.emptyStateEyebrow}>
                          {emptyEyebrow}
                        </span>
                        <h3 className={styles.emptyStateTitle}>{emptyTitle}</h3>
                        <p className={styles.emptyStateDescription}>
                          {emptyDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hasSupportingContent ? (
                <div className={styles.supportingContent}>
                  {resolvedSupportingContent}
                </div>
              ) : null}
            </div>

            {hasSpotlight ? (
              <aside className={styles.asideColumn}>
                <div className={styles.spotlightPanel}>{spotlightSlot}</div>
              </aside>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
