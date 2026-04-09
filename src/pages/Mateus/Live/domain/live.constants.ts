// src/pages/Mateus/Live/domain/live.constants.ts

import type {
  LiveHeroCounterId,
  LiveInteractionMode,
  LiveMetricEmphasis,
  LiveMetricId,
  LiveMetricSimulationConfig,
  LiveMetricTone,
  LiveProjectComplexity,
  LiveProjectLifecycleFilter,
  LiveProjectSizeFilter,
  LiveProjectStatus,
  LiveSceneDensity,
  LiveSectionSceneConfig,
} from "./live.types";

export const LIVE_SECTION_ID = "live" as const;

export const LIVE_LOCALE = "pt-BR" as const;

export const LIVE_MAX_FEATURED_PROJECTS = 4;
export const LIVE_MAX_VISIBLE_PROJECT_NODES = 8;

export const LIVE_DEFAULT_METRIC_PRECISION = 0;
export const LIVE_DEFAULT_COUNTER_TICK_MS = 1200;
export const LIVE_DEFAULT_COUNTER_STEP = 1;
export const LIVE_DEFAULT_COUNTER_JITTER = 0.18;

export const LIVE_DEFAULT_SIMULATION: LiveMetricSimulationConfig = {
  enabled: true,
  tickMs: LIVE_DEFAULT_COUNTER_TICK_MS,
  stepPerTick: LIVE_DEFAULT_COUNTER_STEP,
  jitter: LIVE_DEFAULT_COUNTER_JITTER,
};

export const LIVE_DEFAULT_SCENE_CONFIG: LiveSectionSceneConfig = {
  density: "balanced",
  interactionMode: "magnetic",
  maxVisibleNodes: LIVE_MAX_VISIBLE_PROJECT_NODES,
  parallaxStrength: 18,
  pointerInfluenceRadius: 180,
  pulseIntervalMs: 2800,
};

export const LIVE_SCENE_DENSITY_WEIGHTS: Readonly<
  Record<LiveSceneDensity, number>
> = {
  calm: 0.82,
  balanced: 1,
  dense: 1.2,
};

export const LIVE_SCENE_DENSITY_LABELS: Readonly<
  Record<LiveSceneDensity, string>
> = {
  calm: "Suave",
  balanced: "Equilibrado",
  dense: "Denso",
};

export const LIVE_INTERACTION_LABELS: Readonly<
  Record<LiveInteractionMode, string>
> = {
  hover: "Hover",
  drag: "Arraste",
  magnetic: "Campo magnético",
  spotlight: "Foco",
};

export const LIVE_PROJECT_STATUS_LABELS: Readonly<
  Record<LiveProjectStatus, string>
> = {
  active: "Em andamento",
  monitoring: "Monitoramento",
  delivered: "Concluído",
  incubating: "Exploração",
};

export const LIVE_PROJECT_STATUS_ORDER: Readonly<
  Record<LiveProjectStatus, number>
> = {
  active: 10,
  monitoring: 20,
  incubating: 30,
  delivered: 40,
};

export const LIVE_ONGOING_PROJECT_STATUSES: readonly LiveProjectStatus[] = [
  "active",
  "monitoring",
  "incubating",
] as const;

export const LIVE_PROJECT_LIFECYCLE_FILTER_LABELS: Readonly<
  Record<LiveProjectLifecycleFilter, string>
> = {
  all: "Todos",
  ongoing: "Em andamento",
  delivered: "Concluído",
};

export const LIVE_PROJECT_COMPLEXITY_LABELS: Readonly<
  Record<LiveProjectComplexity, string>
> = {
  low: "Pequeno",
  medium: "Médio",
  high: "Grande",
};

export const LIVE_PROJECT_SIZE_FILTER_LABELS: Readonly<
  Record<LiveProjectSizeFilter, string>
> = {
  all: "Todos os portes",
  low: "Projetos pequenos",
  medium: "Projetos médios",
  high: "Projetos grandes",
};

export const LIVE_METRIC_TONE_LABELS: Readonly<Record<LiveMetricTone, string>> =
  {
    neutral: "Estável",
    info: "Sinal ativo",
    success: "Entrega forte",
    warning: "Acompanhar",
  };

export const LIVE_METRIC_EMPHASIS_WEIGHTS: Readonly<
  Record<LiveMetricEmphasis, number>
> = {
  hero: 3,
  primary: 2,
  secondary: 1,
};

export const LIVE_HEALTH_SCORE_GOOD_THRESHOLD = 85;
export const LIVE_HEALTH_SCORE_WARNING_THRESHOLD = 70;

export const LIVE_METRIC_ORDER: readonly LiveMetricId[] = [
  "projects-total",
  "projects-delivered",
  "projects-active",
  "projects-monitoring",
  "deliveries-shipped",
  "automations",
  "years-building",
] as const;

export const LIVE_HERO_COUNTER_IDS: readonly LiveHeroCounterId[] = [
  "projects-delivered",
  "projects-active",
] as const;

export const LIVE_HERO_METRIC_IDS: readonly LiveMetricId[] = [
  "projects-delivered",
  "projects-active",
] as const;

export const LIVE_SECONDARY_METRIC_IDS: readonly LiveMetricId[] = [
  "projects-total",
  "projects-monitoring",
  "deliveries-shipped",
  "automations",
  "years-building",
] as const;

export const LIVE_METRIC_DEFAULT_ACCENTS: Readonly<
  Record<LiveMetricTone, string>
> = {
  neutral: "var(--live-accent-neutral, rgba(148, 163, 184, 0.88))",
  info: "var(--live-accent-info, rgba(96, 165, 250, 0.96))",
  success: "var(--live-accent-success, rgba(52, 211, 153, 0.96))",
  warning: "var(--live-accent-warning, rgba(251, 191, 36, 0.96))",
};

export const LIVE_HERO_TITLE =
  "Projetos feitos. Projetos em andamento.";

export const LIVE_HERO_DESCRIPTION =
  "Leitura curta do que já foi entregue e do que segue ativo agora.";

export const LIVE_EMPTY_PROJECTS_TITLE =
  "Nenhum projeto disponível para o radar ao vivo.";

export const LIVE_EMPTY_PROJECTS_DESCRIPTION =
  "Adicione projetos em andamento ou concluídos para alimentar os placares e os nós interativos.";
