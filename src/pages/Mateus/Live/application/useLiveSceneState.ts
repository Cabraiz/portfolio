// src/pages/Mateus/Live/application/useLiveMetrics.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import { LIVE_HERO_METRIC_IDS, LIVE_SECONDARY_METRIC_IDS } from "../domain/live.constants";
import {
  buildLiveMetricSnapshot,
  groupLiveProjectsByStatus,
  simulateLiveMetricValue,
  summarizeLiveProjects,
} from "../domain/live.helpers";
import type {
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
}>;

export function useLiveMetrics({
  metrics = LIVE_METRICS,
  projects = LIVE_PROJECTS,
  autoStart = true,
  simulationIntervalMs = 1200,
  initialElapsedMs = 0,
  respectSimulation = true,
}: UseLiveMetricsParams = {}): UseLiveMetricsResult {
  const [elapsedMs, setElapsedMsState] = useState<number>(initialElapsedMs);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  useEffect(() => {
    if (!isRunning || simulationIntervalMs <= 0 || typeof window === "undefined") {
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

  const heroMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    return snapshots.filter((metric) =>
      LIVE_HERO_METRIC_IDS.includes(metric.id as LiveMetricId),
    );
  }, [snapshots]);

  const secondaryMetrics = useMemo<readonly LiveMetricSnapshot[]>(() => {
    return snapshots.filter((metric) =>
      LIVE_SECONDARY_METRIC_IDS.includes(metric.id as LiveMetricId),
    );
  }, [snapshots]);

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
      return snapshots.find((metric) => metric.id === metricId) ?? null;
    },
    [snapshots],
  );

  return {
    metrics,
    projects,
    summary,
    statusBuckets,
    snapshots,
    heroMetrics,
    secondaryMetrics,
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
  };
}
