import { JSX, memo, type CSSProperties } from "react";

import styles from "./LandingSectionSkeleton.module.css";

export type LandingSectionSkeletonVariant =
  | "hero"
  | "portfolio"
  | "roadmap"
  | "content";

type LandingSectionSkeletonProps = Readonly<{
  variant?: LandingSectionSkeletonVariant;
  className?: string;
  minHeight?: CSSProperties["minHeight"];
  fullHeight?: boolean;
}>;

type SkeletonLineProps = Readonly<{
  width?: string;
  height?: string;
  className?: string;
}>;

type PortfolioSkeletonCard = Readonly<{
  id: string;
  tagIds: readonly string[];
}>;

function joinClassNames(
  ...values: Array<string | undefined | null | false>
): string {
  return values.filter(Boolean).join(" ");
}

const HERO_META_PILL_IDS = ["hero-pill-primary", "hero-pill-secondary", "hero-pill-tertiary"] as const;

const HERO_SIGNAL_BAR_IDS = [
  "hero-signal-top",
  "hero-signal-middle",
  "hero-signal-bottom",
] as const;

const PORTFOLIO_RAIL_DOT_IDS = [
  "portfolio-rail-dot-start",
  "portfolio-rail-dot-middle",
  "portfolio-rail-dot-end",
] as const;

const PORTFOLIO_SKELETON_CARDS: readonly PortfolioSkeletonCard[] = [
  {
    id: "portfolio-card-featured",
    tagIds: ["portfolio-tag-featured-a", "portfolio-tag-featured-b", "portfolio-tag-featured-c"],
  },
  {
    id: "portfolio-card-platform",
    tagIds: ["portfolio-tag-platform-a", "portfolio-tag-platform-b", "portfolio-tag-platform-c"],
  },
  {
    id: "portfolio-card-product",
    tagIds: ["portfolio-tag-product-a", "portfolio-tag-product-b", "portfolio-tag-product-c"],
  },
] as const;

const ROADMAP_FILTER_PILL_IDS = [
  "roadmap-filter-track",
  "roadmap-filter-level",
  "roadmap-filter-focus",
] as const;

const ROADMAP_CLUSTER_IDS = [
  "roadmap-cluster-foundation",
  "roadmap-cluster-core",
  "roadmap-cluster-ecosystem",
] as const;

const ROADMAP_NODE_IDS = [
  "roadmap-node-foundations",
  "roadmap-node-language",
  "roadmap-node-ui",
  "roadmap-node-state",
  "roadmap-node-routing",
  "roadmap-node-data",
  "roadmap-node-styling",
  "roadmap-node-testing",
  "roadmap-node-performance",
  "roadmap-node-architecture",
] as const;

const CONTENT_PANEL_IDS = ["content-panel-primary", "content-panel-secondary"] as const;

function SkeletonLine({
  width,
  height,
  className,
}: SkeletonLineProps): JSX.Element {
  return (
    <span
      className={joinClassNames(styles.shimmerSurface, styles.line, className)}
      style={{
        width,
        height,
      }}
    />
  );
}

function renderHeroSkeleton(): JSX.Element {
  return (
    <div className={styles.heroLayout}>
      <div className={styles.heroMainColumn}>
        <div className={styles.heroHeadlineBlock}>
          <SkeletonLine width="22%" height="12px" />
          <SkeletonLine width="72%" height="clamp(24px, 3vw, 44px)" />
          <SkeletonLine width="64%" height="clamp(24px, 3vw, 44px)" />
          <SkeletonLine width="88%" height="14px" />
          <SkeletonLine width="76%" height="14px" />
        </div>

        <div className={styles.heroActionsRow}>
          <span className={joinClassNames(styles.shimmerSurface, styles.cta)} />
          <span
            className={joinClassNames(styles.shimmerSurface, styles.ctaMuted)}
          />
        </div>

        <div className={styles.heroMetaRow}>
          {HERO_META_PILL_IDS.map((pillId) => (
            <span
              key={pillId}
              className={joinClassNames(styles.shimmerSurface, styles.pill)}
            />
          ))}
        </div>
      </div>

      <div className={styles.heroAsideColumn}>
        <div
          className={joinClassNames(styles.shimmerSurface, styles.heroOrb)}
        />
        <div className={styles.heroSignalColumn}>
          {HERO_SIGNAL_BAR_IDS.map((signalBarId) => (
            <span
              key={signalBarId}
              className={joinClassNames(styles.shimmerSurface, styles.signalBar)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function renderPortfolioSkeleton(): JSX.Element {
  return (
    <div className={styles.portfolioLayout}>
      <div className={styles.portfolioRail}>
        <span
          className={joinClassNames(styles.shimmerSurface, styles.railLine)}
        />

        {PORTFOLIO_RAIL_DOT_IDS.map((dotId) => (
          <span
            key={dotId}
            className={joinClassNames(styles.shimmerSurface, styles.railDot)}
          />
        ))}
      </div>

      <div className={styles.portfolioCards}>
        {PORTFOLIO_SKELETON_CARDS.map((card) => (
          <article key={card.id} className={styles.card}>
            <div
              className={joinClassNames(styles.shimmerSurface, styles.cardMedia)}
            />

            <div className={styles.cardBody}>
              <SkeletonLine width="24%" height="11px" />
              <SkeletonLine width="66%" height="18px" />
              <SkeletonLine width="92%" height="12px" />
              <SkeletonLine width="78%" height="12px" />

              <div className={styles.cardTagRow}>
                {card.tagIds.map((tagId) => (
                  <span
                    key={tagId}
                    className={joinClassNames(styles.shimmerSurface, styles.tag)}
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function renderRoadMapSkeleton(): JSX.Element {
  return (
    <div className={styles.roadMapLayout}>
      <div className={styles.roadMapTopBar}>
        <SkeletonLine width="18%" height="11px" />

        <div className={styles.roadMapTopFilters}>
          {ROADMAP_FILTER_PILL_IDS.map((filterId) => (
            <span
              key={filterId}
              className={joinClassNames(styles.shimmerSurface, styles.filterPill)}
            />
          ))}
        </div>
      </div>

      <div className={styles.roadMapCanvas}>
        <div className={styles.roadMapClusterRow}>
          {ROADMAP_CLUSTER_IDS.map((clusterId) => (
            <span
              key={clusterId}
              className={joinClassNames(styles.shimmerSurface, styles.cluster)}
            />
          ))}
        </div>

        <div className={styles.roadMapNodeGrid}>
          {ROADMAP_NODE_IDS.map((nodeId) => (
            <span
              key={nodeId}
              className={joinClassNames(styles.shimmerSurface, styles.node)}
            />
          ))}
        </div>

        <div className={styles.connectionLayer} aria-hidden="true">
          <span className={styles.connectionA} />
          <span className={styles.connectionB} />
          <span className={styles.connectionC} />
        </div>
      </div>
    </div>
  );
}

function renderContentSkeleton(): JSX.Element {
  return (
    <div className={styles.contentLayout}>
      <div className={styles.contentHeader}>
        <SkeletonLine width="18%" height="11px" />
        <SkeletonLine width="38%" height="22px" />
      </div>

      <div className={styles.contentGrid}>
        {CONTENT_PANEL_IDS.map((panelId) => (
          <article key={panelId} className={styles.panel}>
            <SkeletonLine width="34%" height="16px" />
            <SkeletonLine width="92%" height="12px" />
            <SkeletonLine width="86%" height="12px" />
            <SkeletonLine width="74%" height="12px" />
          </article>
        ))}
      </div>
    </div>
  );
}

function renderSkeletonByVariant(
  variant: LandingSectionSkeletonVariant
): JSX.Element {
  switch (variant) {
    case "hero":
      return renderHeroSkeleton();

    case "portfolio":
      return renderPortfolioSkeleton();

    case "roadmap":
      return renderRoadMapSkeleton();

    case "content":
    default:
      return renderContentSkeleton();
  }
}

function LandingSectionSkeletonComponent({
  variant = "content",
  className,
  minHeight,
  fullHeight = true,
}: LandingSectionSkeletonProps): JSX.Element {
  return (
    <div
      className={joinClassNames(
        styles.root,
        fullHeight && styles.fullHeight,
        className
      )}
      style={{ minHeight }}
      aria-hidden="true"
      data-skeleton-variant={variant}
    >
      <div className={styles.backdropGlow} />
      <div className={styles.backdropGlowSecondary} />
      <div className={styles.inner}>{renderSkeletonByVariant(variant)}</div>
    </div>
  );
}

const LandingSectionSkeleton = memo(LandingSectionSkeletonComponent);

LandingSectionSkeleton.displayName = "LandingSectionSkeleton";

export default LandingSectionSkeleton;
