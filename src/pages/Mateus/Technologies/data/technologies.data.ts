// src/pages/Mateus/Technologies/data/technologies.data.ts

import type {
  TechnologyItem,
  TechnologyMediaAsset,
  TechnologyVisuals,
} from "../domain/technologies.types";

type BuildTechnologyVisualsResult = Readonly<Required<TechnologyVisuals>>;

type CreateTechnologyParams = Readonly<
  Omit<TechnologyItem, "logoSrc" | "heroAsset" | "gallery"> & {
    slug: string;
  }
>;

export const TECHNOLOGY_ICONS_BASE_PATH = "/images/technologies/icons";
export const TECHNOLOGY_VISUALS_BASE_PATH = "/images/technologies";

export function buildTechnologyLogoSrc(slug: string): string {
  return `${TECHNOLOGY_ICONS_BASE_PATH}/${slug}.webp`;
}

export function buildTechnologyVisualBasePath(slug: string): string {
  return `${TECHNOLOGY_VISUALS_BASE_PATH}/${slug}`;
}

function buildTechnologyHeroAsset(
  slug: string,
  name: string,
): TechnologyMediaAsset {
  const basePath = buildTechnologyVisualBasePath(slug);

  return {
    id: `${slug}-hero`,
    kind: "illustration",
    src: `${basePath}/hero.webp`,
    alt: `${name} hero visual`,
    width: 1600,
    height: 900,
  };
}

function buildTechnologyGallery(
  slug: string,
  name: string,
): readonly TechnologyMediaAsset[] {
  const basePath = buildTechnologyVisualBasePath(slug);

  return [
    {
      id: `${slug}-gallery-01`,
      kind: "screenshot",
      src: `${basePath}/gallery-01.webp`,
      alt: `${name} gallery image 01`,
      width: 1600,
      height: 900,
    },
    {
      id: `${slug}-gallery-02`,
      kind: "screenshot",
      src: `${basePath}/gallery-02.webp`,
      alt: `${name} gallery image 02`,
      width: 1600,
      height: 900,
    },
    {
      id: `${slug}-gallery-03`,
      kind: "screenshot",
      src: `${basePath}/gallery-03.webp`,
      alt: `${name} gallery image 03`,
      width: 1600,
      height: 900,
    },
  ];
}

function buildTechnologyVisuals(
  slug: string,
  name: string,
): BuildTechnologyVisualsResult {
  return {
    logoSrc: buildTechnologyLogoSrc(slug),
    heroAsset: buildTechnologyHeroAsset(slug, name),
    gallery: buildTechnologyGallery(slug, name),
  };
}

function createTechnology({
  slug,
  ...technology
}: CreateTechnologyParams): TechnologyItem {
  const visuals = buildTechnologyVisuals(slug, technology.name);

  return {
    ...technology,
    logoSrc: visuals.logoSrc,
    heroAsset: visuals.heroAsset,
    gallery: visuals.gallery,
  };
}

export const TECHNOLOGY_ITEMS: readonly TechnologyItem[] = [
  createTechnology({
    id: "aws",
    slug: "aws",
    name: "AWS",
    label: "Amazon Web Services",
    shortName: "AWS",
    years: 4,
    categoryId: "cloud",
    description:
      "Experiência com EC2, S3, RDS, IAM e filas/eventos usando SQS e SNS.",
    summary:
      "Base cloud voltada para infraestrutura, serviços gerenciados e aplicações escaláveis.",
    aliases: ["amazon web services", "ec2", "s3", "rds", "iam", "sqs", "sns"],
    tags: ["cloud", "infra", "services", "platform"],
    relatedIds: ["gcp", "docker", "kubernetes", "postgresql", "rabbitmq"],
    featured: true,
    priority: 95,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "gcp",
    slug: "gcp",
    name: "GCP",
    label: "Google Cloud Platform",
    shortName: "GCP",
    years: 3,
    categoryId: "cloud",
    description:
      "Experiência com Compute Engine, Cloud SQL, Cloud Storage e Pub/Sub.",
    summary:
      "Uso orientado a compute, banco gerenciado, storage e mensageria na plataforma Google.",
    aliases: [
      "google cloud",
      "google cloud platform",
      "compute engine",
      "cloud sql",
      "cloud storage",
      "pubsub",
      "pub/sub",
    ],
    tags: ["cloud", "storage", "database", "events"],
    relatedIds: ["aws", "docker", "kubernetes", "postgresql", "kafka"],
    featured: true,
    priority: 86,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "docker",
    slug: "docker",
    name: "Docker",
    shortName: "Docker",
    years: 9,
    categoryId: "cloud",
    description:
      "Containerização, isolamento de runtime e empacotamento consistente para ambientes de desenvolvimento e entrega.",
    summary:
      "Peça central da stack de build, execução e padronização de ambientes.",
    aliases: ["containers", "docker engine", "dockerfile"],
    tags: ["containers", "runtime", "delivery"],
    relatedIds: ["kubernetes", "aws", "gcp", "nodejs", "python", "java"],
    featured: true,
    priority: 99,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "kubernetes",
    slug: "kubernetes",
    name: "Kubernetes",
    shortName: "K8s",
    years: 9,
    categoryId: "cloud",
    description:
      "Orquestração, escalabilidade e operação de workloads containerizados.",
    summary:
      "Base operacional para ambientes distribuídos com foco em resiliência e automação.",
    aliases: ["k8s", "orchestration", "cluster"],
    tags: ["containers", "cluster", "orchestration"],
    relatedIds: ["docker", "aws", "gcp", "prometheus", "grafana"],
    featured: true,
    priority: 98,
    shapeVariant: "hex",
  }),

  createTechnology({
    id: "react",
    slug: "react",
    name: "React",
    label: "React / Next.js / TypeScript",
    shortName: "React",
    years: 10,
    categoryId: "frontend",
    description:
      "Construção de interfaces modernas com React, Next.js e TypeScript.",
    summary:
      "Stack principal de frontend para produto, renderização moderna e experiência de usuário.",
    aliases: ["next.js", "nextjs", "typescript", "frontend"],
    tags: ["ui", "spa", "ssr", "web"],
    relatedIds: ["vue", "flutter", "graphql", "nodejs"],
    featured: true,
    priority: 100,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "vue",
    slug: "vue",
    name: "Vue.js",
    label: "Vue.js / Nuxt.js / TypeScript",
    shortName: "Vue",
    years: null,
    categoryId: "frontend",
    description:
      "Stack complementar de interface com Vue.js, Nuxt.js e TypeScript.",
    summary:
      "Tecnologia mapeada para a matriz visual, com tempo total não informado na versão inicial do dataset.",
    aliases: ["nuxt", "nuxt.js", "nuxtjs", "typescript"],
    tags: ["ui", "spa", "frontend"],
    relatedIds: ["react", "flutter", "nodejs"],
    featured: false,
    priority: 68,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "flutter",
    slug: "flutter",
    name: "Flutter",
    shortName: "Flutter",
    years: 6,
    categoryId: "frontend",
    description:
      "Desenvolvimento cross-platform com foco em experiência consistente entre plataformas.",
    summary:
      "Stack mobile com capacidade de entrega visual e rapidez de prototipação.",
    aliases: ["dart", "mobile", "cross platform"],
    tags: ["mobile", "app", "ui"],
    relatedIds: ["react", "vue"],
    featured: true,
    priority: 84,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "java",
    slug: "java",
    name: "Java",
    label: "Java / Spring Boot",
    shortName: "Java",
    years: 10,
    categoryId: "backend-jvm",
    description:
      "Serviços corporativos, APIs e fluxos críticos com Java e Spring Boot.",
    summary:
      "Pilar backend de longa duração, com forte aderência a domínios de negócio e integração.",
    aliases: ["spring", "spring boot", "jvm", "backend"],
    tags: ["api", "enterprise", "services"],
    relatedIds: ["kotlin", "postgresql", "rabbitmq", "kafka"],
    featured: true,
    priority: 100,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "kotlin",
    slug: "kotlin",
    name: "Kotlin",
    shortName: "Kotlin",
    years: 6,
    categoryId: "backend-jvm",
    description:
      "Desenvolvimento em plataforma JVM com foco em robustez, produtividade e qualidade de código.",
    summary:
      "Stack complementar à base Java, com boa sinergia em ambientes de backend corporativo.",
    aliases: ["jvm", "backend kotlin"],
    tags: ["jvm", "services", "backend"],
    relatedIds: ["java", "postgresql", "kafka"],
    featured: true,
    priority: 82,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "nodejs",
    slug: "nodejs",
    name: "Node.js",
    label: "Node.js / Express",
    shortName: "Node",
    years: 8,
    categoryId: "backend-js",
    description:
      "APIs e serviços com Node.js e Express, com foco em produtividade e integração.",
    summary:
      "Stack madura para backends orientados a produto e serviços de entrega rápida.",
    aliases: ["node", "express", "javascript backend", "typescript backend"],
    tags: ["api", "services", "backend"],
    relatedIds: ["nestjs", "graphql", "react", "redis"],
    featured: true,
    priority: 96,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "nestjs",
    slug: "nestjs",
    name: "NestJS",
    shortName: "NestJS",
    years: 5,
    categoryId: "backend-js",
    description:
      "Estruturação de backends escaláveis com NestJS, arquitetura modular e tipagem forte.",
    summary:
      "Framework alinhado a organização enterprise dentro do ecossistema Node.",
    aliases: ["nest", "node framework", "typescript backend"],
    tags: ["api", "framework", "backend"],
    relatedIds: ["nodejs", "graphql", "redis", "postgresql"],
    featured: true,
    priority: 85,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "graphql",
    slug: "graphql",
    name: "GraphQL",
    label: "GraphQL / Apollo Server",
    shortName: "GraphQL",
    years: 3,
    categoryId: "backend-js",
    description:
      "Modelagem de APIs orientadas a schema com GraphQL e Apollo Server.",
    summary:
      "Camada de integração adequada a clients ricos e contratos mais expressivos.",
    aliases: ["apollo", "apollo server", "schema", "resolver"],
    tags: ["api", "schema", "contracts"],
    relatedIds: ["nodejs", "nestjs", "react"],
    featured: false,
    priority: 72,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "python",
    slug: "python",
    name: "Python",
    shortName: "Python",
    years: 8,
    categoryId: "python",
    description:
      "Backend, automação e serviços com foco em produtividade e clareza de implementação.",
    summary:
      "Stack madura para automação, integrações e serviços rápidos.",
    aliases: ["python backend", "automation", "scripts"],
    tags: ["automation", "api", "backend"],
    relatedIds: ["fastapi", "postgresql", "redis", "rabbitmq"],
    featured: true,
    priority: 94,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "fastapi",
    slug: "fastapi",
    name: "FastAPI",
    shortName: "FastAPI",
    years: 5,
    categoryId: "python",
    description:
      "APIs modernas com tipagem, performance e ergonomia para backend Python.",
    summary:
      "Framework principal para serviços HTTP modernos dentro da camada Python.",
    aliases: ["python api", "async api", "pydantic"],
    tags: ["api", "framework", "backend"],
    relatedIds: ["python", "postgresql", "redis", "rabbitmq"],
    featured: true,
    priority: 83,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "postgresql",
    slug: "postgresql",
    name: "PostgreSQL",
    label: "PostgreSQL / SQL",
    shortName: "PostgreSQL",
    years: 10,
    categoryId: "data",
    description:
      "Modelagem relacional, consultas SQL, consistência transacional e suporte a sistemas críticos.",
    summary:
      "Base de dados relacional madura e recorrente em múltiplas stacks do portfólio.",
    aliases: ["postgres", "sql", "database", "relational db"],
    tags: ["database", "sql", "storage"],
    relatedIds: ["mongodb", "redis", "java", "python", "nestjs"],
    featured: true,
    priority: 100,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "mongodb",
    slug: "mongodb",
    name: "MongoDB",
    shortName: "MongoDB",
    years: 6,
    categoryId: "data",
    description:
      "Persistência documental e modelagem flexível para cenários orientados a documentos.",
    summary:
      "Banco NoSQL usado como complemento em arquiteturas que exigem mais elasticidade estrutural.",
    aliases: ["mongo", "nosql", "document database"],
    tags: ["database", "nosql", "documents"],
    relatedIds: ["postgresql", "redis", "nodejs"],
    featured: true,
    priority: 81,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "redis",
    slug: "redis",
    name: "Redis",
    shortName: "Redis",
    years: 5,
    categoryId: "data",
    description:
      "Cache, estruturas em memória e suporte a workloads com necessidade de resposta rápida.",
    summary:
      "Peça de aceleração e suporte a integrações distribuídas.",
    aliases: ["cache", "in-memory", "key value"],
    tags: ["cache", "performance", "storage"],
    relatedIds: ["postgresql", "mongodb", "nodejs", "python"],
    featured: true,
    priority: 79,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "rabbitmq",
    slug: "rabbitmq",
    name: "RabbitMQ",
    shortName: "RabbitMQ",
    years: 5,
    categoryId: "data",
    description:
      "Mensageria, desacoplamento de fluxos e integração assíncrona baseada em filas.",
    summary:
      "Ferramenta central para comunicação assíncrona e orquestração entre serviços.",
    aliases: ["queues", "message broker", "broker"],
    tags: ["messaging", "async", "integration"],
    relatedIds: ["kafka", "python", "fastapi", "java"],
    featured: true,
    priority: 84,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "kafka",
    slug: "kafka",
    name: "Kafka",
    shortName: "Kafka",
    years: 5,
    categoryId: "data",
    description:
      "Streaming, eventos e integração de sistemas com alto volume de troca de mensagens.",
    summary:
      "Stack orientada a eventos e pipelines distribuídos.",
    aliases: ["streaming", "events", "event bus"],
    tags: ["stream", "events", "integration"],
    relatedIds: ["rabbitmq", "java", "kotlin", "gcp"],
    featured: true,
    priority: 83,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "selenium",
    slug: "selenium",
    name: "Selenium",
    shortName: "Selenium",
    years: 10,
    categoryId: "qa",
    description:
      "Automação funcional, regressão e validação de fluxos críticos de interface.",
    summary:
      "Base histórica de QA com forte cobertura de automação end-to-end.",
    aliases: ["browser automation", "ui automation", "e2e"],
    tags: ["qa", "automation", "tests"],
    relatedIds: ["cypress", "playwright", "react"],
    featured: true,
    priority: 98,
    shapeVariant: "hex",
  }),
  createTechnology({
    id: "cypress",
    slug: "cypress",
    name: "Cypress",
    shortName: "Cypress",
    years: 5,
    categoryId: "qa",
    description:
      "Automação moderna de testes end-to-end e validação de comportamento em aplicações web.",
    summary:
      "Ferramenta voltada para confiabilidade de fluxos frontend e integração funcional.",
    aliases: ["e2e", "frontend testing", "ui tests"],
    tags: ["qa", "tests", "frontend"],
    relatedIds: ["selenium", "playwright", "react"],
    featured: true,
    priority: 84,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "playwright",
    slug: "playwright",
    name: "Playwright",
    shortName: "Playwright",
    years: 2,
    categoryId: "qa",
    description:
      "Automação cross-browser recente com foco em confiabilidade e velocidade de feedback.",
    summary:
      "Ferramenta mais nova no ecossistema de testes, útil para fluxos modernos de frontend.",
    aliases: ["browser testing", "e2e", "cross-browser"],
    tags: ["qa", "automation", "tests"],
    relatedIds: ["selenium", "cypress", "react"],
    featured: false,
    priority: 60,
    shapeVariant: "rounded-hex",
  }),

  createTechnology({
    id: "grafana",
    slug: "grafana",
    name: "Grafana",
    shortName: "Grafana",
    years: 5,
    categoryId: "observability",
    description:
      "Dashboards, monitoramento visual e leitura operacional de métricas.",
    summary:
      "Camada visual de observabilidade para acompanhamento contínuo do sistema.",
    aliases: ["dashboards", "monitoring ui", "metrics visualization"],
    tags: ["monitoring", "observability", "dashboards"],
    relatedIds: ["prometheus", "otel", "kubernetes"],
    featured: true,
    priority: 84,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "prometheus",
    slug: "prometheus",
    name: "Prometheus",
    shortName: "Prometheus",
    years: 4,
    categoryId: "observability",
    description:
      "Coleta de métricas, scraping e suporte à análise operacional de sistemas.",
    summary:
      "Fundação métrica para ecossistemas orientados a monitoração.",
    aliases: ["metrics", "scraping", "monitoring"],
    tags: ["metrics", "telemetry", "observability"],
    relatedIds: ["grafana", "otel", "kubernetes"],
    featured: true,
    priority: 78,
    shapeVariant: "rounded-hex",
  }),
  createTechnology({
    id: "otel",
    slug: "otel",
    name: "OpenTelemetry",
    label: "OTel / OpenTelemetry",
    shortName: "OTel",
    years: 3,
    categoryId: "observability",
    description:
      "Instrumentação, traces e padronização de telemetria entre serviços.",
    summary:
      "Camada de observabilidade distribuída para rastreamento e análise de comportamento.",
    aliases: ["opentelemetry", "tracing", "distributed tracing", "otel"],
    tags: ["telemetry", "trace", "observability"],
    relatedIds: ["grafana", "prometheus", "kubernetes"],
    featured: false,
    priority: 70,
    shapeVariant: "rounded-hex",
  }),
] as const;

export const TECHNOLOGY_ITEM_IDS: readonly string[] = TECHNOLOGY_ITEMS.map(
  (item) => item.id,
);

export const TECHNOLOGY_ITEM_MAP: Readonly<Record<string, TechnologyItem>> =
  TECHNOLOGY_ITEMS.reduce(
    (accumulator, item) => {
      accumulator[item.id] = item;
      return accumulator;
    },
    {} as Record<string, TechnologyItem>,
  );

export const TECHNOLOGY_FEATURED_ITEMS: readonly TechnologyItem[] =
  TECHNOLOGY_ITEMS.filter((item) => item.featured);

export const TECHNOLOGY_VISIBLE_ITEMS: readonly TechnologyItem[] =
  TECHNOLOGY_ITEMS.filter((item) => !item.hidden);
