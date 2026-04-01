// src/pages/Mateus/Technologies/ui/hero/TechnologiesStatsBar.tsx

import { memo } from "react";

import type { TechnologyMetricCard } from "../../domain/technologies.types";
import styles from "./TechnologiesHero.module.css";

type TechnologiesStatsBarProps = Readonly<{
  items: readonly TechnologyMetricCard[];
  className?: string;
  compact?: boolean;
  ariaLabel?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function TechnologiesStatsBarComponent({
  items,
  className,
  compact = false,
  ariaLabel = "Métricas da seção de tecnologias",
}: TechnologiesStatsBarProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={joinClasses(
        styles.technologiesHeroStats,
        compact && styles.technologiesHeroStatsCompact,
        className,
      )}
      role="list"
      aria-label={ariaLabel}
      data-technologies-stats-bar="true"
    >
      {items.map((item) => (
        <article
          key={item.id}
          className={styles.technologiesHeroStatCard}
          role="listitem"
        >
          <span className={styles.technologiesHeroStatLabel}>{item.label}</span>

          <strong className={styles.technologiesHeroStatValue}>
            {item.value}
          </strong>

          {item.helperText ? (
            <span className={styles.technologiesHeroStatHelper}>
              {item.helperText}
            </span>
          ) : null}
        </article>
      ))}
    </div>
  );
}

const TechnologiesStatsBar = memo(TechnologiesStatsBarComponent);

TechnologiesStatsBar.displayName = "TechnologiesStatsBar";

export default TechnologiesStatsBar;
