// src/pages/Mateus/RoadMap/application/hooks/useRoadMapState.ts
import { useEffect, useMemo } from "react";

import { getRoadMapRootNodes } from "../../domain/model/roadmap.selectors";
import type {
  RoadMapFilterState,
  RoadMapGraph,
} from "../../domain/model/roadmap.types";
import { computeRoadMapLayout } from "../services/computeRoadMapLayout";
import { filterRoadMapGraph } from "../services/filterRoadMapGraph";
import { useRoadMapFilters } from "./useRoadMapFilters";
import { useRoadMapSelection } from "./useRoadMapSelection";
import { useRoadMapViewport } from "./useRoadMapViewport";

type UseRoadMapStateParams = Readonly<{
  graph: RoadMapGraph;
  initialFilters?: Partial<RoadMapFilterState>;
  initialActiveNodeId?: string | null;
  autoSelectFirstVisibleNode?: boolean;
  mobileBreakpoint?: number;
  includeAncestors?: boolean;
  includeRelated?: boolean;
}>;

type FilteredGraphResult = ReturnType<typeof filterRoadMapGraph>;
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
  includeAncestors = true,
  includeRelated = false,
}: UseRoadMapStateParams): UseRoadMapStateResult {
  const viewport = useRoadMapViewport({ mobileBreakpoint });

  const filtersApi = useRoadMapFilters({
    initialFilters,
  });

  const resolvedGraph = useMemo(
    () => computeRoadMapLayout(graph),
    [graph],
  );

  const filteredGraph = useMemo(
    () =>
      filterRoadMapGraph(resolvedGraph, filtersApi.filters, {
        includeAncestors,
        includeRelated,
      }),
    [resolvedGraph, filtersApi.filters, includeAncestors, includeRelated],
  );

  const selectionApi = useRoadMapSelection({
    graph: resolvedGraph,
    initialActiveNodeId,
  });

  const rootNodes = useMemo<RootNodesResult>(
    () => getRoadMapRootNodes(resolvedGraph),
    [resolvedGraph],
  );

  const visibleNodeIds = useMemo(
    () => new Set(filteredGraph.visibleNodes.map((node) => node.id)),
    [filteredGraph.visibleNodes],
  );

  const resolvedActiveNodeId = useMemo(() => {
    const currentActiveNodeId = selectionApi.activeNodeId;

    if (currentActiveNodeId && visibleNodeIds.has(currentActiveNodeId)) {
      return currentActiveNodeId;
    }

    if (!autoSelectFirstVisibleNode) {
      return null;
    }

    return filteredGraph.visibleNodes[0]?.id ?? null;
  }, [
    autoSelectFirstVisibleNode,
    filteredGraph.visibleNodes,
    selectionApi.activeNodeId,
    visibleNodeIds,
  ]);

  useEffect(() => {
    const currentActiveNodeId = selectionApi.activeNodeId;

    if (!resolvedActiveNodeId) {
      if (currentActiveNodeId) {
        selectionApi.clearSelection();
      }

      return;
    }

    if (currentActiveNodeId !== resolvedActiveNodeId) {
      selectionApi.selectNode(resolvedActiveNodeId);
    }
  }, [
    resolvedActiveNodeId,
    selectionApi.activeNodeId,
    selectionApi.clearSelection,
    selectionApi.selectNode,
  ]);

  return {
    graph: resolvedGraph,
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
