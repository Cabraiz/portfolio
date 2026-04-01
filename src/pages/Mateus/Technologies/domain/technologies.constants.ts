// src/pages/Mateus/Technologies/domain/technologies.constants.ts

import type {
  TechnologyCategory,
  TechnologyExperienceBand,
  TechnologiesFiltersState,
  TechnologySortMode,
} from "./technologies.types";

export const TECHNOLOGIES_SECTION_ID = "technologies" as const;

export const TECHNOLOGY_SORT_OPTIONS: readonly Readonly<{
  id: TechnologySortMode;
  label: string;
}>[] = [
  {
    id: "featured",
    label: "Destaques",
  },
  {
    id: "years-desc",
    label: "Mais experiência",
  },
  {
    id: "years-asc",
    label: "Menos experiência",
  },
  {
    id: "name-asc",
    label: "A–Z",
  },
] as const;

export const TECHNOLOGY_CATEGORIES: readonly TechnologyCategory[] = [
  {
    id: "cloud",
    label: "Cloud & Infra",
    shortLabel: "Cloud",
    description:
      "Infraestrutura, computação gerenciada, mensageria e serviços de nuvem.",
    order: 10,
  },
  {
    id: "frontend",
    label: "Frontend & Mobile",
    shortLabel: "Frontend",
    description:
      "Experiências de interface, aplicações web modernas e mobile cross-platform.",
    order: 20,
  },
  {
    id: "backend-jvm",
    label: "Backend JVM",
    shortLabel: "JVM",
    description:
      "Serviços corporativos, APIs e arquiteturas baseadas em Java e Kotlin.",
    order: 30,
  },
  {
    id: "backend-js",
    label: "Backend JS",
    shortLabel: "Node",
    description:
      "APIs, gateways e serviços orientados a produto usando ecossistema JavaScript.",
    order: 40,
  },
  {
    id: "python",
    label: "Python APIs",
    shortLabel: "Python",
    description:
      "Serviços rápidos, APIs modernas e automações de backend com Python.",
    order: 50,
  },
  {
    id: "data",
    label: "Data & Messaging",
    shortLabel: "Data",
    description:
      "Persistência, cache, mensageria e integração orientada a eventos.",
    order: 60,
  },
  {
    id: "qa",
    label: "QA & Automation",
    shortLabel: "QA",
    description:
      "Testes end-to-end, automação, regressão e garantia de qualidade técnica.",
    order: 70,
  },
  {
    id: "observability",
    label: "Observability",
    shortLabel: "Obs",
    description:
      "Métricas, telemetria, monitoração e rastreabilidade operacional.",
    order: 80,
  },
] as const;

export const TECHNOLOGIES_DEFAULT_FILTERS: TechnologiesFiltersState = {
  query: "",
  activeCategoryId: "all",
  minimumYears: 0,
  featuredOnly: false,
  sortMode: "featured",
};

export const TECHNOLOGY_EXPERIENCE_BANDS: readonly TechnologyExperienceBand[] = [
  {
    id: "0-2",
    label: "0–2 anos",
    minYears: 0,
    maxYears: 2,
  },
  {
    id: "3-4",
    label: "3–4 anos",
    minYears: 3,
    maxYears: 4,
  },
  {
    id: "5-7",
    label: "5–7 anos",
    minYears: 5,
    maxYears: 7,
  },
  {
    id: "8+",
    label: "8+ anos",
    minYears: 8,
    maxYears: null,
  },
] as const;

export const TECHNOLOGY_HIGHLIGHT_THRESHOLD_YEARS = 5;
export const TECHNOLOGY_SENIOR_THRESHOLD_YEARS = 8;
export const TECHNOLOGY_FLAGSHIP_THRESHOLD_YEARS = 10;

export const TECHNOLOGIES_MAX_TOP_ITEMS = 6;
export const TECHNOLOGIES_SEARCH_MIN_QUERY_LENGTH = 1;

export const TECHNOLOGY_EMPTY_STATE_TITLE =
  "Nenhuma tecnologia encontrada";

export const TECHNOLOGY_EMPTY_STATE_DESCRIPTION =
  "Ajuste os filtros ou a busca para visualizar outras stacks.";
