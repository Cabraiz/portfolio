import type {
  TechnologyItem,
  TechnologyMediaAsset,
} from "../domain/technologies.types";

type BuildTechnologyVisualsResult = Readonly<{
  logoSrc: string;
  heroAsset: TechnologyMediaAsset;
  gallery: readonly TechnologyMediaAsset[];
}>;

type CreateTechnologyParams = Readonly<
  Omit<
    TechnologyItem,
    "logoSrc" | "heroAsset" | "gallery" | "trunfoData"
  > & {
    slug: string;
  }
>;

export const TECHNOLOGY_ICONS_BASE_PATH = "/images/technologies/icons";
export const TECHNOLOGY_VISUALS_BASE_PATH = "/images/technologies";
export const TECHNOLOGY_BANNERS_BASE_PATH = "/images/technologies/banner";

export function buildTechnologyLogoSrc(slug: string): string {
  return `${TECHNOLOGY_ICONS_BASE_PATH}/${slug}.webp`;
}

export function buildTechnologyVisualBasePath(slug: string): string {
  return `${TECHNOLOGY_VISUALS_BASE_PATH}/${slug}`;
}

export function buildTechnologyBannerBasePath(slug: string): string {
  return `${TECHNOLOGY_BANNERS_BASE_PATH}/${slug}`;
}

export function buildTechnologyBannerSrc(
  slug: string,
  extension: "webp" | "png" = "webp",
): string {
  return `${buildTechnologyBannerBasePath(slug)}.${extension}`;
}

function buildTechnologyHeroAsset(
  slug: string,
  name: string,
): TechnologyMediaAsset {
  return {
    id: `${slug}-hero`,
    kind: "illustration",
    src: buildTechnologyBannerSrc(slug, "webp"),
    alt: `${name} technical card visual`,
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
    trunfoData: null,
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
    aliases: ["amazon web services", "ec2", "s3", "rds", "iam", "sqs", "sns"],
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
    aliases: [
      "google cloud",
      "google cloud platform",
      "compute engine",
      "cloud sql",
      "cloud storage",
      "pubsub",
      "pub/sub",
    ],
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
    aliases: ["containers", "docker engine", "dockerfile"],
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
    aliases: ["k8s", "orchestration", "cluster"],
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
    aliases: ["next.js", "nextjs", "typescript", "frontend"],
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
    aliases: ["nuxt", "nuxt.js", "nuxtjs", "typescript"],
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
    aliases: ["dart", "mobile", "cross platform"],
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
    aliases: ["spring", "spring boot", "jvm", "backend"],
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
    aliases: ["jvm", "backend kotlin"],
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
    aliases: ["node", "express", "javascript backend", "typescript backend"],
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
    aliases: ["nest", "node framework", "typescript backend"],
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
    aliases: ["apollo", "apollo server", "schema", "resolver"],
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
    aliases: ["python backend", "automation", "scripts"],
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
    aliases: ["python api", "async api", "pydantic"],
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
    aliases: ["postgres", "sql", "database", "relational db"],
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
    aliases: ["mongo", "nosql", "document database"],
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
    aliases: ["cache", "in-memory", "key value"],
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
    aliases: ["queues", "message broker", "broker"],
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
    aliases: ["streaming", "events", "event bus"],
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
    aliases: ["browser automation", "ui automation", "e2e"],
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
    aliases: ["e2e", "frontend testing", "ui tests"],
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
    aliases: ["browser testing", "e2e", "cross-browser"],
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
    aliases: ["dashboards", "monitoring ui", "metrics visualization"],
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
    aliases: ["metrics", "scraping", "monitoring"],
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
    aliases: [
      "opentelemetry",
      "open telemetry",
      "tracing",
      "distributed tracing",
      "otel",
    ],
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
