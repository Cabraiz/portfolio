import React from "react";

import PortfolioProjectCounter from "../counter/PortfolioProjectCounter";
import styles from "./PortfolioTimelineRail.module.css";

export interface PortfolioTimelineRailItem {
  id: string;
  year: string;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  isActive?: boolean;
  railLogoSrc?: string;
  railLogoAlt?: string;
}

export interface PortfolioTimelineRailProps {
  items: PortfolioTimelineRailItem[];
  activeIndex: number;
  paused?: boolean;
  className?: string;
  counterLabel?: string;
  counterCaption?: string;
  onSelectIndex?: (index: number) => void;
}

const PortfolioTimelineRail: React.FC<PortfolioTimelineRailProps> = ({
  items,
  activeIndex,
  paused = false,
  className,
  counterLabel = "PROJECT INDEX",
  counterCaption = "PORTFOLIO",
  onSelectIndex,
}) => {
  const hasItems = items.length > 0;

  return (
    <aside
      className={[styles.rail, className].filter(Boolean).join(" ")}
      data-portfolio-timeline="true"
    >
      <div className={styles.counterSlot}>
        <PortfolioProjectCounter
          activeIndex={activeIndex}
          totalProjects={items.length}
          paused={paused}
          label={counterLabel}
          caption={counterCaption}
          onSelectIndex={onSelectIndex}
        />
      </div>

      <div
        className={styles.list}
        role="list"
        aria-label="Lista de projetos do portfólio"
      >
        {hasItems ? (
          items.map((item, index) => {
            const isActive = index === activeIndex || item.isActive === true;

            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                className={[
                  styles.card,
                  isActive ? styles.cardActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectIndex?.(index)}
                aria-pressed={isActive}
                aria-label={`Selecionar projeto ${item.title}`}
              >
                <div className={styles.cardTopline}>
                  <span className={styles.year}>{item.year}</span>

                  <span className={styles.logoSlot}>
                    {item.railLogoSrc ? (
                      <img
                        src={item.railLogoSrc}
                        alt={item.railLogoAlt ?? item.title}
                        className={styles.logo}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className={styles.logoFallback}
                        aria-hidden="true"
                      >
                        •
                      </span>
                    )}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <strong className={styles.title}>{item.title}</strong>

                  {item.subtitle ? (
                    <span className={styles.subtitle}>{item.subtitle}</span>
                  ) : null}
                </div>
              </button>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyLabel}>SEM PROJETOS</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default PortfolioTimelineRail;
