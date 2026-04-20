import { useMemo, useState } from "react";

import { useRoadMapState } from "./application/hooks/useRoadMapState";
import { resolveRoadMapRelations } from "./application/services/resolveRoadMapRelations";
import { roadMapGraph } from "./domain/data";
import type { RoadMapNode } from "./domain/model/roadmap.types";
import RoadMapCanvas from "./ui/canvas/RoadMapCanvas";
import RoadMapDetailsPanel from "./ui/chrome/RoadMapDetailsPanel";
import RoadMapFilters from "./ui/chrome/RoadMapFilters";
import RoadMapLegend from "./ui/chrome/RoadMapLegend";
import styles from "./RoadMap.module.css";

type RoadMapProps = Readonly<{
  className?: string;
}>;

function joinClassNames(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
}

function resolveCompactTitle(title: string): string {
  return title
    .replace(/^roadmap de tecnologias\s*/i, "")
    .replace(/^roadmap de\s*/i, "")
    .replace(/^roadmap\s*/i, "")
    .trim();
}

function readStringField(node: RoadMapNode, field: string): string | null {
  const value = (node as Record<string, unknown>)[field];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readNumberField(node: RoadMapNode, field: string): number | null {
  const value = (node as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveInitialAnchorNodeId(
  nodes: readonly RoadMapNode[],
  activeNodeId?: string | null,
): string | null {
  if (activeNodeId && nodes.some((node) => node.id === activeNodeId)) {
    return activeNodeId;
  }

  const explicitRoot =
    nodes.find((node) => {
      const kind = readStringField(node, "kind");
      const type = readStringField(node, "type");
      const tipo = readStringField(node, "tipo");

      return (
        kind === "main" ||
        kind === "root" ||
        type === "main" ||
        type === "root" ||
        tipo === "main" ||
        tipo === "root"
      );
    }) ?? null;

  if (explicitRoot) {
    return explicitRoot.id;
  }

  const tierOneNode =
    nodes.find((node) => {
      const tier = readNumberField(node, "tier");
      return tier === 1;
    }) ?? null;

  if (tierOneNode) {
    return tierOneNode.id;
  }

  return nodes[0]?.id ?? null;
}

export default function RoadMap({ className }: RoadMapProps) {
  const {
    graph,
    visibleNodes,
    visibleEdges,
    visibleClusters,
    filtersApi,
    selectionApi,
  } = useRoadMapState({
    graph: roadMapGraph,
    autoSelectFirstVisibleNode: true,
  });

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isReadingExpanded, setIsReadingExpanded] = useState(true);

  const resolvedRelations = useMemo(() => {
    if (!selectionApi.activeNodeId) {
      return null;
    }

    return resolveRoadMapRelations(graph, selectionApi.activeNodeId);
  }, [graph, selectionApi.activeNodeId]);

  const compactTitle = useMemo(() => {
    const normalized = resolveCompactTitle(graph.title);
    return normalized || graph.title;
  }, [graph.title]);

  const isSidePanelExpanded = isFiltersExpanded || isReadingExpanded;
  const canvasMinHeight = isSidePanelExpanded ? 980 : 920;

  const initialAnchorNodeId = useMemo(
    () =>
      resolveInitialAnchorNodeId(
        visibleNodes,
        selectionApi.activeNodeId ?? null,
      ),
    [selectionApi.activeNodeId, visibleNodes],
  );

  const openWorkspacePanel = () => {
    setIsFiltersExpanded(true);
    setIsReadingExpanded(true);
  };

  const toggleFiltersPanel = () => {
    setIsFiltersExpanded((current) => !current);
  };

  const toggleReadingPanel = () => {
    setIsReadingExpanded((current) => !current);
  };

  const closeSidePanel = () => {
    setIsFiltersExpanded(false);
    setIsReadingExpanded(false);
  };

  return (
    <section className={joinClassNames(styles.root, className)}>
      <div className={styles.stack}>
        <div
          className={joinClassNames(
            styles.contentGrid,
            isSidePanelExpanded
              ? styles.contentGridSideExpanded
              : styles.contentGridSideCollapsed,
          )}
        >
          <div className={styles.mainColumn}>
            <div className={styles.canvasBlock}>
              <RoadMapCanvas
                nodes={visibleNodes}
                edges={visibleEdges}
                clusters={visibleClusters}
                positionKey="desktop"
                activeNodeId={selectionApi.activeNodeId}
                hoveredNodeId={selectionApi.hoveredNodeId}
                onNodeSelect={selectionApi.selectNode}
                onNodeHover={selectionApi.hoverNode}
                minHeight={canvasMinHeight}
                initialAnchorNodeId={initialAnchorNodeId}
                emptyTitle="Nenhum item disponível"
                emptyDescription="Ajuste os filtros para exibir tecnologias, práticas e conexões."
              />
            </div>
          </div>

          <aside
            className={joinClassNames(
              styles.sideColumn,
              isSidePanelExpanded
                ? styles.sideColumnExpanded
                : styles.sideColumnCollapsed,
            )}
          >
            {isSidePanelExpanded ? (
              <div className={styles.sidePanelCard}>
                <div
                  className={styles.sideTitleCard}
                  title={graph.title}
                  aria-label={graph.title}
                >
                  <strong className={styles.sideTitleText}>{compactTitle}</strong>
                </div>

                <div className={styles.sidePanelHeader}>
                  <div className={styles.sidePanelHeading}>
                    <h2 className={styles.sidePanelTitle}>Navegação</h2>
                    <p className={styles.sidePanelDescription}>
                      Controle os filtros e consulte os detalhes do tópico selecionado.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.sidePanelClose}
                    onClick={closeSidePanel}
                    aria-label="Fechar painel lateral"
                  >
                    ×
                  </button>
                </div>

                <div className={styles.sidePanelToggles}>
                  <button
                    type="button"
                    className={joinClassNames(
                      styles.chromeToggle,
                      isFiltersExpanded && styles.chromeToggleActive,
                    )}
                    onClick={toggleFiltersPanel}
                    aria-expanded={isFiltersExpanded}
                  >
                    <span>Filtros</span>

                    {filtersApi.activeFilterCount > 0 ? (
                      <span className={styles.toggleCount}>
                        {filtersApi.activeFilterCount}
                      </span>
                    ) : null}

                    <span className={styles.toggleChevron} aria-hidden="true">
                      {isFiltersExpanded ? "▴" : "▾"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={joinClassNames(
                      styles.chromeToggle,
                      isReadingExpanded && styles.chromeToggleActive,
                    )}
                    onClick={toggleReadingPanel}
                    aria-expanded={isReadingExpanded}
                  >
                    <span>Leitura</span>
                    <span className={styles.toggleChevron} aria-hidden="true">
                      {isReadingExpanded ? "▴" : "▾"}
                    </span>
                  </button>
                </div>

                <div className={styles.sidePanelBody}>
                  {isFiltersExpanded ? (
                    <section className={styles.sideSection}>
                      <div className={styles.sideSectionHeader}>
                        <h3 className={styles.sideSectionTitle}>Filtros</h3>
                      </div>

                      <div className={styles.sideFiltersBlock}>
                        <RoadMapFilters
                          filters={filtersApi.filters}
                          activeFilterCount={filtersApi.activeFilterCount}
                          onQueryChange={filtersApi.setQuery}
                          onReset={filtersApi.resetFilters}
                          onToggleCategory={filtersApi.toggleCategory}
                          onToggleDemand={filtersApi.toggleDemand}
                          onToggleKind={filtersApi.toggleKind}
                          onToggleSignal={filtersApi.toggleSignal}
                          onToggleRelationType={filtersApi.toggleRelationType}
                          onShowDeprecatedChange={filtersApi.setShowDeprecated}
                          onShowHiddenChange={filtersApi.setShowHidden}
                        />
                      </div>
                    </section>
                  ) : null}

                  {isReadingExpanded ? (
                    <section className={styles.sideSection}>
                      <div className={styles.sideSectionHeader}>
                        <h3 className={styles.sideSectionTitle}>Leitura</h3>
                      </div>

                      <div className={styles.sideLegendBlock}>
                        <RoadMapLegend />
                      </div>

                      <div className={styles.sideDetailsBlock}>
                        <RoadMapDetailsPanel
                          node={selectionApi.activeNode}
                          parentNode={selectionApi.parentNode}
                          childNodes={selectionApi.childNodes}
                          relatedNodes={selectionApi.relatedNodes}
                          lineageNodes={selectionApi.lineageNodes}
                          resolvedRelations={resolvedRelations}
                        />
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={styles.sideCollapsedRail}>
                <div
                  className={styles.sideCollapsedTitleCard}
                  title={graph.title}
                  aria-label={graph.title}
                >
                  <strong className={styles.sideCollapsedTitleText}>
                    {compactTitle}
                  </strong>
                </div>

                <button
                  type="button"
                  className={styles.sideCollapsedPrimaryAction}
                  onClick={openWorkspacePanel}
                  aria-label="Abrir navegação do roadmap"
                  title="Abrir navegação"
                >
                  <span
                    className={styles.sideCollapsedPrimaryActionIcon}
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
