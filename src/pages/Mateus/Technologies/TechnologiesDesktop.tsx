import React, { useMemo } from "react";

import TechnologyClusterSection from "./ui/clusters/TechnologyClusterSection";
import TechnologiesFilterBar from "./ui/filters/TechnologiesFilterBar";
import TechnologySpotlightPanel from "./ui/spotlight/TechnologySpotlightPanel";
import styles from "./TechnologiesSection.module.css";
import type { TechnologiesPresentationProps } from "./Technologies";

const TechnologiesDesktop: React.FC<TechnologiesPresentationProps> = ({
  filters,
  activeFilterId,
  activeItem,
  clusters,
  onChangeFilter,
  onResetFilter,
  onSelectItem,
}) => {
  const activeClusterId = useMemo(() => {
    if (!activeItem) {
      return null;
    }

    const ownerCluster = clusters.find((cluster) =>
      cluster.items.some((item) => item.id === activeItem.id),
    );

    return ownerCluster?.id ?? null;
  }, [activeItem, clusters]);

  return (
    <section className={styles.viewport} aria-labelledby="technologies-title">
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
          <div className={styles.clustersStack}>
            {clusters.map((cluster, clusterIndex) => (
              <TechnologyClusterSection
                key={cluster.id}
                id={`technologies-cluster-${cluster.id}`}
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
