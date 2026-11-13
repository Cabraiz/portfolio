// src/pages/Mateus/Live/domain/live.helpers.ts

import {
  LIVE_DEFAULT_METRIC_PRECISION,
  LIVE_DEFAULT_SIMULATION,
  LIVE_LOCALE,
  LIVE_MAX_FEATURED_PROJECTS,
  LIVE_METRIC_DEFAULT_ACCENTS,
  LIVE_PROJECT_STATUS_ORDER,
} from "./live.constants";
import type {
  LiveMetricDefinition,
  LiveMetricSnapshot,
  LiveProjectAggregate,
  LiveProjectRecord,
  LiveProjectStatus,
  LiveStatusBucket,
} from "./live.types";
import {
  clampLiveMetricValue,
  getLiveProjectStatusLabel,
  isLiveProjectVisible,
  summarizeLiveProjects,
} from "./live.helpers.projects";

export {
  buildLiveProjectFilterCounts,
  clampLiveMetricValue,
  getLiveProjectComplexityLabel,
  getLiveProjectHealthTone,
  getLiveProjectLifecycleFilterLabel,
  getLiveProjectSizeFilterLabel,
  getLiveProjectStatusLabel,
  isLiveProjectOngoing,
  isLiveProjectVisible,
  mapLiveProjectStatusToLifecycleFilter,
  matchesLiveProjectLifecycleFilter,
  matchesLiveProjectSizeFilter,
  summarizeLiveProjects,
} from "./live.helpers.projects";

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
