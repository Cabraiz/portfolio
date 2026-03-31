import type {
  RoadMapCategoryId,
  RoadMapCluster,
  RoadMapDemandLevel,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
  RoadMapNodeDetails,
  RoadMapNodeKind,
} from "../../model/roadmap.types";
import type {
  RoadMapJsonGraphDocument,
  RoadMapJsonGraphItem,
  RoadMapJsonNodeType,
} from "../../model/roadmap.json.types";

export type MapJsonGraphToRoadMapGraphParams = Readonly<{
  graph: RoadMapJsonGraphDocument;
  fallback?: Readonly<{
    id?: string;
    title?: string;
    subtitle?: string;
    category?: RoadMapCategoryId;
    demand?: RoadMapDemandLevel;
  }>;
}>;

type RuntimeRoadMapNode = RoadMapNode &
  Readonly<{
    order?: number;
    tier?: number;
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

function resolveNodeKind(item: RoadMapJsonGraphItem): RoadMapNodeKind {
  if (item.kind) {
    return item.kind;
  }

  if (item.tipo) {
    return NODE_KIND_BY_JSON_TYPE[item.tipo];
  }

  return "topic";
}

function resolveNodeDemand(
  item: RoadMapJsonGraphItem,
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RoadMapDemandLevel {
  if (item.demand) {
    return item.demand;
  }

  if (graph.defaults?.demand) {
    return graph.defaults.demand;
  }

  if (fallback?.demand) {
    return fallback.demand;
  }

  if (item.tipo) {
    return NODE_DEMAND_BY_JSON_TYPE[item.tipo];
  }

  return DEFAULT_DEMAND;
}

function resolveNodeCategory(
  item: RoadMapJsonGraphItem,
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RoadMapCategoryId {
  return (
    item.category ??
    graph.defaults?.category ??
    fallback?.category ??
    DEFAULT_CATEGORY
  );
}

function createNodeDetails(
  item: RoadMapJsonGraphItem,
): RoadMapNodeDetails | undefined {
  const details: RoadMapNodeDetails = {
    ...item.details,
    summary: item.details?.summary ?? item.summary,
  };

  const hasContent = Object.values(details).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });

  return hasContent ? details : undefined;
}

function createNodeShortLabel(item: RoadMapJsonGraphItem): string | undefined {
  if (item.shortLabel?.trim()) {
    return item.shortLabel.trim();
  }

  if (item.nome.length <= 22) {
    return undefined;
  }

  return item.nome.split(" ").slice(0, 2).join(" ");
}

function createCanonicalNodes(
  graph: RoadMapJsonGraphDocument,
  fallback?: MapJsonGraphToRoadMapGraphParams["fallback"],
): RuntimeRoadMapNode[] {
  return graph.items.map((item) => ({
    id: item.uuid,
    label: item.nome,
    shortLabel: createNodeShortLabel(item),
    description: item.description ?? item.summary,
    kind: resolveNodeKind(item),
    category: resolveNodeCategory(item, graph, fallback),
    demand: resolveNodeDemand(item, graph, fallback),
    parentId: item.parentUuid ?? null,
    tags: item.tags ?? [],
    aliases: item.aliases ?? [],
    details: createNodeDetails(item),
    featured: Boolean(item.featured),
    isHidden: Boolean(item.isHidden),
    isDeprecated: Boolean(item.isDeprecated),
    order:
      typeof item.ordem === "number" && Number.isFinite(item.ordem)
        ? item.ordem
        : undefined,
    tier:
      typeof item.tier === "number" && Number.isFinite(item.tier)
        ? item.tier
        : undefined,
  }));
}

function createEdgeId(from: string, to: string): string {
  return `${from}__contains__${to}`;
}

function createTreeEdges(nodes: readonly RuntimeRoadMapNode[]): RoadMapEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));

  return nodes
    .filter(
      (node) => typeof node.parentId === "string" && nodeIds.has(node.parentId),
    )
    .map((node) => ({
      id: createEdgeId(node.parentId as string, node.id),
      from: node.parentId as string,
      to: node.id,
      type: "contains",
      isBidirectional: false,
    }));
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

function createClustersFromNodes(
  nodes: readonly RuntimeRoadMapNode[],
): RoadMapCluster[] {
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
  fallback,
}: MapJsonGraphToRoadMapGraphParams): RoadMapGraph {
  const graphId = graph.graph?.id ?? fallback?.id ?? "roadmap-json";
  const title = graph.graph?.title ?? fallback?.title ?? "RoadMap";
  const subtitle = graph.graph?.subtitle ?? fallback?.subtitle;

  const nodes = createCanonicalNodes(graph, fallback);
  const edges = dedupeEdges(createTreeEdges(nodes));
  const clusters = createClustersFromNodes(nodes);

  return {
    id: graphId,
    title,
    subtitle,
    nodes,
    edges,
    clusters,
  };
}
