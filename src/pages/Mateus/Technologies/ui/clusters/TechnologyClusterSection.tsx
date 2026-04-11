import React, { memo, useId, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { TechnologyCatalogItem } from "../../Technologies";
import TechnologyHexCard from "../hex/TechnologyHexCard";
import styles from "./TechnologyClusterSection.module.css";

gsap.registerPlugin(ScrollTrigger);

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

type TechnologyClusterSectionProps = Readonly<{
  id: string;
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

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const cardItems = Array.from(
      root.querySelectorAll<HTMLElement>("[data-cluster-card-item='true']")
    );

    const ctx = gsap.context(() => {
      gsap.set(root, {
        "--cluster-energy": 0.2,
        "--cluster-energy-alpha": 0.16,
        "--cluster-shift-y": "18px",
        "--cluster-network-opacity": 0.2,
        "--cluster-network-travel": 0,
        "--cluster-orbit-rotate": "-7deg",
        "--cluster-surface-glow": 0.1,
      });

      gsap.set(cardItems, {
        y: 18,
        opacity: 0.78,
        scale: 0.985,
      });

      const timeline = gsap.timeline({
        defaults: {
          ease: "none",
        },
        scrollTrigger: {
          trigger: root,
          start: "top 92%",
          end: "bottom 12%",
          scrub: 1.15,
        },
      });

      timeline
        .to(
          root,
          {
            "--cluster-energy": 1,
            "--cluster-energy-alpha": 0.88,
            "--cluster-shift-y": "0px",
            "--cluster-network-opacity": 0.92,
            "--cluster-network-travel": 1,
            "--cluster-orbit-rotate": "0deg",
            "--cluster-surface-glow": 1,
          },
          0
        )
        .to(
          cardItems,
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: dense ? 0.024 : 0.04,
            ease: "power2.out",
          },
          0.06
        );

      if (isActiveCluster) {
        gsap.fromTo(
          root,
          { "--cluster-hero-surge": 0.16 },
          {
            "--cluster-hero-surge": 1,
            duration: 1.9,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }
        );
      } else {
        gsap.set(root, { "--cluster-hero-surge": 0.18 });
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [dense, isActiveCluster, items.length, clusterIndex]);

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
      data-cluster-id={id}
      data-cluster-density={dense ? "dense" : "default"}
      data-cluster-active={isActiveCluster ? "true" : "false"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className={styles.visualViewport} aria-hidden="true">
        <div className={styles.energyField}>
          <div className={styles.energyAura} />
          <div className={styles.energyBeam} />
          <div className={styles.energyGrid} />
          <div className={styles.energyGlow} />
        </div>

        <div className={styles.networkLayer}>
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

          <span className={styles.scanPulse} />
          <span className={styles.scanPulseAlt} />
        </div>
      </div>

      <header className={styles.headerSticky}>
        <div className={styles.headerSurface}>
          <div className={styles.headerTop}>
            <div className={styles.titleBlock}>
              <p className={styles.eyebrow}>{eyebrow}</p>

              <h2 className={styles.title} id={`${id}-title`}>
                {title}
              </h2>

              {description ? (
                <p className={styles.description}>{description}</p>
              ) : null}
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
