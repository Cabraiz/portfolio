import {
  sortRoadMapEdges,
  sortRoadMapNodes,
} from "../../domain/model/roadmap.selectors";
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

function validateNodeReferences(nodes: readonly RoadMapNode[]): void {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
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
  }
}

function validateClusterReferences(
  nodes: readonly RoadMapNode[],
  clusters: readonly RoadMapCluster[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const cluster of clusters) {
    for (const nodeId of cluster.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        throw new Error(
          `[buildRoadMapGraph] O cluster "${cluster.id}" referencia nodeId inexistente: "${nodeId}".`,
        );
      }
    }
  }
}

function sortClusters(clusters: readonly RoadMapCluster[]): RoadMapCluster[] {
  return [...clusters].sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR", {
      sensitivity: "base",
    }),
  );
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

  const finalNodes = sort ? sortRoadMapNodes(collectedNodes) : collectedNodes;
  const finalEdges = sort ? sortRoadMapEdges(collectedEdges) : collectedEdges;
  const finalClusters = sort ? sortClusters(collectedClusters) : collectedClusters;

  return {
    id,
    title,
    subtitle,
    nodes: finalNodes,
    edges: finalEdges,
    clusters: finalClusters,
  };
}
