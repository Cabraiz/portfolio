import type {
  RoadMapCategoryId,
  RoadMapCluster,
  RoadMapDemandLevel,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
  RoadMapNodeDetails,
  RoadMapNodeKind,
  RoadMapRelationType,
} from "../../model/roadmap.types";
import type {
  RoadMapJsonEdge,
  RoadMapJsonGraphDocument,
  RoadMapJsonNode,
  RoadMapJsonNodeType,
  RoadMapJsonRelationshipsDocument,
  RoadMapJsonRelationValue,
} from "../../model/roadmap.json.types";

export type MapJsonGraphToRoadMapGraphParams = Readonly<{
  graph: RoadMapJsonGraphDocument;
  relationships?: RoadMapJsonRelationshipsDocument;
  fallback?: Readonly<{
    id?: string;
    title?: string;
    subtitle?: string;
    category?: RoadMapCategoryId;
    demand?: RoadMapDemandLevel;
  }>;
}>;

const DEFAULT_CATEGORY: RoadMapCategoryId = "fundamentals";
const DEFAULT_DEMAND: RoadMapDemandLevel = "important";

const NODE_KIND_BY_JSON_TYPE: Record<RoadMapJsonNodeType, RoadMapNodeKind> = {
  main: "domain",
  topic: "topic",
  subtopic: "concept",
  technology: "technology",
  concept: "concept",
};

const NODE_DEMAND_BY_JSON_TYPE: Record<RoadMapJsonNodeType, RoadMapDemandLevel> =
  {
    main: "core",
    topic: "important",
    subtopic: "optional",
    technology: "important",
    concept: "optional",
  };

const CATEGORY_LABELS: Record<RoadMapCategoryId, string> = {
  fundamentals: "Fundamentals",
  "react-core": "React Core",
  "state-management": "State Management",
  "rendering-routing": "Rendering & Routing",
  "data-layer": "Data Layer",
  styling: "Styling",
  "testing-tooling": "Testing & Tooling",
  "market-signals": "Market Signals",
};

const BIDIRECTIONAL_RELATIONS = new Set<RoadMapRelationType>([
  "alternative",
  "complements",
]);

const PARENT_RELATIONS = new Set<RoadMapRelationType>([
  "contains",
  "specializes",
]);

function resolveRelationType(
  relation: RoadMapJsonRelationValue,
): RoadMapRelationType {
  switch (relation) {
    case "has_topic":
    case "has_subtopic":
    case "contains":
      return "contains";
    case "requires":
    case "prerequisite":
      return "prerequisite";
    case "alternative_to":
    case "alternative":
      return "alternative";
    case "complements":
      return "complements";
    case "specializes":
      return "specializes";
    default:
      return "contains";
  }
}

function resolveNodeKind(node: RoadMapJsonNode): RoadMapNodeKind {
  if (node.kind) {
    return node.kind;
  }

  if (node.type) {
    return NODE_KIND_BY_JSON_TYPE[node.type];
  }

  return "topic";
}

function resolveNodeDemand(
  node: RoadMapJsonNode,
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RoadMapDemandLevel {
  if (node.demand) {
    return node.demand;
  }

  if (graph.defaults?.demand) {
    return graph.defaults.demand;
  }

  if (fallback?.demand) {
    return fallback.demand;
  }

  if (node.type) {
    return NODE_DEMAND_BY_JSON_TYPE[node.type];
  }

  return DEFAULT_DEMAND;
}

function resolveNodeCategory(
  node: RoadMapJsonNode,
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RoadMapCategoryId {
  return (
    node.category ??
    graph.defaults?.category ??
    fallback?.category ??
    DEFAULT_CATEGORY
  );
}

function createNodeDetails(node: RoadMapJsonNode): RoadMapNodeDetails | undefined {
  const details: RoadMapNodeDetails = {
    ...node.details,
    summary: node.details?.summary ?? node.summary,
  };

  const hasContent = Object.values(details).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });

  return hasContent ? details : undefined;
}

function createNodeShortLabel(node: RoadMapJsonNode): string | undefined {
  if (node.shortLabel?.trim()) {
    return node.shortLabel.trim();
  }

  if (node.label.length <= 22) {
    return undefined;
  }

  return node.label.split(" ").slice(0, 2).join(" ");
}

function createCanonicalNodes(
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RoadMapNode[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    shortLabel: createNodeShortLabel(node),
    description: node.description ?? node.summary,
    kind: resolveNodeKind(node),
    category: resolveNodeCategory(node, graph, fallback),
    demand: resolveNodeDemand(node, graph, fallback),
    parentId: node.parentId ?? null,
    tags: node.tags ?? [],
    aliases: node.aliases ?? [],
    details: createNodeDetails(node),
    desktop: node.desktop,
    mobile: node.mobile,
    featured: Boolean(node.featured),
    isHidden: Boolean(node.isHidden),
    isDeprecated: Boolean(node.isDeprecated),
  }));
}

function createEdgeId(
  from: string,
  relation: RoadMapRelationType,
  to: string,
): string {
  return `${from}__${relation}__${to}`;
}

function mapJsonEdgeToCanonical(edge: RoadMapJsonEdge): RoadMapEdge {
  const type = resolveRelationType(edge.relation);

  return {
    id: edge.id ?? createEdgeId(edge.from, type, edge.to),
    from: edge.from,
    to: edge.to,
    type,
    label: edge.label,
    strength: edge.strength,
    isBidirectional:
      edge.isBidirectional ?? BIDIRECTIONAL_RELATIONS.has(type),
  };
}

function createEdgesFromRelationshipDocument(
  relationships?: RoadMapJsonRelationshipsDocument,
): RoadMapEdge[] {
  if (!relationships) {
    return [];
  }

  return relationships.entities.flatMap((entity) =>
    entity.relationships.map((relationship) => {
      const type = resolveRelationType(relationship.type);

      return {
        id: createEdgeId(entity.entity, type, relationship.target),
        from: entity.entity,
        to: relationship.target,
        type,
        label: relationship.label,
        strength: relationship.strength,
        isBidirectional:
          relationship.isBidirectional ?? BIDIRECTIONAL_RELATIONS.has(type),
      };
    }),
  );
}

function dedupeEdges(edges: readonly RoadMapEdge[]): RoadMapEdge[] {
  const seen = new Map<string, RoadMapEdge>();

  for (const edge of edges) {
    if (!seen.has(edge.id)) {
      seen.set(edge.id, edge);
    }
  }

  return Array.from(seen.values());
}

function filterEdgesByKnownNodes(
  edges: readonly RoadMapEdge[],
  nodes: readonly RoadMapNode[],
): RoadMapEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));

  return edges.filter(
    (edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to),
  );
}

function assignDerivedParentIds(
  nodes: readonly RoadMapNode[],
  edges: readonly RoadMapEdge[],
): RoadMapNode[] {
  const firstParentByChildId = new Map<string, string>();

  for (const edge of edges) {
    if (!PARENT_RELATIONS.has(edge.type)) {
      continue;
    }

    if (!firstParentByChildId.has(edge.to)) {
      firstParentByChildId.set(edge.to, edge.from);
    }
  }

  return nodes.map((node) => ({
    ...node,
    parentId: node.parentId ?? firstParentByChildId.get(node.id) ?? null,
  }));
}

function createClustersFromGraph(
  graph: RoadMapJsonGraphDocument,
  nodes: readonly RoadMapNode[],
): RoadMapCluster[] {
  if (graph.clusters && graph.clusters.length > 0) {
    return graph.clusters
      .map((cluster) => ({
        id: cluster.id,
        label: cluster.label,
        description: cluster.description,
        category:
          cluster.category ??
          nodes.find((node) => cluster.nodeIds.includes(node.id))?.category ??
          DEFAULT_CATEGORY,
        nodeIds: cluster.nodeIds.filter((nodeId) =>
          nodes.some((node) => node.id === nodeId),
        ),
      }))
      .filter((cluster) => cluster.nodeIds.length > 0);
  }

  const grouped = new Map<RoadMapCategoryId, string[]>();

  for (const node of nodes) {
    const current = grouped.get(node.category) ?? [];
    current.push(node.id);
    grouped.set(node.category, current);
  }

  return Array.from(grouped.entries()).map(([category, nodeIds]) => ({
    id: `cluster-${category}`,
    label: CATEGORY_LABELS[category],
    category,
    nodeIds,
  }));
}

export function mapJsonGraphToRoadMapGraph({
  graph,
  relationships,
  fallback,
}: MapJsonGraphToRoadMapGraphParams): RoadMapGraph {
  const graphId = graph.graph?.id ?? fallback?.id ?? "roadmap-json";
  const title = graph.graph?.title ?? fallback?.title ?? "RoadMap";
  const subtitle = graph.graph?.subtitle ?? fallback?.subtitle;

  const baseNodes = createCanonicalNodes(graph, fallback);

  const explicitEdges = (graph.edges ?? []).map(mapJsonEdgeToCanonical);
  const semanticEdges = createEdgesFromRelationshipDocument(relationships);

  const mergedEdges = filterEdgesByKnownNodes(
    dedupeEdges([...explicitEdges, ...semanticEdges]),
    baseNodes,
  );

  const nodes = assignDerivedParentIds(baseNodes, mergedEdges);
  const clusters = createClustersFromGraph(graph, nodes);

  return {
    id: graphId,
    title,
    subtitle,
    nodes,
    edges: mergedEdges,
    clusters,
  };
}
