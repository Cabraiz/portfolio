import { useId, useMemo, useState } from "react";

import { useRoadMapState } from "./application/hooks/useRoadMapState";
import { resolveRoadMapRelations } from "./application/services/resolveRoadMapRelations";
import { roadMapGraph } from "./domain/data";
import RoadMapCanvas from "./ui/canvas/RoadMapCanvas";
import RoadMapDetailsPanel from "./ui/chrome/RoadMapDetailsPanel";
import RoadMapFilters from "./ui/chrome/RoadMapFilters";
import RoadMapHeader from "./ui/chrome/RoadMapHeader";
import RoadMapLegend from "./ui/chrome/RoadMapLegend";
import styles from "./RoadMap.module.css";

type RoadMapMobileProps = Readonly<{
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

export default function RoadMapMobile({ className }: RoadMapMobileProps) {
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
    mobileBreakpoint: Number.MAX_SAFE_INTEGER,
  });

  const [isTopSummaryExpanded, setIsTopSummaryExpanded] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isReadingExpanded, setIsReadingExpanded] = useState(false);

  const topSummaryPanelId = useId();
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

  return (
    <section className={joinClassNames(styles.mobileRoot, className)}>
      <div className={styles.mobileStack}>
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
                isTopSummaryExpanded && styles.chromeToggleActive,
              )}
              onClick={() => setIsTopSummaryExpanded((current) => !current)}
              aria-expanded={isTopSummaryExpanded}
              aria-controls={topSummaryPanelId}
            >
              <span>Visão</span>
              <span className={styles.toggleChevron} aria-hidden="true">
                {isTopSummaryExpanded ? "▴" : "▾"}
              </span>
            </button>

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
              <span>Painel</span>
              <span className={styles.toggleChevron} aria-hidden="true">
                {isReadingExpanded ? "▴" : "▾"}
              </span>
            </button>
          </div>
        </div>

        {isTopSummaryExpanded || isFiltersExpanded ? (
          <div className={styles.mobileChromeStack}>
            {isTopSummaryExpanded ? (
              <div id={topSummaryPanelId} className={styles.topPanel}>
                <RoadMapHeader
                  title={graph.title}
                  subtitle={graph.subtitle}
                  visibleNodeCount={visibleNodes.length}
                  visibleEdgeCount={visibleEdges.length}
                  activeNodeLabel={selectionApi.activeNode?.label ?? null}
                />
              </div>
            ) : null}

            {isFiltersExpanded ? (
              <div id={filtersPanelId} className={styles.mobileChromeCard}>
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
            ) : null}
          </div>
        ) : null}

        <div className={styles.mobileCanvasBlock}>
          <RoadMapCanvas
            nodes={visibleNodes}
            edges={visibleEdges}
            clusters={visibleClusters}
            positionKey="mobile"
            activeNodeId={selectionApi.activeNodeId}
            hoveredNodeId={selectionApi.hoveredNodeId}
            onNodeSelect={selectionApi.selectNode}
            onNodeHover={selectionApi.hoverNode}
            minHeight={760}
            emptyTitle="Nenhum item disponível"
            emptyDescription="Ajuste os filtros para exibir tecnologias, práticas e conexões."
          />
        </div>

        {isReadingExpanded ? (
          <div id={readingPanelId} className={styles.mobileBottomPanel}>
            <div className={styles.mobileChromeCard}>
              <RoadMapLegend />
            </div>

            <div className={styles.mobileDetailsBlock}>
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
        ) : null}
      </div>
    </section>
  );
}
