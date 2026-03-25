import {
  sortRoadMapEdges,
  sortRoadMapNodes,
} from "../../domain/model/roadmap.selectors";
import { ROADMAP_CATEGORY_ORDER } from "../../domain/model/roadmap.constants";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";

export type RoadMapGraphSegment = Readonly<{
  nodes?: readonly RoadMapNode[];
  edges?: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
}>;

export type BuildRoadMapGraphParams = Readonly<{
  id: string;
  title: string;
  subtitle?: string;
  segments?: readonly RoadMapGraphSegment[];
  nodes?: readonly RoadMapNode[];
  edges?: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
  sort?: boolean;
  validateReferences?: boolean;
}>;

function pushUniqueById<T extends { id: string }>(
  target: T[],
  source: readonly T[],
  entityName: string,
): void {
  const seenIds = new Set(target.map((item) => item.id));

  for (const item of source) {
    if (seenIds.has(item.id)) {
      throw new Error(
        `[buildRoadMapGraph] ${entityName} duplicado encontrado: "${item.id}".`,
      );
    }

    seenIds.add(item.id);
    target.push(item);
  }
}

function collectNodes(params: BuildRoadMapGraphParams): RoadMapNode[] {
  const collected: RoadMapNode[] = [];

  if (params.nodes?.length) {
    pushUniqueById(collected, params.nodes, "Nó");
  }

  for (const segment of params.segments ?? []) {
    if (segment.nodes?.length) {
      pushUniqueById(collected, segment.nodes, "Nó");
    }
  }

  return collected;
}

function collectEdges(params: BuildRoadMapGraphParams): RoadMapEdge[] {
  const collected: RoadMapEdge[] = [];

  if (params.edges?.length) {
    pushUniqueById(collected, params.edges, "Aresta");
  }

  for (const segment of params.segments ?? []) {
    if (segment.edges?.length) {
      pushUniqueById(collected, segment.edges, "Aresta");
    }
  }

  return collected;
}

function collectClusters(params: BuildRoadMapGraphParams): RoadMapCluster[] {
  const collected: RoadMapCluster[] = [];

  if (params.clusters?.length) {
    pushUniqueById(collected, params.clusters, "Cluster");
  }

  for (const segment of params.segments ?? []) {
    if (segment.clusters?.length) {
      pushUniqueById(collected, segment.clusters, "Cluster");
    }
  }

  return collected;
}

function resolveNodeSortPosition(node: RoadMapNode): RoadMapPosition | null {
  return node.desktop ?? node.mobile ?? null;
}

function validateNodeReferences(nodes: readonly RoadMapNode[]): void {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    if (node.parentId === node.id) {
      throw new Error(
        `[buildRoadMapGraph] O nó "${node.id}" referencia a si mesmo em parentId.`,
      );
    }

    if (node.parentId && !nodeIds.has(node.parentId)) {
      throw new Error(
        `[buildRoadMapGraph] O nó "${node.id}" referencia parentId inexistente: "${node.parentId}".`,
      );
    }
  }
}

function validateEdgeReferences(
  nodes: readonly RoadMapNode[],
  edges: readonly RoadMapEdge[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.from)) {
      throw new Error(
        `[buildRoadMapGraph] A aresta "${edge.id}" referencia origem inexistente: "${edge.from}".`,
      );
    }

    if (!nodeIds.has(edge.to)) {
      throw new Error(
        `[buildRoadMapGraph] A aresta "${edge.id}" referencia destino inexistente: "${edge.to}".`,
      );
    }

    if (edge.from === edge.to) {
      throw new Error(
        `[buildRoadMapGraph] A aresta "${edge.id}" não pode apontar para o mesmo nó em origem e destino.`,
      );
    }
  }
}

function validateClusterReferences(
  nodes: readonly RoadMapNode[],
  clusters: readonly RoadMapCluster[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const cluster of clusters) {
    const seenNodeIds = new Set<string>();

    for (const nodeId of cluster.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" referencia nodeId inexistente: "${nodeId}".`,
        );
      }

      if (seenNodeIds.has(nodeId)) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" possui nodeId duplicado: "${nodeId}".`,
        );
      }

      seenNodeIds.add(nodeId);
    }
  }
}

function sortNodesTopDown(nodes: readonly RoadMapNode[]): RoadMapNode[] {
  const fallbackSortedNodes = sortRoadMapNodes(nodes);
  const fallbackOrder = new Map(
    fallbackSortedNodes.map((node, index) => [node.id, index]),
  );

  return [...nodes].sort((left, right) => {
    const categoryDiff =
      ROADMAP_CATEGORY_ORDER[left.category] - ROADMAP_CATEGORY_ORDER[right.category];

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    const leftPosition = resolveNodeSortPosition(left);
    const rightPosition = resolveNodeSortPosition(right);

    if (leftPosition && rightPosition) {
      if (leftPosition.y !== rightPosition.y) {
        return leftPosition.y - rightPosition.y;
      }

      if (leftPosition.x !== rightPosition.x) {
        return leftPosition.x - rightPosition.x;
      }
    }

    if (leftPosition && !rightPosition) {
      return -1;
    }

    if (!leftPosition && rightPosition) {
      return 1;
    }

    const fallbackDiff =
      (fallbackOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (fallbackOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER);

    if (fallbackDiff !== 0) {
      return fallbackDiff;
    }

    return left.label.localeCompare(right.label, "pt-BR", {
      sensitivity: "base",
    });
  });
}

function normalizeClusterNodeIds(
  cluster: RoadMapCluster,
  nodeOrder: ReadonlyMap<string, number>,
): RoadMapCluster {
  const deduplicatedNodeIds = [...new Set(cluster.nodeIds)];

  const sortedNodeIds = [...deduplicatedNodeIds].sort(
    (leftNodeId, rightNodeId) =>
      (nodeOrder.get(leftNodeId) ?? Number.MAX_SAFE_INTEGER) -
      (nodeOrder.get(rightNodeId) ?? Number.MAX_SAFE_INTEGER),
  );

  return {
    ...cluster,
    nodeIds: sortedNodeIds,
  };
}

function sortClusters(
  clusters: readonly RoadMapCluster[],
  orderedNodes: readonly RoadMapNode[],
): RoadMapCluster[] {
  const nodeOrder = new Map(orderedNodes.map((node, index) => [node.id, index]));

  const normalizedClusters = clusters.map((cluster) =>
    normalizeClusterNodeIds(cluster, nodeOrder),
  );

  return normalizedClusters.sort((left, right) => {
    const categoryDiff =
      ROADMAP_CATEGORY_ORDER[left.category] - ROADMAP_CATEGORY_ORDER[right.category];

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    const leftFirstNodeOrder = Math.min(
      ...left.nodeIds.map((nodeId) => nodeOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER),
    );

    const rightFirstNodeOrder = Math.min(
      ...right.nodeIds.map(
        (nodeId) => nodeOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER,
      ),
    );

    if (leftFirstNodeOrder !== rightFirstNodeOrder) {
      return leftFirstNodeOrder - rightFirstNodeOrder;
    }

    return left.label.localeCompare(right.label, "pt-BR", {
      sensitivity: "base",
    });
  });
}

export function buildRoadMapGraph({
  id,
  title,
  subtitle,
  segments = [],
  nodes = [],
  edges = [],
  clusters = [],
  sort = true,
  validateReferences = true,
}: BuildRoadMapGraphParams): RoadMapGraph {
  const collectedNodes = collectNodes({
    id,
    title,
    subtitle,
    segments,
    nodes,
    edges,
    clusters,
    sort,
    validateReferences,
  });

  const collectedEdges = collectEdges({
    id,
    title,
    subtitle,
    segments,
    nodes,
    edges,
    clusters,
    sort,
    validateReferences,
  });

  const collectedClusters = collectClusters({
    id,
    title,
    subtitle,
    segments,
    nodes,
    edges,
    clusters,
    sort,
    validateReferences,
  });

  if (validateReferences) {
    validateNodeReferences(collectedNodes);
    validateEdgeReferences(collectedNodes, collectedEdges);
    validateClusterReferences(collectedNodes, collectedClusters);
  }

  const finalNodes = sort ? sortNodesTopDown(collectedNodes) : collectedNodes;
  const finalEdges = sort ? sortRoadMapEdges(collectedEdges) : collectedEdges;
  const finalClusters = sort
    ? sortClusters(collectedClusters, finalNodes)
    : collectedClusters;

  return {
    id,
    title,
    subtitle,
    nodes: finalNodes,
    edges: finalEdges,
    clusters: finalClusters,
  };
}
