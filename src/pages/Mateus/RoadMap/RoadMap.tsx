import { useId, useMemo, useState } from "react";

import { roadMapGraph } from "./domain/data";
import { resolveRoadMapRelations } from "./application/services/resolveRoadMapRelations";
import { useRoadMapState } from "./application/hooks/useRoadMapState";
import RoadMapCanvas from "./ui/canvas/RoadMapCanvas";
import RoadMapDetailsPanel from "./ui/chrome/RoadMapDetailsPanel";
import RoadMapFilters from "./ui/chrome/RoadMapFilters";
import RoadMapHeader from "./ui/chrome/RoadMapHeader";
import RoadMapLegend from "./ui/chrome/RoadMapLegend";
import styles from "./RoadMap.module.css";

type RoadMapProps = Readonly<{
  className?: string;
}>;

type SidePane = "legend" | "details" | null;

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

  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [activeSidePane, setActiveSidePane] = useState<SidePane>(null);

  const headerPanelId = useId();
  const filtersPanelId = useId();
  const sideDrawerId = useId();

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

  const activeSidePaneTitle =
    activeSidePane === "legend"
      ? "Legenda"
      : activeSidePane === "details"
      ? "Detalhes"
      : null;

  const hasSelectedNode = Boolean(selectionApi.activeNode);

  const handleSidePaneToggle = (pane: Exclude<SidePane, null>) => {
    setActiveSidePane((currentPane) => (currentPane === pane ? null : pane));
  };

  return (
    <section className={joinClassNames(styles.root, className)}>
      <div className={styles.stack}>
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <strong className={styles.topBarTitle}>{compactTitle}</strong>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={joinClassNames(
                styles.chromeToggle,
                isHeaderExpanded && styles.chromeToggleActive
              )}
              onClick={() => setIsHeaderExpanded((current) => !current)}
              aria-expanded={isHeaderExpanded}
              aria-controls={headerPanelId}
            >
              <span>Resumo</span>

              <span className={styles.toggleChevron} aria-hidden="true">
                {isHeaderExpanded ? "▴" : "▾"}
              </span>
            </button>

            <button
              type="button"
              className={joinClassNames(
                styles.chromeToggle,
                isFiltersExpanded && styles.chromeToggleActive
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
          </div>
        </div>

        <div className={styles.topChrome}>
          <div
            id={headerPanelId}
            className={joinClassNames(
              styles.topPanel,
              isHeaderExpanded && styles.topPanelExpanded
            )}
          >
            <div className={styles.topPanelInner}>
              <div className={styles.chromeCard}>
                <RoadMapHeader
                  title={graph.title}
                  subtitle={graph.subtitle}
                  visibleNodeCount={visibleNodes.length}
                  visibleEdgeCount={visibleEdges.length}
                  activeNodeLabel={selectionApi.activeNode?.label ?? null}
                />
              </div>
            </div>
          </div>

          <div
            id={filtersPanelId}
            className={joinClassNames(
              styles.topPanel,
              isFiltersExpanded && styles.topPanelExpanded
            )}
          >
            <div className={styles.topPanelInner}>
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
        </div>

        <div className={styles.contentGrid}>
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
                minHeight={920}
                emptyTitle="Nenhum item disponível"
                emptyDescription="Ajuste os filtros para exibir tecnologias, conceitos e relações."
              />
            </div>
          </div>

          <aside
            className={joinClassNames(
              styles.sideColumn,
              activeSidePane && styles.sideColumnExpanded
            )}
          >
            <div className={styles.sideDrawerWrap}>
              <div
                id={sideDrawerId}
                className={joinClassNames(
                  styles.sideDrawer,
                  activeSidePane && styles.sideDrawerExpanded
                )}
                aria-hidden={!activeSidePane}
              >
                {activeSidePane ? (
                  <div className={styles.drawerShell}>
                    <div className={styles.drawerHeader}>
                      <h3 className={styles.drawerTitle}>{activeSidePaneTitle}</h3>

                      <button
                        type="button"
                        className={styles.drawerCloseButton}
                        onClick={() => setActiveSidePane(null)}
                        aria-label="Fechar painel lateral"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className={styles.drawerContent}>
                      {activeSidePane === "legend" ? (
                        <div className={styles.chromeBlock}>
                          <RoadMapLegend />
                        </div>
                      ) : (
                        <div className={styles.chromeBlock}>
                          <RoadMapDetailsPanel
                            node={selectionApi.activeNode}
                            parentNode={selectionApi.parentNode}
                            childNodes={selectionApi.childNodes}
                            relatedNodes={selectionApi.relatedNodes}
                            lineageNodes={selectionApi.lineageNodes}
                            resolvedRelations={resolvedRelations}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.sideRail}>
              <button
                type="button"
                className={joinClassNames(
                  styles.sideRailButton,
                  activeSidePane === "legend" && styles.sideRailButtonActive
                )}
                onClick={() => handleSidePaneToggle("legend")}
                aria-expanded={activeSidePane === "legend"}
                aria-controls={sideDrawerId}
              >
                <span className={styles.sideRailLabel}>Legenda</span>
              </button>

              <button
                type="button"
                className={joinClassNames(
                  styles.sideRailButton,
                  activeSidePane === "details" && styles.sideRailButtonActive
                )}
                onClick={() => handleSidePaneToggle("details")}
                aria-expanded={activeSidePane === "details"}
                aria-controls={sideDrawerId}
              >
                <span className={styles.sideRailLabel}>Detalhes</span>

                {hasSelectedNode ? (
                  <span className={styles.sideRailBadge} aria-hidden="true">
                    1
                  </span>
                ) : null}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
