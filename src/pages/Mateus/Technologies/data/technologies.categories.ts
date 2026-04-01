// src/pages/Mateus/Technologies/data/technologies.categories.ts

import { TECHNOLOGY_CATEGORIES } from "../domain/technologies.constants";
import type {
  TechnologyCategory,
  TechnologyCategoryId,
} from "../domain/technologies.types";

export type TechnologyCategoryPresentation = TechnologyCategory &
  Readonly<{
    eyebrow: string;
    heroTitle: string;
    heroDescription: string;
    spotlightTitle: string;
    keywords: readonly string[];
    panelBadge: string;
  }>;

const TECHNOLOGY_CATEGORY_PRESENTATION_BY_ID: Readonly<
  Record<
    TechnologyCategoryId,
    Omit<TechnologyCategoryPresentation, keyof TechnologyCategory>
  >
> = {
  cloud: {
    eyebrow: "Infraestrutura & Nuvem",
    heroTitle: "Cloud foundation para workloads, serviços e operação.",
    heroDescription:
      "Agrupa provedores, computação gerenciada, storage, IAM, banco gerenciado e serviços orientados a plataforma.",
    spotlightTitle: "Ambiente cloud, automação e operação",
    keywords: ["aws", "gcp", "infra", "cloud", "platform", "deployment"],
    panelBadge: "Cloud",
  },
  frontend: {
    eyebrow: "Experiência & Interface",
    heroTitle: "Interfaces modernas com foco em produto, performance e entrega.",
    heroDescription:
      "Reúne stacks voltadas para experiência web e mobile, incluindo frameworks de UI, renderização e ergonomia de produto.",
    spotlightTitle: "Camada visual, SPA e app experience",
    keywords: ["react", "next", "vue", "nuxt", "flutter", "typescript"],
    panelBadge: "Frontend",
  },
  "backend-jvm": {
    eyebrow: "Serviços JVM",
    heroTitle: "Backends robustos para fluxos corporativos e APIs críticas.",
    heroDescription:
      "Concentra stacks da plataforma JVM com perfil enterprise, governança, domínio de negócio e integração estruturada.",
    spotlightTitle: "Serviços enterprise e domínio transacional",
    keywords: ["java", "spring", "kotlin", "jvm", "api", "enterprise"],
    panelBadge: "JVM",
  },
  "backend-js": {
    eyebrow: "Node Platform",
    heroTitle: "APIs e serviços orientados a produto no ecossistema JavaScript.",
    heroDescription:
      "Agrupa runtimes e frameworks de backend JS usados para APIs, gateways, microsserviços e aplicações orientadas a entrega.",
    spotlightTitle: "Node services e product APIs",
    keywords: ["node", "express", "nestjs", "graphql", "apollo", "typescript"],
    panelBadge: "Node",
  },
  python: {
    eyebrow: "Python Services",
    heroTitle: "Serviços rápidos, automações e APIs com foco em produtividade.",
    heroDescription:
      "Categoria voltada a serviços, automação e construção de APIs modernas com Python e seu ecossistema.",
    spotlightTitle: "Python APIs e automação técnica",
    keywords: ["python", "fastapi", "api", "automation", "service"],
    panelBadge: "Python",
  },
  data: {
    eyebrow: "Data & Messaging",
    heroTitle: "Persistência, mensageria e integração orientada a eventos.",
    heroDescription:
      "Reúne bancos relacionais e não relacionais, cache distribuído, filas e streaming para sistemas integrados.",
    spotlightTitle: "Dados, cache, filas e eventos",
    keywords: ["postgresql", "mongodb", "redis", "rabbitmq", "kafka"],
    panelBadge: "Data",
  },
  qa: {
    eyebrow: "Quality Engineering",
    heroTitle: "Automação de testes e qualidade para fluxos críticos.",
    heroDescription:
      "Agrupa ferramentas de validação end-to-end, regressão, smoke e cobertura de interação entre camadas.",
    spotlightTitle: "QA, automação e confiabilidade funcional",
    keywords: ["selenium", "cypress", "playwright", "test", "qa", "e2e"],
    panelBadge: "QA",
  },
  observability: {
    eyebrow: "Signals & Telemetry",
    heroTitle: "Métricas, rastreamento e visibilidade operacional contínua.",
    heroDescription:
      "Categoria dedicada à instrumentação, monitoração, traces, dashboards e leitura operacional do sistema.",
    spotlightTitle: "Telemetria, métricas e monitoramento",
    keywords: ["grafana", "prometheus", "otel", "monitoring", "telemetry"],
    panelBadge: "Observability",
  },
};

export const TECHNOLOGY_CATEGORY_PRESENTATIONS: readonly TechnologyCategoryPresentation[] =
  TECHNOLOGY_CATEGORIES.map((category) => ({
    ...category,
    ...TECHNOLOGY_CATEGORY_PRESENTATION_BY_ID[category.id],
  }));

export const TECHNOLOGY_CATEGORY_PRESENTATION_MAP: Readonly<
  Record<TechnologyCategoryId, TechnologyCategoryPresentation>
> = TECHNOLOGY_CATEGORY_PRESENTATIONS.reduce(
  (accumulator, category) => {
    accumulator[category.id] = category;
    return accumulator;
  },
  {} as Record<TechnologyCategoryId, TechnologyCategoryPresentation>,
);

export function getTechnologyCategoryPresentation(
  categoryId: TechnologyCategoryId,
): TechnologyCategoryPresentation {
  return TECHNOLOGY_CATEGORY_PRESENTATION_MAP[categoryId];
}
