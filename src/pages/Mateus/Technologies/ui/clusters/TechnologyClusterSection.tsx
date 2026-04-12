import React, { memo, useId, useMemo, useRef } from "react";

import type { TechnologyCatalogItem } from "../../Technologies";
import TechnologyHexCard from "../hex/TechnologyHexCard";
import styles from "./TechnologyClusterSection.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

type TechnologyClusterSectionProps = Readonly<{
  id: string;
  clusterId?: string;
  title: string;
  description?: string;
  eyebrow?: string;
  items: readonly TechnologyCatalogItem[];
  activeItemId?: string | null;
  isActiveCluster?: boolean;
  clusterIndex?: number;
  className?: string;
  dense?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelectItem?: (item: TechnologyCatalogItem) => void;
}>;

type DecoratedItem = Readonly<{
  item: TechnologyCatalogItem;
  isFeatured: boolean;
  offsetKind: "none" | "soft" | "strong";
}>;

function buildDecoratedItems(
  items: readonly TechnologyCatalogItem[],
  dense: boolean
): DecoratedItem[] {
  return items.map((item, index) => {
    const isFeatured = false;

    const offsetKind = dense
      ? "none"
      : index % 3 === 1
        ? "soft"
        : "none";

    return {
      item,
      isFeatured,
      offsetKind,
    };
  });
}

function TechnologyClusterSectionComponent({
  id,
  clusterId,
  title,
  description,
  eyebrow = "Capability Cluster",
  items,
  activeItemId = null,
  isActiveCluster = false,
  clusterIndex = 0,
  className,
  dense = false,
  emptyTitle = "Nenhuma tecnologia disponível neste cluster.",
  emptyDescription = "Adicione itens ao dataset para que o cluster comece a renderizar os cards hexagonais e a navegação visual.",
  onSelectItem,
}: TechnologyClusterSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const networkId = useId();

  const decoratedItems = useMemo(
    () => buildDecoratedItems(items, dense),
    [items, dense]
  );

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    root.style.setProperty("--cluster-pointer-x", `${x.toFixed(2)}%`);
    root.style.setProperty("--cluster-pointer-y", `${y.toFixed(2)}%`);
  };

  const handlePointerLeave = () => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    root.style.setProperty("--cluster-pointer-x", "50%");
    root.style.setProperty("--cluster-pointer-y", "28%");
  };

  return (
    <section
      id={id}
      ref={rootRef}
      className={joinClasses(styles.root, className)}
      aria-labelledby={`${id}-title`}
      data-technology-cluster="true"
      data-cluster-id={clusterId ?? id}
      data-cluster-density={dense ? "dense" : "default"}
      data-cluster-active={isActiveCluster ? "true" : "false"}
      data-cluster-index={clusterIndex}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={styles.visualViewport}
        aria-hidden="true"
        data-technology-cluster-ornament="true"
      >
        <div
          className={styles.energyField}
          data-technology-cluster-ornament="true"
        >
          <div
            className={styles.energyAura}
            data-technology-cluster-ornament="true"
          />
          <div
            className={styles.energyBeam}
            data-technology-cluster-ornament="true"
          />
          <div
            className={styles.energyGrid}
            data-technology-cluster-ornament="true"
          />
          <div
            className={styles.energyGlow}
            data-technology-cluster-ornament="true"
          />
        </div>

        <div
          className={styles.networkLayer}
          data-technology-cluster-ornament="true"
        >
          <svg
            className={styles.networkSvg}
            viewBox="0 0 1000 540"
            preserveAspectRatio="none"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${networkId}-line-a`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(96, 149, 255, 0)" />
                <stop offset="24%" stopColor="rgba(96, 149, 255, 0.22)" />
                <stop offset="52%" stopColor="rgba(129, 178, 255, 0.92)" />
                <stop offset="78%" stopColor="rgba(96, 149, 255, 0.22)" />
                <stop offset="100%" stopColor="rgba(96, 149, 255, 0)" />
              </linearGradient>

              <linearGradient
                id={`${networkId}-line-b`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(152, 195, 255, 0)" />
                <stop offset="48%" stopColor="rgba(152, 195, 255, 0.82)" />
                <stop offset="100%" stopColor="rgba(152, 195, 255, 0)" />
              </linearGradient>
            </defs>

            <path
              className={styles.networkPath}
              d="M84 178 C 210 120, 316 126, 438 220 S 700 332, 902 250"
              stroke={`url(#${networkId}-line-a)`}
            />
            <path
              className={styles.networkPathSoft}
              d="M112 314 C 254 252, 390 270, 522 334 S 760 430, 916 366"
              stroke={`url(#${networkId}-line-b)`}
            />
            <path
              className={styles.networkPathSoft}
              d="M182 94 C 314 72, 472 88, 624 148 S 810 234, 930 180"
              stroke={`url(#${networkId}-line-b)`}
            />

            <circle className={styles.networkNode} cx="176" cy="152" r="5.5" />
            <circle className={styles.networkNode} cx="418" cy="214" r="4.5" />
            <circle className={styles.networkNode} cx="654" cy="292" r="5" />
            <circle className={styles.networkNode} cx="828" cy="248" r="4.5" />
            <circle className={styles.networkNode} cx="298" cy="300" r="4.5" />
            <circle className={styles.networkNode} cx="564" cy="344" r="4.5" />
          </svg>

          <span
            className={styles.scanPulse}
            data-technology-cluster-ornament="true"
          />
          <span
            className={styles.scanPulseAlt}
            data-technology-cluster-ornament="true"
          />
        </div>
      </div>

      <header
        className={styles.headerSticky}
        data-technology-cluster-header="true"
      >
        <div className={styles.headerSurface}>
          <div className={styles.headerTop}>
            <div className={styles.titleBlock}>
              <p
                className={styles.eyebrow}
                data-technology-cluster-badge="true"
              >
                {eyebrow}
              </p>

              <h2 className={styles.title} id={`${id}-title`}>
                {title}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {decoratedItems.length > 0 ? (
          <div
            className={joinClasses(styles.grid, dense && styles.gridCompact)}
            role="list"
            aria-label={`Tecnologias do cluster ${title}`}
          >
            {decoratedItems.map(({ item, isFeatured, offsetKind }, index) => {
              const isActive = activeItemId === item.id;

              return (
                <div
                  key={item.id}
                  role="listitem"
                  data-cluster-card-item="true"
                  data-technology-cluster-card="true"
                  data-card-active={isActive ? "true" : "false"}
                  data-card-index={index}
                  data-card-offset={offsetKind}
                  className={joinClasses(
                    styles.cardItem,
                    dense && styles.cardItemDense,
                    isFeatured && !dense && styles.cardItemFeatured,
                    offsetKind === "soft" &&
                      !dense &&
                      styles.cardItemOffsetSoft,
                    offsetKind === "strong" && !dense && styles.cardItemOffset,
                    isActive && styles.cardItemActive
                  )}
                >
                  <TechnologyHexCard
                    item={item}
                    isActive={isActive}
                    onSelect={onSelectItem}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateInner}>
              <h3 className={styles.emptyStateTitle}>{emptyTitle}</h3>

              <p className={styles.emptyStateDescription}>{emptyDescription}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const TechnologyClusterSection = memo(TechnologyClusterSectionComponent);
TechnologyClusterSection.displayName = "TechnologyClusterSection";

export default TechnologyClusterSection;
