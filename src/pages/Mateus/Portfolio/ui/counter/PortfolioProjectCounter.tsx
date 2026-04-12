import React, { useMemo } from "react";

import { PORTFOLIO_PROJECT_COUNTER_TOKENS } from "./portfolioProjectCounter.tokens";
import styles from "./PortfolioProjectCounter.module.css";

export interface PortfolioProjectCounterProps {
  activeIndex: number;
  totalProjects: number;
  paused?: boolean;
  className?: string;
  label?: string;
  caption?: string;
  onSelectIndex?: (index: number) => void;
}

const clampIndex = (index: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  if (index < 0) {
    return 0;
  }

  if (index > total - 1) {
    return total - 1;
  }

  return index;
};

const formatCounterValue = (value: number) => String(value);

const PortfolioProjectCounter: React.FC<PortfolioProjectCounterProps> = ({
  activeIndex,
  totalProjects,
  paused = false,
  className,
  onSelectIndex,
}) => {
  const safeTotal = Math.max(
    totalProjects,
    PORTFOLIO_PROJECT_COUNTER_TOKENS.marks.countFallback,
  );

  const safeIndex = clampIndex(activeIndex, Math.max(totalProjects, 1));

  const marks = useMemo(
    () =>
      Array.from({ length: safeTotal }, (_, index) => ({
        index,
        isActive: index === safeIndex,
        angle: (360 / safeTotal) * index,
      })),
    [safeIndex, safeTotal],
  );

  const rotationDeg = useMemo(() => {
    if (safeTotal <= 0) {
      return 0;
    }

    return safeIndex * (360 / safeTotal);
  }, [safeIndex, safeTotal]);

  const currentValue = formatCounterValue(safeIndex + 1);

  const rootClassName = [styles.counter, paused ? styles.paused : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={rootClassName}
      aria-label={`Contador de projetos ${currentValue}`}
      style={
        {
          ["--portfolio-project-counter-rotation" as string]: `${rotationDeg}deg`,
          ["--portfolio-project-counter-total" as string]: String(safeTotal),
        } as React.CSSProperties
      }
    >
      <div className={styles.discShell}>
        <div className={styles.discFrame} aria-hidden="true" />

        <div
          className={styles.marksLayer}
          aria-hidden="true"
          style={
            {
              ["--portfolio-project-counter-rotation" as string]: `${rotationDeg}deg`,
            } as React.CSSProperties
          }
        >
          {marks.map((mark) => {
            const isInteractive = typeof onSelectIndex === "function";
            const Element = isInteractive ? "button" : "span";

            return (
              <Element
                key={`portfolio-project-counter-mark-${mark.index}`}
                type={isInteractive ? "button" : undefined}
                className={[
                  styles.mark,
                  mark.isActive ? styles.markActive : "",
                  isInteractive ? styles.markInteractive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  {
                    ["--portfolio-project-counter-mark-angle" as string]: `${mark.angle}deg`,
                  } as React.CSSProperties
                }
                onClick={
                  isInteractive ? () => onSelectIndex?.(mark.index) : undefined
                }
                aria-label={
                  isInteractive
                    ? `Selecionar projeto ${formatCounterValue(mark.index + 1)}`
                    : undefined
                }
                aria-pressed={isInteractive ? mark.isActive : undefined}
              />
            );
          })}
        </div>

        <div className={styles.core}>
          <div className={styles.valueWrap}>
            <span className={styles.value}>{currentValue}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioProjectCounter;
