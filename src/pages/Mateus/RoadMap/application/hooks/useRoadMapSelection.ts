import { useCallback, useMemo, useState } from "react";

import {
  getRoadMapChildren,
  getRoadMapDescendants,
  getRoadMapNodeById,
  getRoadMapNodeLineage,
  getRoadMapParent,
  getRoadMapRelatedNodes,
} from "../../domain/model/roadmap.selectors";
import type {
  RoadMapGraph,
  RoadMapNode,
} from "../../domain/model/roadmap.types";

type UseRoadMapSelectionParams = Readonly<{
  graph: RoadMapGraph;
  initialActiveNodeId?: string | null;
}>;

type UseRoadMapSelectionResult = Readonly<{
  activeNodeId: string | null;
  hoveredNodeId: string | null;
  activeNode: RoadMapNode | null;
  hoveredNode: RoadMapNode | null;
  parentNode: RoadMapNode | null;
  childNodes: readonly RoadMapNode[];
  relatedNodes: readonly RoadMapNode[];
  lineageNodes: readonly RoadMapNode[];
  descendantNodes: readonly RoadMapNode[];
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  clearSelection: () => void;
  clearHover: () => void;
  isNodeActive: (nodeId: string) => boolean;
  isNodeHovered: (nodeId: string) => boolean;
}>;

export function useRoadMapSelection({
  graph,
  initialActiveNodeId = null,
}: UseRoadMapSelectionParams): UseRoadMapSelectionResult {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    initialActiveNodeId,
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const activeNode = useMemo(
    () => getRoadMapNodeById(graph, activeNodeId),
    [graph, activeNodeId],
  );

  const hoveredNode = useMemo(
    () => getRoadMapNodeById(graph, hoveredNodeId),
    [graph, hoveredNodeId],
  );

  const parentNode = useMemo(() => {
    if (!activeNodeId) {
      return null;
    }

    return getRoadMapParent(graph, activeNodeId);
  }, [graph, activeNodeId]);

  const childNodes = useMemo(() => {
    if (!activeNodeId) {
      return [];
    }

    return getRoadMapChildren(graph, activeNodeId);
  }, [graph, activeNodeId]);

  const relatedNodes = useMemo(() => {
    if (!activeNodeId) {
      return [];
    }

    return getRoadMapRelatedNodes(graph, activeNodeId);
  }, [graph, activeNodeId]);

  const lineageNodes = useMemo(() => {
    if (!activeNodeId) {
      return [];
    }

    return getRoadMapNodeLineage(graph, activeNodeId);
  }, [graph, activeNodeId]);

  const descendantNodes = useMemo(() => {
    if (!activeNodeId) {
      return [];
    }

    return getRoadMapDescendants(graph, activeNodeId);
  }, [graph, activeNodeId]);

  const selectNode = useCallback((nodeId: string | null) => {
    setActiveNodeId(nodeId);
  }, []);

  const hoverNode = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveNodeId(null);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const isNodeActive = useCallback(
    (nodeId: string) => activeNodeId === nodeId,
    [activeNodeId],
  );

  const isNodeHovered = useCallback(
    (nodeId: string) => hoveredNodeId === nodeId,
    [hoveredNodeId],
  );

  return {
    activeNodeId,
    hoveredNodeId,
    activeNode,
    hoveredNode,
    parentNode,
    childNodes,
    relatedNodes,
    lineageNodes,
    descendantNodes,
    selectNode,
    hoverNode,
    clearSelection,
    clearHover,
    isNodeActive,
    isNodeHovered,
  };
}
