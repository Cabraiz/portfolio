import {
  createRoadMapNodeMap,
  getRoadMapNodeLineage,
  getRoadMapRelatedNodes,
  selectRoadMapFilteredGraph,
  sortRoadMapEdges,
  sortRoadMapNodes,
} from "../../domain/model/roadmap.selectors";
import type {
  RoadMapFilterState,
  RoadMapFilteredGraph,
  RoadMapGraph,
  RoadMapNode,
} from "../../domain/model/roadmap.types";

export type FilterRoadMapGraphOptions = Readonly<{
  includeAncestors?: boolean;
  includeRelated?: boolean;
}>;

function uniqueNodeIds(nodes: readonly RoadMapNode[]): Set<string> {
  return new Set(nodes.map((node) => node.id));
}

function expandWithAncestors(
  graph: RoadMapGraph,
  nodeIds: Set<string>,
): Set<string> {
  const expandedIds = new Set(nodeIds);

  for (const nodeId of nodeIds) {
    const lineage = getRoadMapNodeLineage(graph, nodeId);

    for (const lineageNode of lineage) {
      expandedIds.add(lineageNode.id);
    }
  }

  return expandedIds;
}

function expandWithRelated(
  graph: RoadMapGraph,
  nodeIds: Set<string>,
): Set<string> {
  const expandedIds = new Set(nodeIds);

  for (const nodeId of nodeIds) {
    const relatedNodes = getRoadMapRelatedNodes(graph, nodeId);

    for (const relatedNode of relatedNodes) {
      expandedIds.add(relatedNode.id);
    }
  }

  return expandedIds;
}

export function filterRoadMapGraph(
  graph: RoadMapGraph,
  filters: Partial<RoadMapFilterState> = {},
  options: FilterRoadMapGraphOptions = {},
): RoadMapFilteredGraph {
  const {
    includeAncestors = true,
    includeRelated = false,
  } = options;

  const baseFilteredGraph = selectRoadMapFilteredGraph(graph, filters);

  let visibleNodeIds = uniqueNodeIds(baseFilteredGraph.visibleNodes);

  if (includeAncestors && visibleNodeIds.size > 0) {
    visibleNodeIds = expandWithAncestors(graph, visibleNodeIds);
  }

  if (includeRelated && visibleNodeIds.size > 0) {
    visibleNodeIds = expandWithRelated(graph, visibleNodeIds);
  }

  const nodeMap = createRoadMapNodeMap(graph);

  const visibleNodes = sortRoadMapNodes(
    Array.from(visibleNodeIds)
      .map((nodeId) => nodeMap.get(nodeId))
      .filter((node): node is RoadMapNode => Boolean(node)),
  );

  const visibleEdgeIds = new Set(baseFilteredGraph.visibleEdges.map((edge) => edge.id));

  const visibleEdges = sortRoadMapEdges(
    graph.edges.filter((edge) => {
      const bothEndsVisible =
        visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);

      if (!bothEndsVisible) {
        return false;
      }

      if (visibleEdgeIds.size === 0) {
        return false;
      }

      return visibleEdgeIds.has(edge.id);
    }),
  );

  const visibleClusters = (graph.clusters ?? [])
    .map((cluster) => {
      const nextNodeIds = cluster.nodeIds.filter((nodeId) =>
        visibleNodeIds.has(nodeId),
      );

      return {
        ...cluster,
        nodeIds: nextNodeIds,
      };
    })
    .filter((cluster) => cluster.nodeIds.length > 0);

  return {
    graph,
    nodeMap: createRoadMapNodeMap(graph),
    edgeMap: baseFilteredGraph.edgeMap,
    visibleNodes,
    visibleEdges,
    visibleClusters,
  };
}
