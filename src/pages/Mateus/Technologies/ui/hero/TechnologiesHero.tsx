// src/pages/Mateus/Technologies/ui/hero/TechnologiesHero.tsx

import { memo, type CSSProperties, type ReactNode } from "react";

import { TECHNOLOGIES_SECTION_COPY } from "../../data/technologies.copy";
import type { TechnologyMetricCard } from "../../domain/technologies.types";
import TechnologiesStatsBar from "./TechnologiesStatsBar";
import styles from "./TechnologiesHero.module.css";

type TechnologiesHeroProps = Readonly<{
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  caption?: string;
  metricCards?: readonly TechnologyMetricCard[];
  metricsSlot?: ReactNode;
  actionsSlot?: ReactNode;
  visualSlot?: ReactNode;
  compact?: boolean;
  accentColor?: string;
  accentGlowColor?: string;
}>;

type CssVariables = CSSProperties & {
  "--technologies-hero-accent"?: string;
  "--technologies-hero-accent-glow"?: string;
};

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
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

function TechnologiesHeroComponent({
  className,
  eyebrow = TECHNOLOGIES_SECTION_COPY.eyebrow,
  title = TECHNOLOGIES_SECTION_COPY.title,
  description = TECHNOLOGIES_SECTION_COPY.description,
  caption = TECHNOLOGIES_SECTION_COPY.caption,
  metricCards = [],
  metricsSlot,
  actionsSlot,
  visualSlot,
  compact = false,
  accentColor,
  accentGlowColor,
}: TechnologiesHeroProps) {
  const style: CssVariables = {
    "--technologies-hero-accent": accentColor,
    "--technologies-hero-accent-glow": accentGlowColor,
  };

  const hasMetrics = hasRenderableNode(metricsSlot) || metricCards.length > 0;
  const hasActions = hasRenderableNode(actionsSlot);
  const hasVisual = hasRenderableNode(visualSlot);

  return (
    <header
      className={joinClasses(
        styles.technologiesHero,
        compact && styles.technologiesHeroCompact,
        className,
      )}
      style={style}
      data-technologies-hero="true"
    >
      <div className={styles.technologiesHeroInner}>
        <div className={styles.technologiesHeroCopy}>
          {eyebrow ? (
            <span className={styles.technologiesHeroEyebrow}>{eyebrow}</span>
          ) : null}

          <h2 className={styles.technologiesHeroTitle}>{title}</h2>

          {description ? (
            <p className={styles.technologiesHeroDescription}>{description}</p>
          ) : null}

          {caption ? (
            <p className={styles.technologiesHeroCaption}>{caption}</p>
          ) : null}

          {hasActions ? (
            <div className={styles.technologiesHeroActions}>{actionsSlot}</div>
          ) : null}
        </div>

        <div className={styles.technologiesHeroVisual} aria-hidden="true">
          {hasVisual ? (
            visualSlot
          ) : (
            <>
              <div className={styles.technologiesHeroVisualHex} />
              <div className={styles.technologiesHeroVisualRing} />
              <div className={styles.technologiesHeroVisualCore} />
            </>
          )}
        </div>
      </div>

      {hasMetrics ? (
        <div className={styles.technologiesHeroStatsWrapper}>
          {hasRenderableNode(metricsSlot) ? (
            metricsSlot
          ) : (
            <TechnologiesStatsBar
              items={metricCards}
              compact={compact}
              ariaLabel="Resumo de métricas de tecnologias"
            />
          )}
        </div>
      ) : null}
    </header>
  );
}

const TechnologiesHero = memo(TechnologiesHeroComponent);

TechnologiesHero.displayName = "TechnologiesHero";

export default TechnologiesHero;
