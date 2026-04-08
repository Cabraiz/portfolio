// src/pages/Mateus/Live/application/useLiveMetrics.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  LIVE_DEFAULT_COUNTER_TICK_MS,
  LIVE_HERO_COUNTER_IDS,
  LIVE_HERO_METRIC_IDS,
  LIVE_SECONDARY_METRIC_IDS,
} from "../domain/live.constants";
import {
  buildLiveMetricSnapshot,
  groupLiveProjectsByStatus,
  simulateLiveMetricValue,
  summarizeLiveProjects,
} from "../domain/live.helpers";
import type {
  LiveHeroCounterId,
  LiveHeroCounterSnapshot,
  LiveMetricDefinition,
  LiveMetricId,
  LiveMetricSnapshot,
  LiveProjectAggregate,
  LiveProjectRecord,
  LiveStatusBucket,
} from "../domain/live.types";
import { LIVE_METRICS, LIVE_PROJECTS } from "../data/live.metrics";

type UseLiveMetricsParams = Readonly<{
  metrics?: readonly LiveMetricDefinition[];
  projects?: readonly LiveProjectRecord[];
  autoStart?: boolean;
  simulationIntervalMs?: number;
  initialElapsedMs?: number;
  respectSimulation?: boolean;
}>;

type UseLiveMetricsResult = Readonly<{
  metrics: readonly LiveMetricDefinition[];
  projects: readonly LiveProjectRecord[];
  summary: LiveProjectAggregate;
  statusBuckets: readonly LiveStatusBucket[];
  snapshots: readonly LiveMetricSnapshot[];
  heroMetrics: readonly LiveMetricSnapshot[];
  secondaryMetrics: readonly LiveMetricSnapshot[];
  heroCounterSnapshots: readonly LiveHeroCounterSnapshot[];
  elapsedMs: number;
  isRunning: boolean;
  hasAnimatedMetrics: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  reset: () => void;
  restart: () => void;
  setElapsedMs: (nextElapsedMs: number) => void;
  getSnapshotById: (metricId: LiveMetricId) => LiveMetricSnapshot | null;
  getHeroCounterById: (
    counterId: LiveHeroCounterId,
  ) => LiveHeroCounterSnapshot | null;
}>;

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function buildFallbackHeroCounter(
  counterId: LiveHeroCounterId,
  summary: LiveProjectAggregate,
): LiveHeroCounterSnapshot {
  switch (counterId) {
    case "projects-active":
      return {
        id: counterId,
        label: "Projetos em andamento",
        shortLabel: "Andamento",
        value: summary.activeProjects,
        formattedValue: String(summary.activeProjects),
        tone: "info",
      };

    case "projects-delivered":
    default:
      return {
        id: counterId,
        label: "Projetos feitos",
        shortLabel: "Feitos",
        value: summary.deliveredProjects,
        formattedValue: String(summary.deliveredProjects),
        tone: "success",
      };
  }
}

export function useLiveMetrics({
  metrics = LIVE_METRICS,
  projects = LIVE_PROJECTS,
  autoStart = true,
  simulationIntervalMs = LIVE_DEFAULT_COUNTER_TICK_MS,
  initialElapsedMs = 0,
  respectSimulation = true,
}: UseLiveMetricsParams = {}): UseLiveMetricsResult {
  const [elapsedMs, setElapsedMsState] = useState<number>(
    Math.max(0, Math.floor(initialElapsedMs)),
  );
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  useEffect(() => {
    if (
      !isRunning ||
      simulationIntervalMs <= 0 ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedMsState((current) => current + simulationIntervalMs);
    }, simulationIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, simulationIntervalMs]);

  const summary = useMemo<LiveProjectAggregate>(() => {
    return summarizeLiveProjects(projects);
  }, [projects]);

  const statusBuckets = useMemo<readonly LiveStatusBucket[]>(() => {
    return groupLiveProjectsByStatus(projects);
  }, [projects]);

  const hasAnimatedMetrics = useMemo(() => {
    return metrics.some((metric) => Boolean(metric.simulation?.enabled));
  }, [metrics]);

  const snapshots = useMemo<readonly LiveMetricSnapshot[]>(() => {
    return metrics.map((metric) => {
      const shouldSimulate =
        respectSimulation &&
        isRunning &&
        (metric.simulation?.enabled ?? false);

      const valueOverride = shouldSimulate
        ? simulateLiveMetricValue(metric, elapsedMs, { projects })
        : undefined;

      return buildLiveMetricSnapshot(metric, {
        projects,
        valueOverride,
      });
    });
  }, [elapsedMs, isRunning, metrics, projects, respectSimulation]);

  const snapshotsById = useMemo(() => {
    return new Map<LiveMetricId, LiveMetricSnapshot>(
      snapshots.map((metric) => [metric.id, metric]),
    );
  }, [snapshots]);

  const heroMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    return LIVE_HERO_METRIC_IDS.map((metricId) => snapshotsById.get(metricId)).filter(
      isDefined,
    );
  }, [snapshotsById]);

  const secondaryMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    return LIVE_SECONDARY_METRIC_IDS.map((metricId) =>
      snapshotsById.get(metricId),
    ).filter(isDefined);
  }, [snapshotsById]);

  const heroCounterSnapshots = useMemo<readonly LiveHeroCounterSnapshot[]>(() => {
    return LIVE_HERO_COUNTER_IDS.map((counterId) => {
      const snapshot = snapshotsById.get(counterId);

      if (!snapshot) {
        return buildFallbackHeroCounter(counterId, summary);
      }

      return {
        id: counterId,
        label: snapshot.label,
        shortLabel: snapshot.shortLabel,
        value: snapshot.value,
        formattedValue: snapshot.formattedValue,
        tone: snapshot.tone,
      };
    });
  }, [snapshotsById, summary]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    setIsRunning((current) => !current);
  }, []);

  const reset = useCallback(() => {
    setElapsedMsState(0);
  }, []);

  const restart = useCallback(() => {
    setElapsedMsState(0);
    setIsRunning(true);
  }, []);

  const setElapsedMs = useCallback((nextElapsedMs: number) => {
    setElapsedMsState(Math.max(0, Math.floor(nextElapsedMs)));
  }, []);

  const getSnapshotById = useCallback(
    (metricId: LiveMetricId): LiveMetricSnapshot | null => {
      return snapshotsById.get(metricId) ?? null;
    },
    [snapshotsById],
  );

  const getHeroCounterById = useCallback(
    (counterId: LiveHeroCounterId): LiveHeroCounterSnapshot | null => {
      return (
        heroCounterSnapshots.find((counter) => counter.id === counterId) ?? null
      );
    },
    [heroCounterSnapshots],
  );

  return {
    metrics,
    projects,
    summary,
    statusBuckets,
    snapshots,
    heroMetrics,
    secondaryMetrics,
    heroCounterSnapshots,
    elapsedMs,
    isRunning,
    hasAnimatedMetrics,
    start,
    stop,
    toggle,
    reset,
    restart,
    setElapsedMs,
    getSnapshotById,
    getHeroCounterById,
  };
}
