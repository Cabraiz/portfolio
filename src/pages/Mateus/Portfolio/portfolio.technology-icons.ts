// src/pages/Mateus/Portfolio/portfolio.technology-icons.ts

export type PortfolioTechnologyIconItem = Readonly<{
  label: string;
  src: string;
}>;

const TECHNOLOGY_ICON_BASE_PATH = "/images/technologies/icons";

const TECHNOLOGY_ICON_REGISTRY: Readonly<Record<string, string>> = {
  aws: `${TECHNOLOGY_ICON_BASE_PATH}/aws.webp`,
  "amazon web services": `${TECHNOLOGY_ICON_BASE_PATH}/aws.webp`,

  docker: `${TECHNOLOGY_ICON_BASE_PATH}/docker.webp`,

  fastapi: `${TECHNOLOGY_ICON_BASE_PATH}/fastapi.webp`,

  react: `${TECHNOLOGY_ICON_BASE_PATH}/react.webp`,
  "react.js": `${TECHNOLOGY_ICON_BASE_PATH}/react.webp`,
  reactjs: `${TECHNOLOGY_ICON_BASE_PATH}/react.webp`,

  "react native": `${TECHNOLOGY_ICON_BASE_PATH}/react-native.webp`,
  reactnative: `${TECHNOLOGY_ICON_BASE_PATH}/react-native.webp`,

  node: `${TECHNOLOGY_ICON_BASE_PATH}/nodejs.webp`,
  "node.js": `${TECHNOLOGY_ICON_BASE_PATH}/nodejs.webp`,
  nodejs: `${TECHNOLOGY_ICON_BASE_PATH}/nodejs.webp`,

  typescript: `${TECHNOLOGY_ICON_BASE_PATH}/typescript.webp`,
  javascript: `${TECHNOLOGY_ICON_BASE_PATH}/javascript.webp`,

  java: `${TECHNOLOGY_ICON_BASE_PATH}/java.webp`,
  spring: `${TECHNOLOGY_ICON_BASE_PATH}/spring.webp`,
  "spring boot": `${TECHNOLOGY_ICON_BASE_PATH}/spring-boot.webp`,
  springboot: `${TECHNOLOGY_ICON_BASE_PATH}/spring-boot.webp`,

  postgresql: `${TECHNOLOGY_ICON_BASE_PATH}/postgresql.webp`,
  postgres: `${TECHNOLOGY_ICON_BASE_PATH}/postgresql.webp`,

  mongodb: `${TECHNOLOGY_ICON_BASE_PATH}/mongodb.webp`,
  mongo: `${TECHNOLOGY_ICON_BASE_PATH}/mongodb.webp`,

  redis: `${TECHNOLOGY_ICON_BASE_PATH}/redis.webp`,
  rabbitmq: `${TECHNOLOGY_ICON_BASE_PATH}/rabbitmq.webp`,
  kafka: `${TECHNOLOGY_ICON_BASE_PATH}/kafka.webp`,

  kubernetes: `${TECHNOLOGY_ICON_BASE_PATH}/kubernetes.webp`,
  k8s: `${TECHNOLOGY_ICON_BASE_PATH}/kubernetes.webp`,

  graphql: `${TECHNOLOGY_ICON_BASE_PATH}/graphql.webp`,
  apollo: `${TECHNOLOGY_ICON_BASE_PATH}/apollo.webp`,

  vite: `${TECHNOLOGY_ICON_BASE_PATH}/vite.webp`,
  next: `${TECHNOLOGY_ICON_BASE_PATH}/nextjs.webp`,
  "next.js": `${TECHNOLOGY_ICON_BASE_PATH}/nextjs.webp`,
  nextjs: `${TECHNOLOGY_ICON_BASE_PATH}/nextjs.webp`,

  flutter: `${TECHNOLOGY_ICON_BASE_PATH}/flutter.webp`,
  firebase: `${TECHNOLOGY_ICON_BASE_PATH}/firebase.webp`,

  python: `${TECHNOLOGY_ICON_BASE_PATH}/python.webp`,
  nginx: `${TECHNOLOGY_ICON_BASE_PATH}/nginx.webp`,
  figma: `${TECHNOLOGY_ICON_BASE_PATH}/figma.webp`,
};

function normalizeTechnologyName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[().,]/g, "")
    .replace(/\s+/g, " ");
}

function toTechnologySlug(value: string): string {
  return normalizeTechnologyName(value)
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/\s+/g, "-");
}

export function getPortfolioTechnologyIconSrc(
  technology: string,
): string | null {
  const normalized = normalizeTechnologyName(technology);

  if (normalized.length === 0) {
    return null;
  }

  return (
    TECHNOLOGY_ICON_REGISTRY[normalized] ??
    `${TECHNOLOGY_ICON_BASE_PATH}/${toTechnologySlug(technology)}.webp`
  );
}

export function getPortfolioTechnologyIcons(
  technologies: readonly string[],
  maxItems = 5,
): PortfolioTechnologyIconItem[] {
  const unique = new Set<string>();
  const items: PortfolioTechnologyIconItem[] = [];

  for (const technology of technologies) {
    const normalized = normalizeTechnologyName(technology);

    if (!normalized || unique.has(normalized)) {
      continue;
    }

    unique.add(normalized);

    const src = getPortfolioTechnologyIconSrc(technology);

    if (!src) {
      continue;
    }

    items.push({
      label: technology,
      src,
    });

    if (items.length >= maxItems) {
      break;
    }
  }

  return items;
}
