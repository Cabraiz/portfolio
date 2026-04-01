import { memo } from "react";

import styles from "./TechnologyClusterSection.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

export type TechnologyClusterLegendItem = Readonly<{
  id: string;
  label: string;
  value?: string;
  color?: string;
  emphasis?: "default" | "strong";
}>;

type TechnologyClusterLegendProps = Readonly<{
  items: readonly TechnologyClusterLegendItem[];
  className?: string;
  ariaLabel?: string;
}>;

function TechnologyClusterLegendComponent({
  items,
  className,
  ariaLabel = "Legenda do cluster de tecnologias",
}: TechnologyClusterLegendProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div
      className={joinClasses(styles.legend, className)}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={joinClasses(
            styles.legendItem,
            item.emphasis === "strong" && styles.legendItemStrong,
          )}
          role="listitem"
        >
          <span
            className={styles.legendSwatch}
            aria-hidden="true"
            style={{
              background:
                item.color ??
                "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.4))",
            }}
          />
          <span className={styles.legendLabel}>{item.label}</span>
          {item.value ? (
            <span className={styles.legendValue}>{item.value}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const TechnologyClusterLegend = memo(TechnologyClusterLegendComponent);
TechnologyClusterLegend.displayName = "TechnologyClusterLegend";

export default TechnologyClusterLegend;
