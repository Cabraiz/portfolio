// Filtros, rótulos e resumo dos projetos do Live

import {
  LIVE_HEALTH_SCORE_GOOD_THRESHOLD,
  LIVE_HEALTH_SCORE_WARNING_THRESHOLD,
  LIVE_ONGOING_PROJECT_STATUSES,
  LIVE_PROJECT_COMPLEXITY_LABELS,
  LIVE_PROJECT_LIFECYCLE_FILTER_LABELS,
  LIVE_PROJECT_SIZE_FILTER_LABELS,
  LIVE_PROJECT_STATUS_LABELS,
} from "./live.constants";
import type {
  LiveMetricDefinition,
  LiveMetricTone,
  LiveProjectAggregate,
  LiveProjectComplexity,
  LiveProjectFilterCounts,
  LiveProjectLifecycleFilter,
  LiveProjectRecord,
  LiveProjectSizeFilter,
  LiveProjectStatus,
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
