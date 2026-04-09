// src/pages/Mateus/Live/domain/live.types.ts

export type LiveMetricId =
  | "projects-total"
  | "projects-delivered"
  | "projects-active"
  | "projects-monitoring"
  | "deliveries-shipped"
  | "automations"
  | "years-building";

export type LiveHeroCounterId =
  | "projects-delivered"
  | "projects-active";

export type LiveMetricDisplayMode = "integer" | "decimal" | "compact";

export type LiveMetricTone = "neutral" | "info" | "success" | "warning";

export type LiveMetricEmphasis = "hero" | "primary" | "secondary";

export type LiveMetricTrendDirection = "up" | "steady" | "pulse";

export type LiveProjectStatus =
  | "active"
  | "monitoring"
  | "delivered"
  | "incubating";

export type LiveProjectComplexity = "low" | "medium" | "high";

export type LiveProjectLifecycleFilter =
  | "all"
  | "ongoing"
  | "delivered";

export type LiveProjectSizeFilter =
  | "all"
  | LiveProjectComplexity;

export type LiveProjectFilterCountKey =
  | LiveProjectLifecycleFilter
  | LiveProjectSizeFilter;

export type LiveProjectFilterCounts = Readonly<
  Partial<Record<LiveProjectFilterCountKey, number>>
>;

export type LiveInteractionMode =
  | "hover"
  | "drag"
  | "magnetic"
  | "spotlight";

export type LiveSceneDensity = "calm" | "balanced" | "dense";

export type LiveMetricSimulationConfig = Readonly<{
  enabled: boolean;
  tickMs: number;
  stepPerTick: number;
  jitter: number;
}>;

export type LiveMetricDefinition = Readonly<{
  id: LiveMetricId;
  label: string;
  shortLabel: string;
  eyebrow?: string;
  description: string;
  baseValue: number;
  minValue?: number;
  maxValue?: number | null;
  precision?: number;
  prefix?: string;
  suffix?: string;
  unitLabel?: string;
  displayMode?: LiveMetricDisplayMode;
  tone?: LiveMetricTone;
  emphasis?: LiveMetricEmphasis;
  trendDirection?: LiveMetricTrendDirection;
  accentToken?: string;
  badge?: string;
  featured?: boolean;
  interactive?: boolean;
  interactiveHint?: string;
  ariaLabel?: string;
  simulation?: LiveMetricSimulationConfig;
  sourceProjectStatuses?: readonly LiveProjectStatus[];
}>;

export type LiveMetricSnapshot = Readonly<{
  id: LiveMetricId;
  label: string;
  shortLabel: string;
  description: string;
  value: number;
  formattedValue: string;
  prefix?: string;
  suffix?: string;
  unitLabel?: string;
  tone: LiveMetricTone;
  emphasis: LiveMetricEmphasis;
  trendDirection: LiveMetricTrendDirection;
  accentToken?: string;
  badge?: string;
  interactive: boolean;
  ariaLabel: string;
}>;

export type LiveProjectRecord = Readonly<{
  id: string;
  name: string;
  clientLabel: string;
  summary: string;
  status: LiveProjectStatus;
  complexity: LiveProjectComplexity;
  startYear: number;
  endYear?: number | null;
  healthScore: number;
  deliveryCount: number;
  featured?: boolean;
  visible?: boolean;
  tags: readonly string[];
  stack: readonly string[];
  impactLabel?: string;
}>;

export type LiveProjectAggregate = Readonly<{
  totalProjects: number;
  deliveredProjects: number;
  activeProjects: number;
  monitoringProjects: number;
  incubatingProjects: number;
  ongoingProjects: number;
  totalDeliveries: number;
  averageHealthScore: number;
}>;

export type LiveStatusBucket = Readonly<{
  status: LiveProjectStatus;
  label: string;
  count: number;
  projects: readonly LiveProjectRecord[];
}>;

export type LiveSectionSceneConfig = Readonly<{
  density: LiveSceneDensity;
  interactionMode: LiveInteractionMode;
  maxVisibleNodes: number;
  parallaxStrength: number;
  pointerInfluenceRadius: number;
  pulseIntervalMs: number;
}>;

export type LiveHeroCounterSnapshot = Readonly<{
  id: LiveHeroCounterId;
  label: string;
  shortLabel: string;
  value: number;
  formattedValue: string;
  tone: LiveMetricTone;
}>;

export type LiveMetricCollection = readonly LiveMetricDefinition[];

export type LiveProjectCollection = readonly LiveProjectRecord[];
