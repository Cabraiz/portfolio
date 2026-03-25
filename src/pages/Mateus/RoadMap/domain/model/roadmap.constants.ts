import type {
  RoadMapCategoryId,
  RoadMapDemandLevel,
  RoadMapFilterState,
  RoadMapMarketSignal,
  RoadMapNodeKind,
  RoadMapRelationType,
} from "./roadmap.types";

export const ROADMAP_NODE_KINDS: readonly RoadMapNodeKind[] = [
  "domain",
  "topic",
  "technology",
  "concept",
] as const;

export const ROADMAP_RELATION_TYPES: readonly RoadMapRelationType[] = [
  "contains",
  "prerequisite",
  "alternative",
  "complements",
  "specializes",
] as const;

export const ROADMAP_DEMAND_LEVELS: readonly RoadMapDemandLevel[] = [
  "core",
  "important",
  "optional",
  "niche",
] as const;

export const ROADMAP_CATEGORY_IDS: readonly RoadMapCategoryId[] = [
  "fundamentals",
  "react-core",
  "state-management",
  "rendering-routing",
  "data-layer",
  "styling",
  "testing-tooling",
  "market-signals",
] as const;

export const ROADMAP_MARKET_SIGNALS: readonly RoadMapMarketSignal[] = [
  "market-hot",
  "stable",
  "enterprise",
  "freelance",
  "legacy",
  "rising",
] as const;

export const ROADMAP_CATEGORY_LABELS: Readonly<
  Record<RoadMapCategoryId, string>
> = {
  fundamentals: "Fundamentos",
  "react-core": "Núcleo do React",
  "state-management": "Gerenciamento de Estado",
  "rendering-routing": "Renderização e Roteamento",
  "data-layer": "Camada de Dados",
  styling: "Estilização",
  "testing-tooling": "Testes e Ferramentas",
  "market-signals": "Sinais de Mercado",
};

export const ROADMAP_KIND_LABELS: Readonly<Record<RoadMapNodeKind, string>> = {
  domain: "Domínio",
  topic: "Tópico",
  technology: "Tecnologia",
  concept: "Conceito",
};

export const ROADMAP_DEMAND_LABELS: Readonly<
  Record<RoadMapDemandLevel, string>
> = {
  core: "Essencial",
  important: "Importante",
  optional: "Opcional",
  niche: "Nicho",
};

export const ROADMAP_RELATION_LABELS: Readonly<
  Record<RoadMapRelationType, string>
> = {
  contains: "Contém",
  prerequisite: "Pré-requisito",
  alternative: "Alternativa",
  complements: "Complementa",
  specializes: "Especializa",
};

export const ROADMAP_MARKET_SIGNAL_LABELS: Readonly<
  Record<RoadMapMarketSignal, string>
> = {
  "market-hot": "Em alta no mercado",
  stable: "Estável",
  enterprise: "Corporativo",
  freelance: "Freelance",
  legacy: "Legado",
  rising: "Em crescimento",
};

export const ROADMAP_DEMAND_ORDER: Readonly<
  Record<RoadMapDemandLevel, number>
> = {
  core: 0,
  important: 1,
  optional: 2,
  niche: 3,
};

export const ROADMAP_KIND_ORDER: Readonly<Record<RoadMapNodeKind, number>> = {
  domain: 0,
  topic: 1,
  technology: 2,
  concept: 3,
};

export const ROADMAP_RELATION_ORDER: Readonly<
  Record<RoadMapRelationType, number>
> = {
  contains: 0,
  prerequisite: 1,
  specializes: 2,
  complements: 3,
  alternative: 4,
};

export const ROADMAP_DEFAULT_FILTERS: RoadMapFilterState = {
  query: "",
  activeCategories: [],
  activeDemands: [],
  activeKinds: [],
  activeSignals: [],
  activeRelationTypes: [],
  showDeprecated: false,
  showHidden: false,
};

export const ROADMAP_EMPTY_TEXT = {
  title: "Nenhum item do roadmap encontrado",
  description:
    "Ajuste os filtros ou o termo de busca para exibir mais tecnologias e relacionamentos.",
} as const;

export const ROADMAP_MIN_SEARCH_LENGTH = 2;
