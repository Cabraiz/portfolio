import { useEffect, useMemo } from "react";

import {
  getRoadMapRootNodes,
  selectRoadMapFilteredGraph,
} from "../../domain/model/roadmap.selectors";
import type {
  RoadMapFilterState,
  RoadMapGraph,
} from "../../domain/model/roadmap.types";
import { useRoadMapFilters } from "./useRoadMapFilters";
import { useRoadMapSelection } from "./useRoadMapSelection";
import { useRoadMapViewport } from "./useRoadMapViewport";

type UseRoadMapStateParams = Readonly<{
  graph: RoadMapGraph;
  initialFilters?: Partial<RoadMapFilterState>;
  initialActiveNodeId?: string | null;
  autoSelectFirstVisibleNode?: boolean;
  mobileBreakpoint?: number;
}>;

type FilteredGraphResult = ReturnType<typeof selectRoadMapFilteredGraph>;
type RootNodesResult = ReturnType<typeof getRoadMapRootNodes>;

type UseRoadMapStateResult = Readonly<{
  graph: RoadMapGraph;
  filteredGraph: FilteredGraphResult;
  rootNodes: RootNodesResult;
  visibleNodes: FilteredGraphResult["visibleNodes"];
  visibleEdges: FilteredGraphResult["visibleEdges"];
  visibleClusters: FilteredGraphResult["visibleClusters"];
  viewport: ReturnType<typeof useRoadMapViewport>;
  filtersApi: ReturnType<typeof useRoadMapFilters>;
  selectionApi: ReturnType<typeof useRoadMapSelection>;
}>;

export function useRoadMapState({
  graph,
  initialFilters,
  initialActiveNodeId = null,
  autoSelectFirstVisibleNode = true,
  mobileBreakpoint,
}: UseRoadMapStateParams): UseRoadMapStateResult {
  const viewport = useRoadMapViewport({ mobileBreakpoint });

  const filtersApi = useRoadMapFilters({
    initialFilters,
  });

  const filteredGraph = useMemo(
    () => selectRoadMapFilteredGraph(graph, filtersApi.filters),
    [graph, filtersApi.filters],
  );

  const selectionApi = useRoadMapSelection({
    graph,
    initialActiveNodeId,
  });

  const rootNodes = useMemo<RootNodesResult>(() => getRoadMapRootNodes(graph), [
    graph,
  ]);

  const visibleNodeIds = useMemo(
    () => new Set(filteredGraph.visibleNodes.map((node) => node.id)),
    [filteredGraph.visibleNodes],
  );

  useEffect(() => {
    if (!selectionApi.activeNodeId) {
      return;
    }

    if (!visibleNodeIds.has(selectionApi.activeNodeId)) {
      selectionApi.clearSelection();
    }
  }, [selectionApi.activeNodeId, selectionApi.clearSelection, visibleNodeIds]);

  useEffect(() => {
    if (!autoSelectFirstVisibleNode) {
      return;
    }

    if (selectionApi.activeNodeId) {
      return;
    }

    const firstVisibleNode = filteredGraph.visibleNodes[0];
    if (!firstVisibleNode) {
      return;
    }

    selectionApi.selectNode(firstVisibleNode.id);
  }, [
    autoSelectFirstVisibleNode,
    filteredGraph.visibleNodes,
    selectionApi.activeNodeId,
    selectionApi.selectNode,
  ]);

  return {
    graph,
    filteredGraph,
    rootNodes,
    visibleNodes: filteredGraph.visibleNodes,
    visibleEdges: filteredGraph.visibleEdges,
    visibleClusters: filteredGraph.visibleClusters,
    viewport,
    filtersApi,
    selectionApi,
  };
}
