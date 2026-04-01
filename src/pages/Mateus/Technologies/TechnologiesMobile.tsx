import React from "react";

import TechnologyClusterSection from "./ui/clusters/TechnologyClusterSection";
import TechnologiesFilterBar from "./ui/filters/TechnologiesFilterBar";
import TechnologySpotlightPanel from "./ui/spotlight/TechnologySpotlightPanel";
import styles from "./TechnologiesSection.module.css";
import type { TechnologiesPresentationProps } from "./Technologies";

const TechnologiesMobile: React.FC<TechnologiesPresentationProps> = ({
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
    <section className={styles.viewport} aria-labelledby="technologies-title-mobile">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Engineering Capabilities</p>

          <h2 className={styles.title} id="technologies-title-mobile">
            Skills com cara de produto, leitura rápida e profundidade visual.
          </h2>

          <p className={styles.description}>
            No mobile, a experiência vira uma trilha mais editorial: filtros no
            topo, spotlight logo depois e clusters em sequência para manter boa
            leitura sem sacrificar densidade técnica.
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
            <span className={styles.metricLabel}>Experiência</span>
            <strong className={styles.metricValue}>{experienceRangeLabel}</strong>
          </article>
        </div>
      </header>

      <div className={styles.mobileStack}>
        <TechnologiesFilterBar
          items={filters}
          activeFilterId={activeFilterId}
          onChange={onChangeFilter}
          onReset={onResetFilter}
          summaryLabel={summaryLabel}
          resultText={resultText}
          title="Filtrar tecnologias"
          description="Ajuste a leitura por domínio e use o spotlight como painel principal do item selecionado."
          helperText="A navegação mobile mantém o foco na tecnologia ativa e nos clusters visíveis."
        />

        <TechnologySpotlightPanel item={activeItem} />

        <div className={styles.clustersStack}>
          {clusters.map((cluster) => (
            <TechnologyClusterSection
              key={cluster.id}
              id={`technologies-cluster-mobile-${cluster.id}`}
              title={cluster.title}
              eyebrow={cluster.eyebrow}
              description={cluster.description}
              items={cluster.items}
              legendItems={cluster.legendItems}
              activeItemId={activeItem?.id ?? null}
              countLabel={cluster.countLabel}
              dense
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologiesMobile;
