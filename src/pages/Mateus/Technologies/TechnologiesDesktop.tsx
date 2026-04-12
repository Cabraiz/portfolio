import React, { useMemo, useRef } from "react";

import type { TechnologiesPresentationProps } from "./Technologies";
import useTechnologiesDesktopMotion from "./hooks/useTechnologiesDesktopMotion";
import styles from "./TechnologiesSection.module.css";
import TechnologyClusterSection from "./ui/clusters/TechnologyClusterSection";
import TechnologiesFilterBar from "./ui/filters/TechnologiesFilterBar";
import TechnologySpotlightPanel from "./ui/spotlight/TechnologySpotlightPanel";

const TechnologiesDesktop: React.FC<TechnologiesPresentationProps> = ({
  filters,
  activeFilterId,
  activeItem,
  clusters,
  onChangeFilter,
  onResetFilter,
  onSelectItem,
}) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const clustersStackRef = useRef<HTMLDivElement | null>(null);

  const activeClusterId = useMemo(() => {
    if (!activeItem) {
      return null;
    }

    const ownerCluster = clusters.find((cluster) =>
      cluster.items.some((item) => item.id === activeItem.id),
    );

    return ownerCluster?.id ?? null;
  }, [activeItem, clusters]);

  useTechnologiesDesktopMotion({
    rootRef,
    clustersStackRef,
    activeClusterId,
    enabled: true,
  });

  return (
    <section
      ref={rootRef}
      className={styles.viewport}
      aria-labelledby="technologies-title"
      data-technologies-desktop-root="true"
    >
      <header className={styles.heroCompact}>
        <div className={styles.heroCompactCopy}>
          <p className={styles.eyebrow}>Engineering Capabilities</p>

          <h2 className={styles.titleCompact} id="technologies-title">
            Tecnologias e stacks com busca direta.
          </h2>
        </div>

        <div
          className={styles.heroCompactFilters}
          data-technologies-filters="true"
        >
          <div className={styles.filtersHeroPanel}>
            <TechnologiesFilterBar
              items={filters}
              activeFilterId={activeFilterId}
              onChange={onChangeFilter}
              onReset={onResetFilter}
              summaryLabel=""
              resultText=""
              title=""
              description=""
              helperText=""
            />
          </div>
        </div>
      </header>

      <div className={styles.desktopLayout}>
        <div className={styles.clustersColumn}>
          <div
            ref={clustersStackRef}
            className={styles.clustersStack}
            data-technologies-clusters-stack="true"
          >
            {clusters.map((cluster, clusterIndex) => (
              <TechnologyClusterSection
                key={cluster.id}
                id={`technologies-cluster-${cluster.id}`}
                clusterId={cluster.id}
                title={cluster.title}
                eyebrow={cluster.eyebrow}
                description={cluster.description}
                items={cluster.items}
                activeItemId={activeItem?.id ?? null}
                isActiveCluster={activeClusterId === cluster.id}
                clusterIndex={clusterIndex}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </div>

        <aside className={styles.stickyAside}>
          <div className={styles.stickyAsideInner}>
            <TechnologySpotlightPanel item={activeItem} />
          </div>
        </aside>
      </div>
    </section>
  );
};

export default TechnologiesDesktop;
