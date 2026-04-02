import React, { useEffect, useMemo, useState } from "react";

import { TECHNOLOGY_ITEM_MAP, TECHNOLOGY_ITEMS } from "./data/technologies.data";
import type {
  TechnologyCategoryId,
  TechnologyItem,
} from "./domain/technologies.types";
import TechnologiesDesktop from "./TechnologiesDesktop";
import TechnologiesMobile from "./TechnologiesMobile";
import styles from "./TechnologiesSection.module.css";
import type { TechnologyClusterLegendItem } from "./ui/clusters/TechnologyClusterLegend";
import type { TechnologiesFilterItem } from "./ui/filters/TechnologiesFilterBar";
import type { TechnologySpotlightItem } from "./ui/spotlight/TechnologySpotlightPanel";
import type { TechnologyRelatedStackItem } from "./ui/spotlight/TechnologyRelatedStack";
import type { TechnologyEvidenceGalleryItem } from "./ui/spotlight/TechnologyEvidenceGallery";
import type { TechnologyRelatedIcon } from "./ui/hex/TechnologyHexCard";

export type TechnologyClusterId =
  | "cloud"
  | "frontend"
  | "backend"
  | "data"
  | "quality";

export type TechnologyCatalogItem = TechnologySpotlightItem &
  Readonly<{
    clusterId: TechnologyClusterId;
    sourceCategoryId: TechnologyCategoryId;
    featured?: boolean;
    priority?: number;
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

const TOKEN_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  api: "API",
  apis: "APIs",
  ui: "UI",
  ux: "UX",
  qa: "QA",
  sql: "SQL",
  nosql: "NoSQL",
  ssr: "SSR",
  spa: "SPA",
  jvm: "JVM",
  ec2: "EC2",
  s3: "S3",
  rds: "RDS",
  iam: "IAM",
  sqs: "SQS",
  sns: "SNS",
  aws: "AWS",
  gcp: "GCP",
  otel: "OTel",
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

function mapCategoryToClusterId(
  categoryId: TechnologyCategoryId,
): TechnologyClusterId {
  switch (categoryId) {
    case "cloud":
      return "cloud";
    case "frontend":
      return "frontend";
    case "backend-jvm":
    case "backend-js":
    case "python":
      return "backend";
    case "data":
      return "data";
    case "qa":
    case "observability":
      return "quality";
    default:
      return "backend";
  }
}

function formatTokenLabel(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return value;
  }

  const lowered = normalized.toLowerCase();
  const override = TOKEN_LABEL_OVERRIDES[lowered];

  if (override) {
    return override;
  }

  return normalized
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((token) => {
      const tokenLower = token.toLowerCase();
      const tokenOverride = TOKEN_LABEL_OVERRIDES[tokenLower];

      if (tokenOverride) {
        return tokenOverride;
      }

      if (token.length <= 3) {
        return token.toUpperCase();
      }

      return `${token.charAt(0).toUpperCase()}${token.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function buildBadges(item: TechnologyItem): readonly string[] {
  const tags = item.tags?.map(formatTokenLabel) ?? [];

  if (tags.length > 0) {
    return tags.slice(0, 3);
  }

  const aliases = item.aliases?.map(formatTokenLabel) ?? [];
  return aliases.slice(0, 3);
}

function buildHighlights(
  item: TechnologyItem,
  clusterMeta: ClusterMeta,
): readonly string[] {
  const levelLabel = resolveLevelLabel(item.years);
  const deliveryLabel = resolveDeliveryLabel(item.years);

  return [
    formatYears(item.years),
    levelLabel,
    clusterMeta.shortFilterLabel,
    deliveryLabel,
  ].slice(0, 4);
}

function buildRelatedIcons(
  item: TechnologyItem,
): readonly TechnologyRelatedIcon[] {
  return (item.relatedIds ?? []).slice(0, 4).reduce<TechnologyRelatedIcon[]>(
    (accumulator, relatedId) => {
      const relatedItem = TECHNOLOGY_ITEM_MAP[relatedId];

      if (!relatedItem) {
        return accumulator;
      }

      accumulator.push({
        id: `${item.id}-${relatedItem.id}`,
        name: relatedItem.shortName ?? relatedItem.name,
        src: relatedItem.logoSrc ?? undefined,
      });

      return accumulator;
    },
    [],
  );
}

function buildRelatedStack(
  item: TechnologyItem,
  clusterMeta: ClusterMeta,
): readonly TechnologyRelatedStackItem[] {
  return (item.relatedIds ?? [])
    .slice(0, 4)
    .reduce<TechnologyRelatedStackItem[]>((accumulator, relatedId) => {
      const relatedItem = TECHNOLOGY_ITEM_MAP[relatedId];

      if (!relatedItem) {
        return accumulator;
      }

      accumulator.push({
        id: `${item.id}-stack-${relatedItem.id}`,
        name: relatedItem.shortName ?? relatedItem.name,
        iconSrc: relatedItem.logoSrc ?? undefined,
        tone: clusterMeta.tone,
        label: clusterMeta.shortFilterLabel,
        description: `${relatedItem.name} aparece como parte do ecossistema que normalmente acompanha ${item.name} em cenários de arquitetura, integração e entrega.`,
      });

      return accumulator;
    }, []);
}

function buildEvidenceGallery(
  item: TechnologyItem,
): readonly TechnologyEvidenceGalleryItem[] {
  const galleryItems = item.gallery ?? [];

  if (!galleryItems.length) {
    return [
      {
        id: `${item.id}-evidence-architecture`,
        title: `${item.name} em arquitetura aplicada`,
        description: `Exemplo editorial para posicionar ${item.name} dentro do fluxo técnico, mostrando onde ele entra na solução e como se conecta ao restante da stack.`,
        meta: "Architecture View",
      },
      {
        id: `${item.id}-evidence-delivery`,
        title: `${item.name} em fluxo de entrega`,
        description: `Cartão visual para comunicar a presença da tecnologia em pipelines, produção, produto e evolução contínua.`,
        meta: "Delivery View",
      },
      {
        id: `${item.id}-evidence-ecosystem`,
        title: `${item.name} no ecossistema relacionado`,
        description: `Bloco visual pensado para logo, screenshot, diagrama ou interface que reforce senioridade e repertório sobre ${item.name}.`,
        meta: "Ecosystem View",
      },
    ];
  }

  return galleryItems.slice(0, 3).map((asset, index) => ({
    id: asset.id,
    title: `${item.name} — evidência ${String(index + 1).padStart(2, "0")}`,
    description:
      index === 0
        ? `Leitura visual da tecnologia ${item.name} aplicada em contexto real de arquitetura e entrega.`
        : `Registro visual complementar para reforçar repertório, ecossistema e profundidade sobre ${item.name}.`,
    imageSrc: asset.src,
    meta:
      index === 0
        ? "Architecture View"
        : index === 1
          ? "Delivery View"
          : "Ecosystem View",
  }));
}

function mapTechnologyItemToCatalogItem(
  item: TechnologyItem,
): TechnologyCatalogItem {
  const clusterId = mapCategoryToClusterId(item.categoryId);
  const clusterMeta = CLUSTER_META[clusterId];
  const levelLabel = resolveLevelLabel(item.years);
  const confidenceLabel = resolveConfidenceLabel(item.years);
  const deliveryLabel = resolveDeliveryLabel(item.years);
  const displayName = item.label ?? item.name;
  const logoSrc = item.logoSrc ?? undefined;

  return {
    id: item.id,
    name: displayName,
    years: item.years,
    description:
      item.description ??
      item.summary ??
      `${displayName} aparece aqui como capacidade aplicada dentro do eixo ${clusterMeta.title.toLowerCase()}.`,
    clusterId,
    sourceCategoryId: item.categoryId,
    featured: item.featured,
    priority: item.priority,
    categoryLabel: clusterMeta.title,
    levelLabel,
    logoSrc,
    iconSrc: logoSrc,
    tone: clusterMeta.tone,
    accentRgb: clusterMeta.accentRgb,
    badges: buildBadges(item),
    relatedIcons: buildRelatedIcons(item),
    eyebrow: clusterMeta.eyebrow,
    subtitle:
      item.summary ??
      `${displayName} aparece aqui como uma capacidade aplicada dentro do eixo ${clusterMeta.title.toLowerCase()}, com foco em profundidade técnica, consistência de uso e contexto real de entrega.`,
    levelDescription: `${formatYears(item.years)} de atuação somados a cenários de entrega, manutenção, evolução e integração com o restante da stack.`,
    heroImageSrc: item.heroAsset?.src,
    heroCaptionTitle: `${displayName} dentro de ${clusterMeta.title}`,
    heroCaptionText:
      item.heroAsset?.alt ??
      "Leitura editorial da tecnologia com experiência, profundidade, ecossistema relacionado e organização visual por domínio.",
    highlights: buildHighlights(item, clusterMeta),
    relatedStack: buildRelatedStack(item, clusterMeta),
    evidenceGallery: buildEvidenceGallery(item),
    metrics: [
      {
        id: `${item.id}-metric-experience`,
        label: "Experiência",
        value: formatYears(item.years),
      },
      {
        id: `${item.id}-metric-level`,
        label: "Nível",
        value: levelLabel,
      },
      {
        id: `${item.id}-metric-delivery`,
        label: "Entrega",
        value: deliveryLabel,
      },
      {
        id: `${item.id}-metric-cluster`,
        label: "Cluster",
        value: clusterMeta.shortFilterLabel,
      },
    ],
    deliveryLabel,
    confidenceLabel,
  };
}

function compareCatalogItems(
  left: TechnologyCatalogItem,
  right: TechnologyCatalogItem,
): number {
  const featuredDiff =
    Number(Boolean(right.featured)) - Number(Boolean(left.featured));

  if (featuredDiff !== 0) {
    return featuredDiff;
  }

  const rightPriority =
    typeof right.priority === "number" && Number.isFinite(right.priority)
      ? right.priority
      : -1;
  const leftPriority =
    typeof left.priority === "number" && Number.isFinite(left.priority)
      ? left.priority
      : -1;

  if (rightPriority !== leftPriority) {
    return rightPriority - leftPriority;
  }

  const rightYears =
    typeof right.years === "number" && Number.isFinite(right.years)
      ? right.years
      : -1;
  const leftYears =
    typeof left.years === "number" && Number.isFinite(left.years)
      ? left.years
      : -1;

  if (rightYears !== leftYears) {
    return rightYears - leftYears;
  }

  return left.name.localeCompare(right.name);
}

const TECHNOLOGY_CATALOG: readonly TechnologyCatalogItem[] = [...TECHNOLOGY_ITEMS]
  .map(mapTechnologyItemToCatalogItem)
  .filter((item) => !TECHNOLOGY_ITEM_MAP[item.id]?.hidden)
  .sort(compareCatalogItems);

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

      if (!clusterItems.length) {
        return clusters;
      }

      clusters.push({
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
      });

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
