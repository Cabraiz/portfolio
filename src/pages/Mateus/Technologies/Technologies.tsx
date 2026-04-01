import React, { useEffect, useMemo, useState } from "react";

import type { TechnologyClusterLegendItem } from "./ui/clusters/TechnologyClusterLegend";
import type { TechnologiesFilterItem } from "./ui/filters/TechnologiesFilterBar";
import type { TechnologySpotlightItem } from "./ui/spotlight/TechnologySpotlightPanel";
import TechnologiesDesktop from "./TechnologiesDesktop";
import TechnologiesMobile from "./TechnologiesMobile";
import styles from "./TechnologiesSection.module.css";

export type TechnologyClusterId =
  | "cloud"
  | "frontend"
  | "backend"
  | "data"
  | "quality";

export type TechnologyCatalogItem = TechnologySpotlightItem &
  Readonly<{
    clusterId: TechnologyClusterId;
  }>;

export type TechnologyClusterViewModel = Readonly<{
  id: TechnologyClusterId;
  title: string;
  description: string;
  eyebrow: string;
  countLabel: string;
  legendItems: readonly TechnologyClusterLegendItem[];
  items: readonly TechnologyCatalogItem[];
}>;

export type TechnologiesPresentationProps = Readonly<{
  filters: readonly TechnologiesFilterItem[];
  activeFilterId: string;
  activeItem: TechnologyCatalogItem | null;
  clusters: readonly TechnologyClusterViewModel[];
  totalCount: number;
  visibleCount: number;
  clusterCount: number;
  summaryLabel: string;
  resultText: string;
  experienceRangeLabel: string;
  onChangeFilter: (filterId: string) => void;
  onResetFilter: () => void;
  onSelectItem: (item: TechnologyCatalogItem) => void;
}>;

const MOBILE_BREAKPOINT_PX = 920;

type ClusterMeta = Readonly<{
  title: string;
  eyebrow: string;
  description: string;
  shortFilterLabel: string;
  tone:
    | "cloud"
    | "frontend"
    | "backend"
    | "data"
    | "qa"
    | "observability";
  accentRgb: string;
  legendColor: string;
}>;

const CLUSTER_META: Record<TechnologyClusterId, ClusterMeta> = {
  cloud: {
    title: "Cloud & Infrastructure",
    eyebrow: "Platform Foundation",
    description:
      "Base de deploy, escalabilidade, runtime de produção, governança e operação distribuída.",
    shortFilterLabel: "Cloud",
    tone: "cloud",
    accentRgb: "73, 139, 255",
    legendColor:
      "linear-gradient(180deg, rgba(73,139,255,0.96), rgba(73,139,255,0.56))",
  },
  frontend: {
    title: "Frontend & Mobile",
    eyebrow: "Experience Layer",
    description:
      "Camada de experiência, interface, rendering, navegação e construção de produto voltado ao usuário final.",
    shortFilterLabel: "Front/Mobile",
    tone: "frontend",
    accentRgb: "61, 215, 188",
    legendColor:
      "linear-gradient(180deg, rgba(61,215,188,0.96), rgba(61,215,188,0.56))",
  },
  backend: {
    title: "Backend & APIs",
    eyebrow: "Business Platform",
    description:
      "Serviços de domínio, contratos, integrações, arquitetura backend e fluxos orientados a produto.",
    shortFilterLabel: "Backend",
    tone: "backend",
    accentRgb: "255, 170, 76",
    legendColor:
      "linear-gradient(180deg, rgba(255,170,76,0.96), rgba(255,170,76,0.56))",
  },
  data: {
    title: "Data, Storage & Messaging",
    eyebrow: "Data Circulation",
    description:
      "Persistência, caching, mensageria, sincronização e throughput para cenários distribuídos.",
    shortFilterLabel: "Data/Messaging",
    tone: "data",
    accentRgb: "168, 122, 255",
    legendColor:
      "linear-gradient(180deg, rgba(168,122,255,0.96), rgba(168,122,255,0.56))",
  },
  quality: {
    title: "Quality & Observability",
    eyebrow: "Delivery Confidence",
    description:
      "Testes automatizados, qualidade contínua, rastreabilidade, métricas e operação confiável.",
    shortFilterLabel: "QA/Obs",
    tone: "observability",
    accentRgb: "255, 214, 84",
    legendColor:
      "linear-gradient(180deg, rgba(255,214,84,0.96), rgba(255,214,84,0.56))",
  },
};

function getBrowserWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveIsMobileFromWindow(browserWindow: Window): boolean {
  return browserWindow.innerWidth < MOBILE_BREAKPOINT_PX;
}

function useIsMobileTechnologies(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return false;
    }

    return resolveIsMobileFromWindow(browserWindow);
  });

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const mediaQuery = browserWindow.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`,
    );

    const applyMatch = (): void => {
      setIsMobile(mediaQuery.matches);
    };

    applyMatch();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyMatch);

      return () => {
        mediaQuery.removeEventListener("change", applyMatch);
      };
    }

    browserWindow.addEventListener("resize", applyMatch, { passive: true });

    return () => {
      browserWindow.removeEventListener("resize", applyMatch);
    };
  }, []);

  return isMobile;
}

function formatYears(years?: number | null): string {
  if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
    return "Experiência consistente";
  }

  if (years === 1) {
    return "1 ano";
  }

  return `${years} anos`;
}

function resolveLevelLabel(years?: number | null): string {
  if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
    return "Base sólida";
  }

  if (years >= 9) {
    return "Sênior";
  }

  if (years >= 6) {
    return "Avançado";
  }

  if (years >= 3) {
    return "Forte";
  }

  return "Em evolução";
}

function resolveConfidenceLabel(years?: number | null): string {
  if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
    return "Recorrente";
  }

  if (years >= 8) {
    return "Stack core";
  }

  if (years >= 5) {
    return "Muito recorrente";
  }

  if (years >= 3) {
    return "Bem estabelecida";
  }

  return "Uso específico";
}

function resolveDeliveryLabel(years?: number | null): string {
  if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
    return "Aplicação prática";
  }

  if (years >= 6) {
    return "Produção contínua";
  }

  if (years >= 3) {
    return "Entrega recorrente";
  }

  return "Aplicação dirigida";
}

type CreateTechnologyInput = Readonly<{
  id: string;
  name: string;
  clusterId: TechnologyClusterId;
  years?: number | null;
  description: string;
  badges?: readonly string[];
  related?: readonly string[];
  highlights?: readonly string[];
  subtitle?: string;
  heroCaptionText?: string;
}>;

function createTechnology({
  id,
  name,
  clusterId,
  years = null,
  description,
  badges = [],
  related = [],
  highlights = [],
  subtitle,
  heroCaptionText,
}: CreateTechnologyInput): TechnologyCatalogItem {
  const clusterMeta = CLUSTER_META[clusterId];
  const levelLabel = resolveLevelLabel(years);
  const confidenceLabel = resolveConfidenceLabel(years);
  const deliveryLabel = resolveDeliveryLabel(years);

  return {
    id,
    name,
    years,
    description,
    clusterId,
    categoryLabel: clusterMeta.title,
    levelLabel,
    tone: clusterMeta.tone,
    accentRgb: clusterMeta.accentRgb,
    badges,
    relatedIcons: related.slice(0, 4).map((itemName) => ({
      id: `${id}-${itemName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
      name: itemName,
    })),
    eyebrow: clusterMeta.eyebrow,
    subtitle:
      subtitle ??
      `${name} aparece aqui como uma capacidade aplicada dentro do eixo ${clusterMeta.title.toLowerCase()}, com foco em profundidade técnica, consistência de uso e contexto real de entrega.`,
    levelDescription: `${formatYears(years)} de atuação somados a cenários de entrega, manutenção, evolução e integração com o restante da stack.`,
    heroCaptionTitle: `${name} dentro de ${clusterMeta.title}`,
    heroCaptionText:
      heroCaptionText ??
      "Leitura editorial da tecnologia com experiência, profundidade, ecossistema relacionado e organização visual por domínio.",
    highlights:
      highlights.length > 0
        ? highlights
        : [
            formatYears(years),
            levelLabel,
            clusterMeta.shortFilterLabel,
            deliveryLabel,
          ],
    relatedStack: related.map((itemName) => ({
      id: `${id}-stack-${itemName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
      name: itemName,
      tone: clusterMeta.tone,
      label: clusterMeta.shortFilterLabel,
      description: `${itemName} aparece como parte do ecossistema que normalmente acompanha ${name} em cenários de arquitetura, integração e entrega.`,
    })),
    evidenceGallery: [
      {
        id: `${id}-evidence-architecture`,
        title: `${name} em arquitetura aplicada`,
        description: `Exemplo editorial para posicionar ${name} dentro do fluxo técnico, mostrando onde ele entra na solução e como se conecta ao restante da stack.`,
        meta: "Architecture View",
      },
      {
        id: `${id}-evidence-delivery`,
        title: `${name} em fluxo de entrega`,
        description: `Cartão visual para comunicar a presença da tecnologia em pipelines, produção, produto e evolução contínua.`,
        meta: "Delivery View",
      },
      {
        id: `${id}-evidence-ecosystem`,
        title: `${name} no ecossistema relacionado`,
        description: `Bloco visual pensado para logo, screenshot, diagrama ou interface que reforce senioridade e repertório sobre ${name}.`,
        meta: "Ecosystem View",
      },
    ],
    metrics: [
      {
        id: `${id}-metric-experience`,
        label: "Experiência",
        value: formatYears(years),
      },
      {
        id: `${id}-metric-level`,
        label: "Nível",
        value: levelLabel,
      },
      {
        id: `${id}-metric-delivery`,
        label: "Entrega",
        value: deliveryLabel,
      },
      {
        id: `${id}-metric-cluster`,
        label: "Cluster",
        value: clusterMeta.shortFilterLabel,
      },
    ],
    deliveryLabel,
    confidenceLabel,
  };
}

const TECHNOLOGY_CATALOG: readonly TechnologyCatalogItem[] = [
  createTechnology({
    id: "aws",
    name: "AWS",
    clusterId: "cloud",
    years: 4,
    description:
      "Atuação com EC2, S3, RDS, IAM e fluxos de mensageria para provisionamento, serviços distribuídos e sustentação de ambientes em nuvem.",
    badges: ["EC2", "S3", "RDS", "IAM", "SQS/SNS"],
    related: ["Docker", "Kubernetes", "Node.js", "PostgreSQL"],
    highlights: ["Cloud runtime", "Infra de produto", "Serviços gerenciados"],
  }),
  createTechnology({
    id: "gcp",
    name: "GCP",
    clusterId: "cloud",
    years: 3,
    description:
      "Experiência com Compute Engine, Cloud SQL, Cloud Storage e Pub/Sub para workloads em produção, backend e integração com serviços gerenciados.",
    badges: ["Compute Engine", "Cloud SQL", "Cloud Storage", "Pub/Sub"],
    related: ["Kubernetes", "Python", "FastAPI", "PostgreSQL"],
    highlights: ["Cloud services", "Serviços gerenciados", "Integração backend"],
  }),
  createTechnology({
    id: "docker",
    name: "Docker",
    clusterId: "cloud",
    years: 9,
    description:
      "Containerização madura para padronizar ambiente, pipeline, build e isolamento de serviços em cenários de desenvolvimento e produção.",
    badges: ["Containers", "Build", "Runtime"],
    related: ["Kubernetes", "AWS", "GCP", "Node.js"],
    highlights: ["Stack core", "Ambientes reproduzíveis", "Entrega contínua"],
  }),
  createTechnology({
    id: "kubernetes",
    name: "Kubernetes",
    clusterId: "cloud",
    years: 9,
    description:
      "Orquestração de workloads e serviços distribuídos com foco em escalabilidade, resiliência e operação de ambientes complexos.",
    badges: ["Orquestração", "Escalabilidade", "Runtime"],
    related: ["Docker", "AWS", "GCP", "Prometheus"],
    highlights: ["Plataforma", "Escala", "Operação distribuída"],
  }),
  createTechnology({
    id: "react-next-typescript",
    name: "React / Next.js / TypeScript",
    clusterId: "frontend",
    years: 10,
    description:
      "Construção de produtos de interface com forte base em React, ecossistema Next.js e modelagem tipada em TypeScript.",
    badges: ["React", "Next.js", "TypeScript"],
    related: ["GraphQL", "Node.js", "Playwright", "OTel"],
    highlights: ["UI de produto", "SSR/SPA", "Arquitetura frontend"],
  }),
  createTechnology({
    id: "vue-nuxt-typescript",
    name: "Vue.js / Nuxt.js / TypeScript",
    clusterId: "frontend",
    years: null,
    description:
      "Repertório com Vue e Nuxt para aplicações web tipadas e orientadas a produto, mantendo coerência arquitetural no frontend.",
    badges: ["Vue.js", "Nuxt.js", "TypeScript"],
    related: ["Node.js", "GraphQL", "MongoDB"],
    highlights: ["Alternativa madura", "Frontend tipado", "Arquitetura web"],
  }),
  createTechnology({
    id: "flutter",
    name: "Flutter",
    clusterId: "frontend",
    years: 6,
    description:
      "Entrega de interfaces mobile com foco em consistência visual, velocidade de iteração e reutilização de padrões de produto.",
    badges: ["Mobile", "Cross-platform", "UI"],
    related: ["Firebase", "Node.js", "GraphQL", "REST APIs"],
    highlights: ["Mobile product", "UI consistente", "Cross-platform"],
  }),
  createTechnology({
    id: "graphql-apollo",
    name: "GraphQL / Apollo Server",
    clusterId: "backend",
    years: 3,
    description:
      "Modelagem de contratos orientados a consumo eficiente de dados, com GraphQL e camadas de resolução integradas ao backend.",
    badges: ["GraphQL", "Apollo Server", "Schema"],
    related: ["Node.js", "React", "PostgreSQL", "Redis"],
    highlights: ["Contratos tipados", "Schema-first", "Consumo eficiente"],
  }),
  createTechnology({
    id: "java-spring",
    name: "Java / Spring Boot",
    clusterId: "backend",
    years: 10,
    description:
      "Base robusta para APIs, serviços de domínio e aplicações backend com foco em arquitetura empresarial e manutenção evolutiva.",
    badges: ["Java", "Spring Boot", "APIs"],
    related: ["PostgreSQL", "Kafka", "Redis", "Prometheus"],
    highlights: ["Stack core", "Backend enterprise", "APIs e domínio"],
  }),
  createTechnology({
    id: "kotlin",
    name: "Kotlin",
    clusterId: "backend",
    years: 6,
    description:
      "Uso de Kotlin como linguagem moderna para backend, aproveitando concisão, segurança e interoperabilidade no ecossistema JVM.",
    badges: ["JVM", "Backend", "Interoperabilidade"],
    related: ["Java", "Spring Boot", "PostgreSQL"],
    highlights: ["JVM moderna", "Código conciso", "Backend pragmático"],
  }),
  createTechnology({
    id: "node-express",
    name: "Node.js / Express",
    clusterId: "backend",
    years: 8,
    description:
      "Construção de APIs e serviços rápidos de iterar, com forte aplicabilidade em integrações, produto digital e serviços web.",
    badges: ["Node.js", "Express", "APIs"],
    related: ["NestJS", "GraphQL", "MongoDB", "Redis"],
    highlights: ["Entrega rápida", "Serviços web", "Integração de produto"],
  }),
  createTechnology({
    id: "nestjs",
    name: "NestJS",
    clusterId: "backend",
    years: 5,
    description:
      "Arquitetura backend mais estruturada no ecossistema Node, com organização modular, contratos claros e boa escalabilidade de código.",
    badges: ["NestJS", "Modules", "Architecture"],
    related: ["Node.js", "GraphQL", "Kafka", "Redis"],
    highlights: ["Estrutura", "Modularidade", "Backend escalável"],
  }),
  createTechnology({
    id: "python",
    name: "Python",
    clusterId: "backend",
    years: 8,
    description:
      "Linguagem versátil aplicada a serviços, automações, integrações e workloads que exigem agilidade com boa produtividade.",
    badges: ["Automation", "APIs", "Scripts"],
    related: ["FastAPI", "GCP", "RabbitMQ", "PostgreSQL"],
    highlights: ["Versatilidade", "Produtividade", "Automação e APIs"],
  }),
  createTechnology({
    id: "fastapi",
    name: "FastAPI",
    clusterId: "backend",
    years: 5,
    description:
      "Framework para APIs modernas em Python, com tipagem, performance e ergonomia adequada a serviços orientados a produto.",
    badges: ["FastAPI", "Python", "Typed APIs"],
    related: ["Python", "PostgreSQL", "Redis", "GCP"],
    highlights: ["APIs modernas", "Tipagem", "Velocidade de entrega"],
  }),
  createTechnology({
    id: "postgresql",
    name: "PostgreSQL",
    clusterId: "data",
    years: 10,
    description:
      "Banco relacional sólido para domínio transacional, modelagem consistente, consultas complexas e operação em produção.",
    badges: ["SQL", "Relational", "Transactions"],
    related: ["Java", "Node.js", "Python", "Redis"],
    highlights: ["Persistência core", "SQL forte", "Base transacional"],
  }),
  createTechnology({
    id: "mongodb",
    name: "MongoDB",
    clusterId: "data",
    years: 6,
    description:
      "Persistência orientada a documentos para cenários com flexibilidade de estrutura e modelos de dados mais adaptativos.",
    badges: ["Document DB", "Flexible Schema", "NoSQL"],
    related: ["Node.js", "NestJS", "GraphQL"],
    highlights: ["Document store", "Flexibilidade", "NoSQL pragmático"],
  }),
  createTechnology({
    id: "redis",
    name: "Redis",
    clusterId: "data",
    years: 5,
    description:
      "Camada de cache e estruturas rápidas para desacoplamento, aceleração de leitura e apoio a fluxos de alta recorrência.",
    badges: ["Cache", "In-memory", "Performance"],
    related: ["PostgreSQL", "Node.js", "Java", "RabbitMQ"],
    highlights: ["Performance", "Cache", "Baixa latência"],
  }),
  createTechnology({
    id: "rabbitmq",
    name: "RabbitMQ",
    clusterId: "data",
    years: 5,
    description:
      "Mensageria aplicada a desacoplamento, filas de processamento, distribuição de tarefas e integração entre serviços.",
    badges: ["Queues", "Messaging", "Async flows"],
    related: ["Python", "Node.js", "Redis", "PostgreSQL"],
    highlights: ["Assíncrono", "Desacoplamento", "Processamento distribuído"],
  }),
  createTechnology({
    id: "kafka",
    name: "Kafka",
    clusterId: "data",
    years: 5,
    description:
      "Streaming e mensageria orientados a throughput, integração de eventos e fluxos com maior volume e resiliência.",
    badges: ["Streaming", "Events", "Throughput"],
    related: ["Java", "Spring Boot", "Prometheus", "OTel"],
    highlights: ["Event-driven", "Streaming", "Alta escala"],
  }),
  createTechnology({
    id: "selenium",
    name: "Selenium",
    clusterId: "quality",
    years: 10,
    description:
      "Automação consolidada para fluxos de teste, validação funcional e suporte a cenários críticos de qualidade.",
    badges: ["Browser automation", "Functional tests", "Regression"],
    related: ["Cypress", "Playwright", "Grafana"],
    highlights: ["QA core", "Automação", "Cobertura funcional"],
  }),
  createTechnology({
    id: "cypress",
    name: "Cypress",
    clusterId: "quality",
    years: 5,
    description:
      "Testes end-to-end e validação de fluxos de interface com ergonomia alta para times que exigem feedback rápido.",
    badges: ["E2E", "Frontend QA", "Fast feedback"],
    related: ["React", "Playwright", "Grafana"],
    highlights: ["E2E", "Feedback rápido", "Frontend quality"],
  }),
  createTechnology({
    id: "playwright",
    name: "Playwright",
    clusterId: "quality",
    years: 2,
    description:
      "Automação moderna para testes de interface e fluxos cross-browser com boa estabilidade e abrangência.",
    badges: ["Cross-browser", "E2E", "Automation"],
    related: ["React", "Cypress", "OTel"],
    highlights: ["Cross-browser", "UI testing", "Automação moderna"],
  }),
  createTechnology({
    id: "grafana",
    name: "Grafana",
    clusterId: "quality",
    years: 5,
    description:
      "Construção de dashboards e leitura operacional para acompanhar comportamento de serviços, métricas e saúde do sistema.",
    badges: ["Dashboards", "Metrics", "Monitoring"],
    related: ["Prometheus", "OTel", "Kubernetes"],
    highlights: [
      "Visualização operacional",
      "Leitura executiva",
      "Observabilidade",
    ],
  }),
  createTechnology({
    id: "prometheus",
    name: "Prometheus",
    clusterId: "quality",
    years: 4,
    description:
      "Coleta e organização de métricas para monitoramento, alertas e suporte a decisões operacionais baseadas em dados.",
    badges: ["Metrics", "Scraping", "Alerting"],
    related: ["Grafana", "Kubernetes", "OTel"],
    highlights: ["Métricas", "Monitoramento", "Sustentação operacional"],
  }),
  createTechnology({
    id: "otel",
    name: "OpenTelemetry",
    clusterId: "quality",
    years: 3,
    description:
      "Instrumentação de traces, métricas e sinais operacionais para melhorar leitura de comportamento distribuído.",
    badges: ["Tracing", "Telemetry", "Observability"],
    related: ["Grafana", "Prometheus", "Kafka"],
    highlights: ["Tracing", "Instrumentação", "Sinais distribuídos"],
  }),
].sort((left, right) => {
  const leftYears =
    typeof left.years === "number" && Number.isFinite(left.years)
      ? left.years
      : -1;
  const rightYears =
    typeof right.years === "number" && Number.isFinite(right.years)
      ? right.years
      : -1;

  return rightYears - leftYears || left.name.localeCompare(right.name);
});

function buildLegendItems(
  clusterId: TechnologyClusterId,
  items: readonly TechnologyCatalogItem[],
): readonly TechnologyClusterLegendItem[] {
  const clusterMeta = CLUSTER_META[clusterId];
  const withKnownYears = items.filter(
    (item) => typeof item.years === "number" && Number.isFinite(item.years),
  );
  const maxYears = withKnownYears.length
    ? Math.max(...withKnownYears.map((item) => item.years as number))
    : null;

  return [
    {
      id: `${clusterId}-legend-cluster`,
      label: clusterMeta.shortFilterLabel,
      value: `${items.length} itens`,
      color: clusterMeta.legendColor,
      emphasis: "strong",
    },
    {
      id: `${clusterId}-legend-depth`,
      label: "Maior senioridade",
      value: maxYears ? `${maxYears} anos` : "Base sólida",
      color:
        "linear-gradient(180deg, rgba(255,248,230,0.92), rgba(255,248,230,0.42))",
    },
    {
      id: `${clusterId}-legend-focus`,
      label: "Leitura",
      value: "UX + profundidade",
      color:
        "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,255,255,0.36))",
    },
  ];
}

function getExperienceRangeLabel(
  items: readonly TechnologyCatalogItem[],
): string {
  const knownYears = items
    .map((item) => item.years)
    .filter(
      (years): years is number =>
        typeof years === "number" && Number.isFinite(years) && years > 0,
    );

  if (!knownYears.length) {
    return "Base consolidada";
  }

  const min = Math.min(...knownYears);
  const max = Math.max(...knownYears);

  if (min === max) {
    return `${max} anos`;
  }

  return `${min}–${max} anos`;
}

function buildClusters(
  activeFilterId: string,
  items: readonly TechnologyCatalogItem[],
): TechnologyClusterViewModel[] {
  const clusterIds = Object.keys(CLUSTER_META) as TechnologyClusterId[];

  return clusterIds.reduce<TechnologyClusterViewModel[]>(
    (clusters, clusterId) => {
      if (activeFilterId !== "all" && activeFilterId !== clusterId) {
        return clusters;
      }

      const clusterMeta = CLUSTER_META[clusterId];
      const clusterItems = items.filter((item) => item.clusterId === clusterId);

      const cluster: TechnologyClusterViewModel = {
        id: clusterId,
        title: clusterMeta.title,
        eyebrow: clusterMeta.eyebrow,
        description: clusterMeta.description,
        countLabel:
          clusterItems.length === 1
            ? "1 tecnologia"
            : `${clusterItems.length} tecnologias`,
        legendItems: buildLegendItems(clusterId, clusterItems),
        items: clusterItems,
      };

      clusters.push(cluster);
      return clusters;
    },
    [],
  );
}

function buildFilters(
  items: readonly TechnologyCatalogItem[],
): readonly TechnologiesFilterItem[] {
  const clusterIds = Object.keys(CLUSTER_META) as TechnologyClusterId[];

  return clusterIds.map((clusterId) => {
    const clusterMeta = CLUSTER_META[clusterId];

    return {
      id: clusterId,
      label: clusterMeta.title,
      shortLabel: clusterMeta.shortFilterLabel,
      count: items.filter((item) => item.clusterId === clusterId).length,
      color: `rgba(${clusterMeta.accentRgb}, 0.92)`,
    } satisfies TechnologiesFilterItem;
  });
}

const Technologies: React.FC = () => {
  const isMobile = useIsMobileTechnologies();

  const [activeFilterId, setActiveFilterId] = useState<string>("all");
  const [activeTechnologyId, setActiveTechnologyId] = useState<string>(
    TECHNOLOGY_CATALOG[0]?.id ?? "",
  );

  const filters = useMemo(() => buildFilters(TECHNOLOGY_CATALOG), []);

  const clusters = useMemo(
    () => buildClusters(activeFilterId, TECHNOLOGY_CATALOG),
    [activeFilterId],
  );

  const visibleItems = useMemo(
    () => clusters.flatMap((cluster) => cluster.items),
    [clusters],
  );

  const activeItem = useMemo<TechnologyCatalogItem | null>(() => {
    return (
      visibleItems.find((item) => item.id === activeTechnologyId) ??
      visibleItems[0] ??
      null
    );
  }, [activeTechnologyId, visibleItems]);

  useEffect(() => {
    if (!visibleItems.length) {
      return;
    }

    const hasActiveVisible = visibleItems.some(
      (item) => item.id === activeTechnologyId,
    );

    if (!hasActiveVisible) {
      setActiveTechnologyId(visibleItems[0].id);
    }
  }, [activeTechnologyId, visibleItems]);

  const totalCount = TECHNOLOGY_CATALOG.length;
  const visibleCount = visibleItems.length;
  const clusterCount = clusters.length;
  const experienceRangeLabel = getExperienceRangeLabel(TECHNOLOGY_CATALOG);

  const presentationProps: TechnologiesPresentationProps = {
    filters,
    activeFilterId,
    activeItem,
    clusters,
    totalCount,
    visibleCount,
    clusterCount,
    experienceRangeLabel,
    summaryLabel: `${totalCount} tecnologias mapeadas`,
    resultText:
      activeFilterId === "all"
        ? `Exibindo a matriz completa com ${visibleCount} tecnologias distribuídas em ${clusterCount} clusters.`
        : `Filtro ativo com ${visibleCount} tecnologias no cluster selecionado.`,
    onChangeFilter: setActiveFilterId,
    onResetFilter: () => setActiveFilterId("all"),
    onSelectItem: (item) => setActiveTechnologyId(item.id),
  };

  return (
    <div
      className={styles.section}
      data-technologies-root="true"
      data-technologies-viewport={isMobile ? "mobile" : "desktop"}
    >
      {isMobile ? (
        <TechnologiesMobile {...presentationProps} />
      ) : (
        <TechnologiesDesktop {...presentationProps} />
      )}
    </div>
  );
};

export default Technologies;
