// src/pages/Mateus/Technologies/ui/shell/TechnologiesShell.tsx

import type { CSSProperties, ReactNode } from "react";

import { TECHNOLOGIES_EMPTY_STATE_COPY, TECHNOLOGIES_SECTION_COPY } from "../../data/technologies.copy";
import { TECHNOLOGIES_SECTION_ID } from "../../domain/technologies.constants";
import styles from "./TechnologiesShell.module.css";

type TechnologiesShellMetricItem = Readonly<{
  id: string;
  label: string;
  value: string;
  helperText?: string;
}>;

type TechnologiesShellProps = Readonly<{
  id?: string;
  className?: string;
  sectionClassName?: string;
  contentClassName?: string;
  compact?: boolean;

  eyebrow?: string;
  title?: string;
  description?: string;
  caption?: string;

  metrics?: readonly TechnologiesShellMetricItem[];
  metricsSlot?: ReactNode;
  filtersSlot?: ReactNode;
  gridSlot?: ReactNode;
  spotlightSlot?: ReactNode;

  emptyTitle?: string;
  emptyDescription?: string;
  hasResults?: boolean;

  accentColor?: string;
  accentGlowColor?: string;
  children?: ReactNode;
}>;

type CssVariables = CSSProperties & {
  "--technologies-shell-accent"?: string;
  "--technologies-shell-accent-glow"?: string;
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

function renderMetricCards(
  metrics: readonly TechnologiesShellMetricItem[],
): ReactNode {
  if (metrics.length === 0) {
    return null;
  }

  return metrics.map((metric) => (
    <article key={metric.id} className={styles.metricCard}>
      <span className={styles.metricLabel}>{metric.label}</span>
      <strong className={styles.metricValue}>{metric.value}</strong>
      {metric.helperText ? (
        <span className={styles.metricHelper}>{metric.helperText}</span>
      ) : null}
    </article>
  ));
}

export default function TechnologiesShell({
  id = TECHNOLOGIES_SECTION_ID,
  className,
  sectionClassName,
  contentClassName,
  compact = false,
  eyebrow = TECHNOLOGIES_SECTION_COPY.eyebrow,
  title = TECHNOLOGIES_SECTION_COPY.title,
  description = TECHNOLOGIES_SECTION_COPY.description,
  caption = TECHNOLOGIES_SECTION_COPY.caption,
  metrics = [],
  metricsSlot,
  filtersSlot,
  gridSlot,
  spotlightSlot,
  emptyTitle = TECHNOLOGIES_EMPTY_STATE_COPY.title,
  emptyDescription = TECHNOLOGIES_EMPTY_STATE_COPY.description,
  hasResults = true,
  accentColor,
  accentGlowColor,
  children,
}: TechnologiesShellProps) {
  const rootStyle: CssVariables = {
    "--technologies-shell-accent": accentColor,
    "--technologies-shell-accent-glow": accentGlowColor,
  };

  const resolvedMetrics = hasRenderableNode(metricsSlot)
    ? metricsSlot
    : renderMetricCards(metrics);

  const hasMetrics = hasRenderableNode(resolvedMetrics);
  const hasFilters = hasRenderableNode(filtersSlot);
  const hasSpotlight = hasRenderableNode(spotlightSlot);
  const hasGrid = hasRenderableNode(gridSlot);
  const hasChildren = hasRenderableNode(children);

  return (
    <div
      className={joinClassNames(
        styles.root,
        compact && styles.rootCompact,
        className,
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
        </div>

        <div className={joinClassNames(styles.content, contentClassName)}>
          <header className={styles.header}>
            <div className={styles.headerShell}>
              <div className={styles.headerCopy}>
                <span className={styles.eyebrow}>{eyebrow}</span>

                <h2 id={`${id}-title`} className={styles.title}>
                  {title}
                </h2>

                <p className={styles.description}>{description}</p>

                {caption ? <p className={styles.caption}>{caption}</p> : null}
              </div>

              <div className={styles.headerAccent} aria-hidden="true">
                <div className={styles.headerAccentHex} />
                <div className={styles.headerAccentRing} />
              </div>
            </div>

            {hasMetrics ? (
              <div className={styles.metricsGrid}>{resolvedMetrics}</div>
            ) : null}
          </header>

          <div className={styles.body}>
            <div className={styles.mainColumn}>
              {hasFilters ? (
                <div className={styles.filtersRow}>{filtersSlot}</div>
              ) : null}

              <div className={styles.canvasPanel}>
                <div className={styles.canvasInner}>
                  {hasResults && hasGrid ? (
                    <div className={styles.gridArea}>{gridSlot}</div>
                  ) : (
                    <div
                      className={styles.emptyState}
                      role="status"
                      aria-live="polite"
                    >
                      <div className={styles.emptyStateHex} aria-hidden="true" />

                      <div className={styles.emptyStateContent}>
                        <span className={styles.emptyStateEyebrow}>
                          Skill Matrix
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

              {hasChildren ? (
                <div className={styles.supportingContent}>{children}</div>
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
