import React from "react";

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
  const handleSearchButtonClick = (): void => {
    const searchTarget = document.querySelector(
      "[data-technologies-search-target='true']",
    );

    if (searchTarget instanceof HTMLElement) {
      searchTarget.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      window.requestAnimationFrame(() => {
        searchTarget.focus?.();
      });

      return;
    }

    const filtersTarget = document.querySelector(
      "[data-technologies-filters='true']",
    );

    if (filtersTarget instanceof HTMLElement) {
      filtersTarget.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className={styles.viewport} aria-labelledby="technologies-title">
      <header className={styles.heroCompact}>
        <div className={styles.heroCompactCopy}>
          <p className={styles.eyebrow}>Engineering Capabilities</p>

          <h2 className={styles.titleCompact} id="technologies-title">
            Tecnologias e stacks com busca direta.
          </h2>
        </div>

        <div className={styles.heroCompactActions}>
          <button
            type="button"
            className={styles.searchTriggerButton}
            onClick={handleSearchButtonClick}
            aria-label="Buscar tecnologia"
          >
            Buscar tecnologia
          </button>
        </div>
      </header>

      <div
        className={styles.filtersBlockCompact}
        data-technologies-filters="true"
      >
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

      <div className={styles.desktopLayout}>
        <div className={styles.clustersColumn}>
          <div className={styles.clustersStack}>
            {clusters.map((cluster) => (
              <TechnologyClusterSection
                key={cluster.id}
                id={`technologies-cluster-${cluster.id}`}
                title={cluster.title}
                eyebrow={cluster.eyebrow}
                description={cluster.description}
                items={cluster.items}
                legendItems={cluster.legendItems}
                activeItemId={activeItem?.id ?? null}
                countLabel={cluster.countLabel}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </div>

        <aside className={styles.stickyAside}>
          <TechnologySpotlightPanel item={activeItem} />
        </aside>
      </div>
    </section>
  );
};

export default TechnologiesDesktop;
