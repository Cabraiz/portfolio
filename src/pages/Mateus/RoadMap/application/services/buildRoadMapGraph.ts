import {
  compareNodes,
  sortRoadMapEdges,
  sortRoadMapNodes,
} from "../../domain/model/roadmap.selectors";
import { ROADMAP_CATEGORY_ORDER } from "../../domain/model/roadmap.constants";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
} from "../../domain/model/roadmap.types";

export type RoadMapGraphSegment = Readonly<{
  nodes?: readonly RoadMapNode[];
  edges?: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
}>;

export type BuildRoadMapGraphParams = Readonly<{
  baseGraph?: RoadMapGraph;
  id?: string;
  title?: string;
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

function collectGraphEntities<T extends { id: string }>(
  baseItems: readonly T[] | undefined,
  directItems: readonly T[] | undefined,
  segments: readonly RoadMapGraphSegment[],
  entityName: string,
  select: (segment: RoadMapGraphSegment) => readonly T[] | undefined,
): T[] {
  const collected: T[] = [];

  if (baseItems?.length) {
    pushUniqueById(collected, baseItems, entityName);
  }

  if (directItems?.length) {
    pushUniqueById(collected, directItems, entityName);
  }

  for (const segment of segments) {
    const items = select(segment);

    if (items?.length) {
      pushUniqueById(collected, items, entityName);
    }
  }

  return collected;
}

function collectNodes(params: BuildRoadMapGraphParams): RoadMapNode[] {
  return collectGraphEntities(
    params.baseGraph?.nodes,
    params.nodes,
    params.segments ?? [],
    "Nó",
    (segment) => segment.nodes,
  );
}

function collectEdges(params: BuildRoadMapGraphParams): RoadMapEdge[] {
  return collectGraphEntities(
    params.baseGraph?.edges,
    params.edges,
    params.segments ?? [],
    "Aresta",
    (segment) => segment.edges,
  );
}

function collectClusters(params: BuildRoadMapGraphParams): RoadMapCluster[] {
  return collectGraphEntities(
    params.baseGraph?.clusters,
    params.clusters,
    params.segments ?? [],
    "Cluster",
    (segment) => segment.clusters,
  );
}

function validateNodeReferences(nodes: readonly RoadMapNode[]): void {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    if (node.parentId === node.id) {
      throw new Error(
        `[buildRoadMapGraph] O nó "${node.id}" referencia a si mesmo em parentId.`,
      );
    }

    if (!node.parentId) {
      continue;
    }

    const parent = nodeMap.get(node.parentId);

    if (!parent) {
      throw new Error(
        `[buildRoadMapGraph] O nó "${node.id}" referencia parentId inexistente: "${node.parentId}".`,
      );
    }

    if (parent.category !== node.category) {
      throw new Error(
        `[buildRoadMapGraph] O nó "${node.id}" está na categoria "${node.category}", mas seu parentId "${parent.id}" está na categoria "${parent.category}".`,
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
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const cluster of clusters) {
    const seenNodeIds = new Set<string>();

    for (const nodeId of cluster.nodeIds) {
      const node = nodeMap.get(nodeId);

      if (!node) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" referencia nodeId inexistente: "${nodeId}".`,
        );
      }

      if (seenNodeIds.has(nodeId)) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" possui nodeId duplicado: "${nodeId}".`,
        );
      }

      if (node.category !== cluster.category) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" está na categoria "${cluster.category}", mas contém o nó "${node.id}" da categoria "${node.category}".`,
        );
      }

      seenNodeIds.add(nodeId);
    }
  }
}

function sortNodesByGraphReadingOrder(
  nodes: readonly RoadMapNode[],
): RoadMapNode[] {
  const fallbackSortedNodes = sortRoadMapNodes(nodes);
  const fallbackOrder = new Map(
    fallbackSortedNodes.map((node, index) => [node.id, index]),
  );

  return [...nodes].sort((left, right) => {
    const categoryDiff =
      ROADMAP_CATEGORY_ORDER[left.category] -
      ROADMAP_CATEGORY_ORDER[right.category];

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    if (left.parentId === right.id) {
      return 1;
    }

    if (right.parentId === left.id) {
      return -1;
    }

    const parentLabelLeft = left.parentId
      ? nodes.find((node) => node.id === left.parentId)?.label ?? ""
      : "";
    const parentLabelRight = right.parentId
      ? nodes.find((node) => node.id === right.parentId)?.label ?? ""
      : "";

    if (parentLabelLeft !== parentLabelRight) {
      return parentLabelLeft.localeCompare(parentLabelRight, "pt-BR", {
        sensitivity: "base",
      });
    }

    const semanticDiff = compareNodes(left, right);

    if (semanticDiff !== 0) {
      return semanticDiff;
    }

    return (
      (fallbackOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (fallbackOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    );
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
      ROADMAP_CATEGORY_ORDER[left.category] -
      ROADMAP_CATEGORY_ORDER[right.category];

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    const leftFirstNodeOrder = Math.min(
      ...left.nodeIds.map(
        (nodeId) => nodeOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER,
      ),
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

function resolveGraphId(params: BuildRoadMapGraphParams): string {
  const resolvedId = params.id ?? params.baseGraph?.id;

  if (!resolvedId) {
    throw new Error(
      '[buildRoadMapGraph] "id" é obrigatório quando nenhum baseGraph com id é fornecido.',
    );
  }

  return resolvedId;
}

function resolveGraphTitle(params: BuildRoadMapGraphParams): string {
  const resolvedTitle = params.title ?? params.baseGraph?.title;

  if (!resolvedTitle) {
    throw new Error(
      '[buildRoadMapGraph] "title" é obrigatório quando nenhum baseGraph com title é fornecido.',
    );
  }

  return resolvedTitle;
}

function resolveGraphSubtitle(
  params: BuildRoadMapGraphParams,
): string | undefined {
  return params.subtitle ?? params.baseGraph?.subtitle;
}

export function buildRoadMapGraph(
  params: BuildRoadMapGraphParams,
): RoadMapGraph {
  const {
    sort = true,
    validateReferences = true,
  } = params;

  const collectedNodes = collectNodes(params);
  const collectedEdges = collectEdges(params);
  const collectedClusters = collectClusters(params);

  if (validateReferences) {
    validateNodeReferences(collectedNodes);
    validateEdgeReferences(collectedNodes, collectedEdges);
    validateClusterReferences(collectedNodes, collectedClusters);
  }

  const finalNodes = sort
    ? sortNodesByGraphReadingOrder(collectedNodes)
    : [...collectedNodes];

  const finalEdges = sort
    ? sortRoadMapEdges(collectedEdges)
    : [...collectedEdges];

  const finalClusters = sort
    ? sortClusters(collectedClusters, finalNodes)
    : [...collectedClusters];

  return {
    id: resolveGraphId(params),
    title: resolveGraphTitle(params),
    subtitle: resolveGraphSubtitle(params),
    nodes: finalNodes,
    edges: finalEdges,
    clusters: finalClusters,
  };
}
