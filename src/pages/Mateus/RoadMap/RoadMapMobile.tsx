import { useMemo } from "react";

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

function joinClassNames(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
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

  const resolvedRelations = useMemo(() => {
    if (!selectionApi.activeNodeId) {
      return null;
    }

    return resolveRoadMapRelations(graph, selectionApi.activeNodeId);
  }, [graph, selectionApi.activeNodeId]);

  return (
    <section className={joinClassNames(styles.root, className)}>
      <div className={styles.stack}>
        <RoadMapHeader
          title={graph.title}
          subtitle={graph.subtitle}
          visibleNodeCount={visibleNodes.length}
          visibleEdgeCount={visibleEdges.length}
          activeNodeLabel={selectionApi.activeNode?.label ?? null}
        />

        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <div className={styles.chromeBlock}>
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

          <aside className={styles.sideColumn}>
            <div className={styles.chromeBlock}>
              <RoadMapLegend />
            </div>

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
          </aside>
        </div>
      </div>
    </section>
  );
}
