export type RoadMapNodeKind =
  | "domain"
  | "topic"
  | "technology"
  | "concept";

export type RoadMapRelationType =
  | "contains"
  | "prerequisite"
  | "alternative"
  | "complements"
  | "specializes";

export type RoadMapDemandLevel =
  | "core"
  | "important"
  | "optional"
  | "niche";

export type RoadMapCategoryId =
  | "fundamentals"
  | "react-core"
  | "state-management"
  | "rendering-routing"
  | "data-layer"
  | "styling"
  | "testing-tooling"
  | "market-signals";

export type RoadMapMarketSignal =
  | "market-hot"
  | "stable"
  | "enterprise"
  | "freelance"
  | "legacy"
  | "rising";

export type RoadMapPosition = Readonly<{
  x: number;
  y: number;
}>;

export type RoadMapNodeDetails = Readonly<{
  summary?: string;
  whyItMatters?: string;
  whenToUse?: readonly string[];
  whenNotToUse?: readonly string[];
  useCases?: readonly string[];
  cautions?: readonly string[];
}>;

export type RoadMapNode = Readonly<{
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  kind: RoadMapNodeKind;
  category: RoadMapCategoryId;
  demand: RoadMapDemandLevel;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  parentId?: string | null;
  tags?: readonly string[];
  aliases?: readonly string[];
  marketSignals?: readonly RoadMapMarketSignal[];
  details?: RoadMapNodeDetails;
  desktop?: RoadMapPosition;
  mobile?: RoadMapPosition;
  isHidden?: boolean;
  isDeprecated?: boolean;
}>;

export type RoadMapEdge = Readonly<{
  id: string;
  from: string;
  to: string;
  type: RoadMapRelationType;
  label?: string;
  strength?: 1 | 2 | 3 | 4 | 5;
  isBidirectional?: boolean;
}>;

export type RoadMapCluster = Readonly<{
  id: string;
  label: string;
  description?: string;
  category: RoadMapCategoryId;
  nodeIds: readonly string[];
}>;

export type RoadMapGraph = Readonly<{
  id: string;
  title: string;
  subtitle?: string;
  nodes: readonly RoadMapNode[];
  edges: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
}>;

export type RoadMapFilterState = Readonly<{
  query: string;
  activeCategories: readonly RoadMapCategoryId[];
  activeDemands: readonly RoadMapDemandLevel[];
  activeKinds: readonly RoadMapNodeKind[];
  activeSignals: readonly RoadMapMarketSignal[];
  activeRelationTypes: readonly RoadMapRelationType[];
  showDeprecated: boolean;
  showHidden: boolean;
}>;

export type RoadMapNodeMap = ReadonlyMap<string, RoadMapNode>;
export type RoadMapEdgeMap = ReadonlyMap<string, RoadMapEdge>;

export type RoadMapSelectionState = Readonly<{
  activeNodeId: string | null;
  hoveredNodeId: string | null;
}>;

export type RoadMapFilteredGraph = Readonly<{
  graph: RoadMapGraph;
  nodeMap: RoadMapNodeMap;
  edgeMap: RoadMapEdgeMap;
  visibleNodes: readonly RoadMapNode[];
  visibleEdges: readonly RoadMapEdge[];
  visibleClusters: readonly RoadMapCluster[];
}>;

export type RoadMapNodeRegistryEntry = Readonly<{
  kind: RoadMapNodeKind;
  label: string;
  description: string;
  isContainer: boolean;
  emphasis: "high" | "medium" | "low";
  defaultShape: "card" | "pill" | "chip";
}>;

export type RoadMapRelationRegistryEntry = Readonly<{
  type: RoadMapRelationType;
  label: string;
  description: string;
  directed: boolean;
  style: "solid" | "dashed" | "dotted";
  semanticWeight: "primary" | "secondary";
}>;
