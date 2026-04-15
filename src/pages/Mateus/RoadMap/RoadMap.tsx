import { useId, useMemo, useState } from "react";

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

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isReadingExpanded, setIsReadingExpanded] = useState(false);

  const filtersPanelId = useId();
  const readingPanelId = useId();

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

  const canvasMinHeight = isReadingExpanded ? 980 : 920;

  const initialAnchorNodeId = useMemo(
    () =>
      resolveInitialAnchorNodeId(
        visibleNodes,
        selectionApi.activeNodeId ?? null,
      ),
    [selectionApi.activeNodeId, visibleNodes],
  );

  return (
    <section className={joinClassNames(styles.root, className)}>
      <div className={styles.stack}>
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <strong className={styles.topBarTitle} title={graph.title}>
              {compactTitle}
            </strong>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={joinClassNames(
                styles.chromeToggle,
                isFiltersExpanded && styles.chromeToggleActive,
              )}
              onClick={() => setIsFiltersExpanded((current) => !current)}
              aria-expanded={isFiltersExpanded}
              aria-controls={filtersPanelId}
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
              onClick={() => setIsReadingExpanded((current) => !current)}
              aria-expanded={isReadingExpanded}
              aria-controls={readingPanelId}
            >
              <span>Leitura</span>
              <span className={styles.toggleChevron} aria-hidden="true">
                {isReadingExpanded ? "▴" : "▾"}
              </span>
            </button>
          </div>
        </div>

        {isFiltersExpanded ? (
          <div className={styles.topChrome}>
            <div id={filtersPanelId} className={styles.topPanel}>
              <div className={styles.chromeCard}>
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
            </div>
          </div>
        ) : null}

        <div
          className={joinClassNames(
            styles.contentGrid,
            isReadingExpanded
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
              isReadingExpanded
                ? styles.sideColumnExpanded
                : styles.sideColumnCollapsed,
            )}
          >
            {isReadingExpanded ? (
              <div id={readingPanelId} className={styles.sidePanelCard}>
                <div className={styles.sidePanelHeader}>
                  <div className={styles.sidePanelHeading}>
                    <span className={styles.sidePanelEyebrow}>Guia</span>
                    <h2 className={styles.sidePanelTitle}>Leitura</h2>
                  </div>

                  <button
                    type="button"
                    className={styles.sidePanelClose}
                    onClick={() => setIsReadingExpanded(false)}
                    aria-label="Fechar leitura"
                  >
                    ×
                  </button>
                </div>

                <div className={styles.sidePanelBody}>
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
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles.sideCollapsedTrigger}
                onClick={() => setIsReadingExpanded(true)}
                aria-expanded={false}
                aria-controls={readingPanelId}
                aria-label="Abrir guia de leitura"
                title="Abrir guia de leitura"
              >
                <span className={styles.sideCollapsedIcon} aria-hidden="true" />
              </button>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
