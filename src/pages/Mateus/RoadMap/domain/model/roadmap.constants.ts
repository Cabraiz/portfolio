// src/pages/Mateus/RoadMap/domain/model/roadmap.constants.ts

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
  fundamentals: "Fundamentos de Engenharia",
  "react-core": "React e Ecossistema Base",
  "state-management": "Estado e Arquitetura de UI",
  "rendering-routing": "Renderização e Navegação",
  "data-layer": "Dados e Integrações",
  styling: "UI e Estilização",
  "testing-tooling": "Qualidade e Ferramentas",
  "market-signals": "Mercado e Contexto de Entrega",
};

export const ROADMAP_KIND_LABELS: Readonly<Record<RoadMapNodeKind, string>> = {
  domain: "Frente",
  topic: "Bloco",
  technology: "Tecnologia",
  concept: "Prática",
};

export const ROADMAP_DEMAND_LABELS: Readonly<
  Record<RoadMapDemandLevel, string>
> = {
  core: "Base principal",
  important: "Atuação recorrente",
  optional: "Atuação complementar",
  niche: "Contexto específico",
};

export const ROADMAP_RELATION_LABELS: Readonly<
  Record<RoadMapRelationType, string>
> = {
  contains: "Agrupa",
  prerequisite: "Base para",
  alternative: "Alterna com",
  complements: "Compõe com",
  specializes: "Especializa",
};

export const ROADMAP_MARKET_SIGNAL_LABELS: Readonly<
  Record<RoadMapMarketSignal, string>
> = {
  "market-hot": "Alta demanda",
  stable: "Adoção estável",
  enterprise: "Contexto enterprise",
  freelance: "Contexto freelance",
  legacy: "Sustentação de legado",
  rising: "Crescimento de adoção",
};

export const ROADMAP_CATEGORY_ORDER: Readonly<
  Record<RoadMapCategoryId, number>
> = {
  fundamentals: 0,
  "react-core": 1,
  "state-management": 2,
  "rendering-routing": 3,
  "data-layer": 4,
  styling: 5,
  "testing-tooling": 6,
  "market-signals": 7,
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
  complements: 2,
  specializes: 3,
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
  title: "Nenhuma tecnologia encontrada",
  description:
    "Ajuste a busca ou os filtros para exibir mais itens da stack e das frentes de atuação.",
} as const;

export const ROADMAP_SECTION_COPY = {
  title: "Stack e frentes de atuação",
  subtitle:
    "Mapa visual das tecnologias, práticas e contextos em que atuo.",
} as const;

export const ROADMAP_LAYOUT_DIRECTION = "vertical" as const;
export const ROADMAP_CLUSTER_FLOW = "top-to-bottom" as const;
export const ROADMAP_MIN_SEARCH_LENGTH = 2;
