import {
  ROADMAP_DEFAULT_FILTERS,
  ROADMAP_DEMAND_ORDER,
  ROADMAP_KIND_ORDER,
  ROADMAP_MIN_SEARCH_LENGTH,
  ROADMAP_RELATION_ORDER,
} from "./roadmap.constants";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapEdgeMap,
  RoadMapFilterState,
  RoadMapFilteredGraph,
  RoadMapGraph,
  RoadMapNode,
  RoadMapNodeMap,
} from "./roadmap.types";

function normalizeText(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function uniqueIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

function safeIncludes<T extends string>(
  activeItems: readonly T[],
  current: T,
): boolean {
  return activeItems.length === 0 || activeItems.includes(current);
}

function buildSearchableText(node: RoadMapNode): string {
  return [
    node.label,
    node.shortLabel,
    node.description,
    ...(node.tags ?? []),
    ...(node.aliases ?? []),
    node.details?.summary,
    node.details?.whyItMatters,
    ...(node.details?.whenToUse ?? []),
    ...(node.details?.whenNotToUse ?? []),
    ...(node.details?.useCases ?? []),
    ...(node.details?.cautions ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesSearch(node: RoadMapNode, query: string): boolean {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < ROADMAP_MIN_SEARCH_LENGTH) {
    return true;
  }

  const searchableText = normalizeText(buildSearchableText(node));
  return searchableText.includes(normalizedQuery);
}

function matchesVisibilityFlags(
  node: RoadMapNode,
  filters: RoadMapFilterState,
): boolean {
  if (!filters.showHidden && node.isHidden) {
    return false;
  }

  if (!filters.showDeprecated && node.isDeprecated) {
    return false;
  }

  return true;
}

function matchesSignals(node: RoadMapNode, filters: RoadMapFilterState): boolean {
  if (filters.activeSignals.length === 0) {
    return true;
  }

  const nodeSignals = node.marketSignals ?? [];
  return filters.activeSignals.some((signal) => nodeSignals.includes(signal));
}

function matchesNodeFilters(
  node: RoadMapNode,
  filters: RoadMapFilterState,
): boolean {
  return (
    matchesVisibilityFlags(node, filters) &&
    safeIncludes(filters.activeCategories, node.category) &&
    safeIncludes(filters.activeDemands, node.demand) &&
    safeIncludes(filters.activeKinds, node.kind) &&
    matchesSignals(node, filters) &&
    matchesSearch(node, filters.query)
  );
}

export function createRoadMapNodeMap(
  graph: RoadMapGraph,
): RoadMapNodeMap {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function createRoadMapEdgeMap(
  graph: RoadMapGraph,
): RoadMapEdgeMap {
  return new Map(graph.edges.map((edge) => [edge.id, edge]));
}

export function getRoadMapNodeById(
  graph: RoadMapGraph,
  nodeId: string | null | undefined,
): RoadMapNode | null {
  if (!nodeId) {
    return null;
  }

  return createRoadMapNodeMap(graph).get(nodeId) ?? null;
}

export function getRoadMapChildren(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapNode[] {
  return graph.nodes
    .filter((node) => node.parentId === nodeId)
    .sort(compareNodes);
}

export function getRoadMapParent(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapNode | null {
  const node = getRoadMapNodeById(graph, nodeId);
  if (!node?.parentId) {
    return null;
  }

  return getRoadMapNodeById(graph, node.parentId);
}

export function getRoadMapOutgoingEdges(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapEdge[] {
  return graph.edges
    .filter((edge) => edge.from === nodeId)
    .sort(compareEdges);
}

export function getRoadMapIncomingEdges(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapEdge[] {
  return graph.edges
    .filter((edge) => edge.to === nodeId)
    .sort(compareEdges);
}

export function getRoadMapConnectedEdges(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapEdge[] {
  return graph.edges
    .filter((edge) => edge.from === nodeId || edge.to === nodeId)
    .sort(compareEdges);
}

export function getRoadMapRelatedNodeIds(
  graph: RoadMapGraph,
  nodeId: string,
): string[] {
  const connected = getRoadMapConnectedEdges(graph, nodeId);

  return uniqueIds(
    connected.flatMap((edge) => {
      const ids = [edge.from, edge.to];

      if (edge.isBidirectional) {
        return ids;
      }

      return ids;
    }),
  ).filter((id) => id !== nodeId);
}

export function getRoadMapRelatedNodes(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapNode[] {
  const nodeMap = createRoadMapNodeMap(graph);

  return getRoadMapRelatedNodeIds(graph, nodeId)
    .map((id) => nodeMap.get(id))
    .filter((node): node is RoadMapNode => Boolean(node))
    .sort(compareNodes);
}

export function getRoadMapRootNodes(graph: RoadMapGraph): RoadMapNode[] {
  return graph.nodes
    .filter((node) => !node.parentId)
    .sort(compareNodes);
}

export function getRoadMapNodeLineage(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapNode[] {
  const lineage: RoadMapNode[] = [];
  let current = getRoadMapNodeById(graph, nodeId);

  while (current) {
    lineage.unshift(current);
    current = current.parentId
      ? getRoadMapNodeById(graph, current.parentId)
      : null;
  }

  return lineage;
}

export function getRoadMapDescendants(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapNode[] {
  const descendants: RoadMapNode[] = [];
  const queue = [...getRoadMapChildren(graph, nodeId)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    descendants.push(current);
    queue.push(...getRoadMapChildren(graph, current.id));
  }

  return descendants.sort(compareNodes);
}

export function getRoadMapClusterNodes(
  graph: RoadMapGraph,
  clusterId: string,
): RoadMapNode[] {
  const cluster = graph.clusters?.find((item) => item.id === clusterId);
  if (!cluster) {
    return [];
  }

  const nodeMap = createRoadMapNodeMap(graph);

  return cluster.nodeIds
    .map((nodeId) => nodeMap.get(nodeId))
    .filter((node): node is RoadMapNode => Boolean(node))
    .sort(compareNodes);
}

export function getRoadMapClustersForNode(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapCluster[] {
  return (graph.clusters ?? []).filter((cluster) =>
    cluster.nodeIds.includes(nodeId),
  );
}

export function getRoadMapVisibleNodes(
  graph: RoadMapGraph,
  filters: Partial<RoadMapFilterState> = {},
): RoadMapNode[] {
  const mergedFilters: RoadMapFilterState = {
    ...ROADMAP_DEFAULT_FILTERS,
    ...filters,
  };

  return graph.nodes
    .filter((node) => matchesNodeFilters(node, mergedFilters))
    .sort(compareNodes);
}

export function getRoadMapVisibleEdges(
  graph: RoadMapGraph,
  visibleNodes: readonly RoadMapNode[],
  filters: Partial<RoadMapFilterState> = {},
): RoadMapEdge[] {
  const mergedFilters: RoadMapFilterState = {
    ...ROADMAP_DEFAULT_FILTERS,
    ...filters,
  };

  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  return graph.edges
    .filter((edge) => {
      const matchesRelation =
        mergedFilters.activeRelationTypes.length === 0 ||
        mergedFilters.activeRelationTypes.includes(edge.type);

      return (
        matchesRelation &&
        visibleNodeIds.has(edge.from) &&
        visibleNodeIds.has(edge.to)
      );
    })
    .sort(compareEdges);
}

export function getRoadMapVisibleClusters(
  graph: RoadMapGraph,
  visibleNodes: readonly RoadMapNode[],
): RoadMapCluster[] {
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

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

export function selectRoadMapFilteredGraph(
  graph: RoadMapGraph,
  filters: Partial<RoadMapFilterState> = {},
): RoadMapFilteredGraph {
  const visibleNodes = getRoadMapVisibleNodes(graph, filters);
  const visibleEdges = getRoadMapVisibleEdges(graph, visibleNodes, filters);
  const visibleClusters = getRoadMapVisibleClusters(graph, visibleNodes);

  return {
    graph,
    nodeMap: createRoadMapNodeMap(graph),
    edgeMap: createRoadMapEdgeMap(graph),
    visibleNodes,
    visibleEdges,
    visibleClusters,
  };
}

export function sortRoadMapNodes(nodes: readonly RoadMapNode[]): RoadMapNode[] {
  return [...nodes].sort(compareNodes);
}

export function sortRoadMapEdges(edges: readonly RoadMapEdge[]): RoadMapEdge[] {
  return [...edges].sort(compareEdges);
}

export function compareNodes(left: RoadMapNode, right: RoadMapNode): number {
  const demandDelta =
    ROADMAP_DEMAND_ORDER[left.demand] - ROADMAP_DEMAND_ORDER[right.demand];

  if (demandDelta !== 0) {
    return demandDelta;
  }

  const kindDelta =
    ROADMAP_KIND_ORDER[left.kind] - ROADMAP_KIND_ORDER[right.kind];

  if (kindDelta !== 0) {
    return kindDelta;
  }

  return left.label.localeCompare(right.label, "en", {
    sensitivity: "base",
  });
}

export function compareEdges(left: RoadMapEdge, right: RoadMapEdge): number {
  const relationDelta =
    ROADMAP_RELATION_ORDER[left.type] - ROADMAP_RELATION_ORDER[right.type];

  if (relationDelta !== 0) {
    return relationDelta;
  }

  return left.id.localeCompare(right.id, "en", {
    sensitivity: "base",
  });
}
