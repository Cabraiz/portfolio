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
  totalCount,
  clusterCount,
  summaryLabel,
  resultText,
  experienceRangeLabel,
  onChangeFilter,
  onResetFilter,
  onSelectItem,
}) => {
  return (
    <section className={styles.viewport} aria-labelledby="technologies-title">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Engineering Capabilities</p>

          <h2 className={styles.title} id="technologies-title">
            Stack hexagonal, leitura executiva e profundidade técnica real.
          </h2>

          <p className={styles.description}>
            Esta seção transforma a antiga lista de skills em uma capability
            matrix: clusters por domínio, filtro de leitura, cards hexagonais e
            um spotlight técnico para comunicar senioridade, repertório e
            contexto de entrega com mais força visual.
          </p>
        </div>

        <div className={styles.metricsRow}>
          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Tecnologias</span>
            <strong className={styles.metricValue}>{totalCount}</strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Clusters</span>
            <strong className={styles.metricValue}>{clusterCount}</strong>
          </article>

          <article className={styles.metricCard}>
            <span className={styles.metricLabel}>Janela de experiência</span>
            <strong className={styles.metricValue}>{experienceRangeLabel}</strong>
          </article>
        </div>
      </header>

      <div className={styles.filtersBlock}>
        <TechnologiesFilterBar
          items={filters}
          activeFilterId={activeFilterId}
          onChange={onChangeFilter}
          onReset={onResetFilter}
          summaryLabel={summaryLabel}
          resultText={resultText}
          title="Filtrar capacidades por domínio"
          description="Use os filtros para destacar blocos específicos da stack e mudar o foco do grid sem perder o contexto visual da seção."
          helperText="O spotlight acompanha a seleção atual e transforma o card ativo em uma leitura editorial mais profunda."
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
