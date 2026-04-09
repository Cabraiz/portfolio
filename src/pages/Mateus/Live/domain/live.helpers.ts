// src/pages/Mateus/Live/domain/live.helpers.ts

import {
  LIVE_DEFAULT_METRIC_PRECISION,
  LIVE_DEFAULT_SIMULATION,
  LIVE_HEALTH_SCORE_GOOD_THRESHOLD,
  LIVE_HEALTH_SCORE_WARNING_THRESHOLD,
  LIVE_LOCALE,
  LIVE_MAX_FEATURED_PROJECTS,
  LIVE_METRIC_DEFAULT_ACCENTS,
  LIVE_ONGOING_PROJECT_STATUSES,
  LIVE_PROJECT_COMPLEXITY_LABELS,
  LIVE_PROJECT_LIFECYCLE_FILTER_LABELS,
  LIVE_PROJECT_SIZE_FILTER_LABELS,
  LIVE_PROJECT_STATUS_LABELS,
  LIVE_PROJECT_STATUS_ORDER,
} from "./live.constants";
import type {
  LiveMetricDefinition,
  LiveMetricSnapshot,
  LiveMetricTone,
  LiveProjectAggregate,
  LiveProjectComplexity,
  LiveProjectFilterCounts,
  LiveProjectLifecycleFilter,
  LiveProjectRecord,
  LiveProjectSizeFilter,
  LiveProjectStatus,
  LiveStatusBucket,
} from "./live.types";

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function clampLiveMetricValue(
  value: number,
  metric: Pick<LiveMetricDefinition, "minValue" | "maxValue">,
): number {
  const min = metric.minValue ?? 0;
  const max = metric.maxValue ?? Number.POSITIVE_INFINITY;

  return clamp(value, min, max);
}

export function isLiveProjectVisible(project: LiveProjectRecord): boolean {
  return project.visible !== false;
}

export function isLiveProjectOngoing(project: LiveProjectRecord): boolean {
  return LIVE_ONGOING_PROJECT_STATUSES.includes(project.status);
}

export function mapLiveProjectStatusToLifecycleFilter(
  status: LiveProjectStatus,
): LiveProjectLifecycleFilter {
  if (status === "delivered") {
    return "delivered";
  }

  return "ongoing";
}

export function getLiveProjectStatusLabel(status: LiveProjectStatus): string {
  return LIVE_PROJECT_STATUS_LABELS[status];
}

export function getLiveProjectLifecycleFilterLabel(
  filter: LiveProjectLifecycleFilter,
): string {
  return LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[filter];
}

export function getLiveProjectComplexityLabel(
  complexity: LiveProjectComplexity,
): string {
  return LIVE_PROJECT_COMPLEXITY_LABELS[complexity];
}

export function getLiveProjectSizeFilterLabel(
  filter: LiveProjectSizeFilter,
): string {
  return LIVE_PROJECT_SIZE_FILTER_LABELS[filter];
}

export function matchesLiveProjectLifecycleFilter(
  project: LiveProjectRecord,
  filter: LiveProjectLifecycleFilter,
): boolean {
  if (!isLiveProjectVisible(project)) {
    return false;
  }

  if (filter === "all") {
    return true;
  }

  if (filter === "ongoing") {
    return isLiveProjectOngoing(project);
  }

  return project.status === "delivered";
}

export function matchesLiveProjectSizeFilter(
  project: LiveProjectRecord,
  filter: LiveProjectSizeFilter,
): boolean {
  if (!isLiveProjectVisible(project)) {
    return false;
  }

  if (filter === "all") {
    return true;
  }

  return project.complexity === filter;
}

export function buildLiveProjectFilterCounts(
  projects: readonly LiveProjectRecord[],
): LiveProjectFilterCounts {
  const visibleProjects = projects.filter(isLiveProjectVisible);

  return {
    all: visibleProjects.length,
    ongoing: visibleProjects.filter(isLiveProjectOngoing).length,
    delivered: visibleProjects.filter(
      (project) => project.status === "delivered",
    ).length,
    low: visibleProjects.filter((project) => project.complexity === "low").length,
    medium: visibleProjects.filter((project) => project.complexity === "medium")
      .length,
    high: visibleProjects.filter((project) => project.complexity === "high").length,
  };
}

export function getLiveProjectHealthTone(healthScore: number): LiveMetricTone {
  if (healthScore >= LIVE_HEALTH_SCORE_GOOD_THRESHOLD) {
    return "success";
  }

  if (healthScore >= LIVE_HEALTH_SCORE_WARNING_THRESHOLD) {
    return "info";
  }

  return "warning";
}

export function summarizeLiveProjects(
  projects: readonly LiveProjectRecord[],
): LiveProjectAggregate {
  const visibleProjects = projects.filter(isLiveProjectVisible);

  const totalProjects = visibleProjects.length;
  const deliveredProjects = visibleProjects.filter(
    (project) => project.status === "delivered",
  ).length;
  const activeProjects = visibleProjects.filter(
    (project) => project.status === "active",
  ).length;
  const monitoringProjects = visibleProjects.filter(
    (project) => project.status === "monitoring",
  ).length;
  const incubatingProjects = visibleProjects.filter(
    (project) => project.status === "incubating",
  ).length;
  const ongoingProjects = visibleProjects.filter(isLiveProjectOngoing).length;
  const totalDeliveries = visibleProjects.reduce(
    (sum, project) => sum + Math.max(project.deliveryCount, 0),
    0,
  );
  const averageHealthScore =
    totalProjects > 0
      ? visibleProjects.reduce((sum, project) => sum + project.healthScore, 0) /
        totalProjects
      : 0;

  return {
    totalProjects,
    deliveredProjects,
    activeProjects,
    monitoringProjects,
    incubatingProjects,
    ongoingProjects,
    totalDeliveries,
    averageHealthScore,
  };
}

export function resolveLiveMetricBaseValue(
  metric: LiveMetricDefinition,
  summary?: LiveProjectAggregate,
): number {
  if (!summary) {
    return metric.baseValue;
  }

  switch (metric.id) {
    case "projects-total":
      return summary.totalProjects;
    case "projects-delivered":
      return summary.deliveredProjects;
    case "projects-active":
      return summary.activeProjects;
    case "projects-monitoring":
      return summary.monitoringProjects;
    case "deliveries-shipped":
      return summary.totalDeliveries;
    default:
      return metric.baseValue;
  }
}

export function formatLiveMetricValue(
  value: number,
  metric: Pick<
    LiveMetricDefinition,
    "displayMode" | "precision" | "prefix" | "suffix"
  >,
): string {
  const precision = metric.precision ?? LIVE_DEFAULT_METRIC_PRECISION;
  const displayMode = metric.displayMode ?? "integer";

  let formattedNumber = "";

  if (displayMode === "compact") {
    formattedNumber = new Intl.NumberFormat(LIVE_LOCALE, {
      notation: "compact",
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    }).format(value);
  } else {
    formattedNumber = new Intl.NumberFormat(LIVE_LOCALE, {
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    }).format(value);
  }

  return `${metric.prefix ?? ""}${formattedNumber}${metric.suffix ?? ""}`;
}

export function buildLiveMetricSnapshot(
  metric: LiveMetricDefinition,
  options?: Readonly<{
    projects?: readonly LiveProjectRecord[];
    valueOverride?: number;
  }>,
): LiveMetricSnapshot {
  const summary = options?.projects
    ? summarizeLiveProjects(options.projects)
    : undefined;

  const rawValue =
    options?.valueOverride ??
    resolveLiveMetricBaseValue(metric, summary);

  const clampedValue = clampLiveMetricValue(rawValue, metric);

  return {
    id: metric.id,
    label: metric.label,
    shortLabel: metric.shortLabel,
    description: metric.description,
    value: clampedValue,
    formattedValue: formatLiveMetricValue(clampedValue, metric),
    prefix: metric.prefix,
    suffix: metric.suffix,
    unitLabel: metric.unitLabel,
    tone: metric.tone ?? "neutral",
    emphasis: metric.emphasis ?? "secondary",
    trendDirection: metric.trendDirection ?? "steady",
    accentToken:
      metric.accentToken ??
      LIVE_METRIC_DEFAULT_ACCENTS[metric.tone ?? "neutral"],
    badge: metric.badge,
    interactive: metric.interactive ?? false,
    ariaLabel:
      metric.ariaLabel ??
      `${metric.label}: ${formatLiveMetricValue(clampedValue, metric)}`,
  };
}

export function buildLiveMetricSnapshots(
  metrics: readonly LiveMetricDefinition[],
  projects: readonly LiveProjectRecord[],
): readonly LiveMetricSnapshot[] {
  return metrics.map((metric) =>
    buildLiveMetricSnapshot(metric, {
      projects,
    }),
  );
}

export function simulateLiveMetricValue(
  metric: LiveMetricDefinition,
  elapsedMs: number,
  options?: Readonly<{
    projects?: readonly LiveProjectRecord[];
  }>,
): number {
  const summary = options?.projects
    ? summarizeLiveProjects(options.projects)
    : undefined;

  const baseValue = resolveLiveMetricBaseValue(metric, summary);
  const simulation = metric.simulation ?? LIVE_DEFAULT_SIMULATION;

  if (!simulation.enabled || simulation.tickMs <= 0 || simulation.stepPerTick <= 0) {
    return clampLiveMetricValue(baseValue, metric);
  }

  const completedTicks = Math.max(0, Math.floor(elapsedMs / simulation.tickMs));
  const wave = Math.sin(elapsedMs / simulation.tickMs);
  const jitterFactor = 1 + wave * simulation.jitter;
  const increment = completedTicks * simulation.stepPerTick * jitterFactor;

  return clampLiveMetricValue(baseValue + increment, metric);
}

export function groupLiveProjectsByStatus(
  projects: readonly LiveProjectRecord[],
): readonly LiveStatusBucket[] {
  const visibleProjects = projects.filter(isLiveProjectVisible);

  const statuses: readonly LiveProjectStatus[] = [
    "active",
    "monitoring",
    "incubating",
    "delivered",
  ];

  return statuses.map((status) => {
    const items = visibleProjects
      .filter((project) => project.status === status)
      .sort((left, right) => right.healthScore - left.healthScore);

    return {
      status,
      label: getLiveProjectStatusLabel(status),
      count: items.length,
      projects: items,
    };
  });
}

export function sortLiveProjectsByPriority(
  projects: readonly LiveProjectRecord[],
): LiveProjectRecord[] {
  return [...projects]
    .filter(isLiveProjectVisible)
    .sort((left, right) => {
      const featuredDiff =
        Number(Boolean(right.featured)) - Number(Boolean(left.featured));

      if (featuredDiff !== 0) {
        return featuredDiff;
      }

      const statusDiff =
        LIVE_PROJECT_STATUS_ORDER[left.status] -
        LIVE_PROJECT_STATUS_ORDER[right.status];

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const healthDiff = right.healthScore - left.healthScore;

      if (healthDiff !== 0) {
        return healthDiff;
      }

      return right.startYear - left.startYear;
    });
}

export function pickFeaturedLiveProjects(
  projects: readonly LiveProjectRecord[],
  limit = LIVE_MAX_FEATURED_PROJECTS,
): readonly LiveProjectRecord[] {
  const sortedProjects = sortLiveProjectsByPriority(projects);
  const explicitlyFeatured = sortedProjects.filter((project) => project.featured);

  if (explicitlyFeatured.length >= limit) {
    return explicitlyFeatured.slice(0, limit);
  }

  const remaining = sortedProjects.filter((project) => !project.featured);

  return [...explicitlyFeatured, ...remaining].slice(0, limit);
}

export function getLiveProjectStatusCount(
  projects: readonly LiveProjectRecord[],
  status: LiveProjectStatus,
): number {
  return projects.filter(
    (project) => isLiveProjectVisible(project) && project.status === status,
  ).length;
}

export function getLiveProjectNarrative(project: LiveProjectRecord): string {
  const yearsLabel =
    project.endYear && project.endYear >= project.startYear
      ? `${project.startYear}–${project.endYear}`
      : `${project.startYear}–Atual`;

  return `${project.name} · ${getLiveProjectStatusLabel(project.status)} · ${yearsLabel}`;
}
