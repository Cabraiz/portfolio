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

/**
 * Mantido por compatibilidade com a base atual.
 * No contexto novo, "demand" representa o peso visual/estratégico
 * da tecnologia dentro da sua stack, e não prioridade pedagógica.
 */
export type RoadMapDemandLevel =
  | "core"
  | "important"
  | "optional"
  | "niche";

/**
 * Mantidos os ids atuais para evitar quebra imediata dos arquivos de data.
 * A camada de apresentação pode renomear esses grupos de forma mais profissional.
 */
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

export type RoadMapNodeEmphasis = "high" | "medium" | "low";
export type RoadMapNodeShape = "card" | "pill" | "chip";
export type RoadMapRelationStyle = "solid" | "dashed" | "dotted";
export type RoadMapSemanticWeight = "primary" | "secondary";

export type RoadMapPosition = Readonly<{
  x: number;
  y: number;
}>;

export type RoadMapNodeDetails = Readonly<{
  summary?: string;
  headline?: string;
  projectContexts?: readonly string[];
  responsibilities?: readonly string[];
  strengths?: readonly string[];
  relatedStacks?: readonly string[];
  evidencePoints?: readonly string[];
  cautions?: readonly string[];

  /**
   * Campos legados mantidos por compatibilidade durante a transição
   * do roadmap explicativo para o roadmap de stack.
   */
  whyItMatters?: string;
  whenToUse?: readonly string[];
  whenNotToUse?: readonly string[];
  useCases?: readonly string[];
}>;

export type RoadMapNode = Readonly<{
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  kind: RoadMapNodeKind;
  category: RoadMapCategoryId;

  /**
   * Peso visual/estratégico do item na sua stack.
   * Ex.: core = base principal; important = atuação recorrente.
   */
  demand: RoadMapDemandLevel;

  /**
   * Mantido por compatibilidade.
   * Pode ser reaproveitado como nível de profundidade técnica.
   */
  difficulty?: 1 | 2 | 3 | 4 | 5;

  /**
   * Novo campo opcional mais coerente com portfólio.
   */
  proficiency?: 1 | 2 | 3 | 4 | 5;

  parentId?: string | null;
  tags?: readonly string[];
  aliases?: readonly string[];
  marketSignals?: readonly RoadMapMarketSignal[];
  details?: RoadMapNodeDetails;
  desktop?: RoadMapPosition;
  mobile?: RoadMapPosition;
  featured?: boolean;
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
  emphasis: RoadMapNodeEmphasis;
  defaultShape: RoadMapNodeShape;
}>;

export type RoadMapRelationRegistryEntry = Readonly<{
  type: RoadMapRelationType;
  label: string;
  description: string;
  directed: boolean;
  style: RoadMapRelationStyle;
  semanticWeight: RoadMapSemanticWeight;
}>;
