// src/pages/Mateus/RoadMap/application/services/filterRoadMapGraph.ts
import { ROADMAP_DEFAULT_FILTERS } from "../../domain/model/roadmap.constants";
import {
  createRoadMapNodeMap,
  getRoadMapNodeLineage,
  getRoadMapRelatedNodes,
  selectRoadMapFilteredGraph,
} from "../../domain/model/roadmap.selectors";
import type {
  RoadMapCluster,
  RoadMapEdge,
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

function mergeFilters(
  filters: Partial<RoadMapFilterState> = {},
): RoadMapFilterState {
  return {
    ...ROADMAP_DEFAULT_FILTERS,
    ...filters,
  };
}

function expandWithAncestors(
  graph: RoadMapGraph,
  nodeIds: ReadonlySet<string>,
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
  nodeIds: ReadonlySet<string>,
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

function filterVisibleNodesInGraphOrder(
  graph: RoadMapGraph,
  visibleNodeIds: ReadonlySet<string>,
): RoadMapNode[] {
  return graph.nodes.filter((node) => visibleNodeIds.has(node.id));
}

function filterVisibleEdges(
  graph: RoadMapGraph,
  visibleNodeIds: ReadonlySet<string>,
  filters: RoadMapFilterState,
): RoadMapEdge[] {
  return graph.edges.filter((edge) => {
    const relationAllowed =
      filters.activeRelationTypes.length === 0 ||
      filters.activeRelationTypes.includes(edge.type);

    if (!relationAllowed) {
      return false;
    }

    return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
  });
}

function filterVisibleClusters(
  graph: RoadMapGraph,
  visibleNodeIds: ReadonlySet<string>,
): RoadMapCluster[] {
  return (graph.clusters ?? [])
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
}

export function filterRoadMapGraph(
  graph: RoadMapGraph,
  filters: Partial<RoadMapFilterState> = {},
  options: FilterRoadMapGraphOptions = {},
): RoadMapFilteredGraph {
  const { includeAncestors = true, includeRelated = false } = options;

  const mergedFilters = mergeFilters(filters);
  const baseFilteredGraph = selectRoadMapFilteredGraph(graph, mergedFilters);

  let visibleNodeIds = uniqueNodeIds(baseFilteredGraph.visibleNodes);

  if (includeAncestors && visibleNodeIds.size > 0) {
    visibleNodeIds = expandWithAncestors(graph, visibleNodeIds);
  }

  if (includeRelated && visibleNodeIds.size > 0) {
    visibleNodeIds = expandWithRelated(graph, visibleNodeIds);

    if (includeAncestors) {
      visibleNodeIds = expandWithAncestors(graph, visibleNodeIds);
    }
  }

  const visibleNodes = filterVisibleNodesInGraphOrder(graph, visibleNodeIds);
  const visibleEdges = filterVisibleEdges(graph, visibleNodeIds, mergedFilters);
  const visibleClusters = filterVisibleClusters(graph, visibleNodeIds);

  return {
    graph,
    nodeMap: createRoadMapNodeMap(graph),
    edgeMap: baseFilteredGraph.edgeMap,
    visibleNodes,
    visibleEdges,
    visibleClusters,
  };
}
