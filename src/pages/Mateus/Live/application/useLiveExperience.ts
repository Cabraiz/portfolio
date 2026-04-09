// src/pages/Mateus/Live/application/useLiveExperience.ts

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useLiveMetrics } from "./useLiveMetrics";
import { useLiveProjectSpotlight } from "./useLiveProjectSpotlight";
import { LIVE_DEFAULT_SCENE_CONFIG, LIVE_PROJECT_STATUS_LABELS } from "../domain/live.constants";
import {
  buildLiveProjectFilterCounts,
  isLiveProjectVisible,
  mapLiveProjectStatusToLifecycleFilter,
  matchesLiveProjectLifecycleFilter,
  matchesLiveProjectSizeFilter,
} from "../domain/live.helpers";
import { resolveGlobeTarget } from "../domain/live.scene";
import {
  DEFAULT_POINTER,
  getSceneHint,
  getSceneMetaLabel,
  getSceneTitle,
  mapMetricToStatus,
  toNodeCountLabel,
  type PointerSnapshot,
} from "../domain/live.scene";
import type {
  LiveMetricId,
  LiveProjectLifecycleFilter,
  LiveProjectSizeFilter,
  LiveProjectStatus,
} from "../domain/live.types";

export function useLiveExperience() {
  const metricsState = useLiveMetrics();
  const density = LIVE_DEFAULT_SCENE_CONFIG.density;

  const [selectedMetricId, setSelectedMetricId] = useState<LiveMetricId | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] =
    useState<LiveProjectStatus | null>(null);
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LiveProjectLifecycleFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<LiveProjectSizeFilter>("all");
  const [pointer, setPointer] = useState<PointerSnapshot>(DEFAULT_POINTER);

  useEffect(() => {
    if (selectedMetricId !== null) {
      return;
    }

    const firstHeroMetric = metricsState.heroMetrics[0];

    if (firstHeroMetric) {
      setSelectedMetricId(firstHeroMetric.id);
    }
  }, [metricsState.heroMetrics, selectedMetricId]);

  const selectedLifecycleFilter = useMemo<LiveProjectLifecycleFilter>(() => {
    if (selectedStatus) {
      return mapLiveProjectStatusToLifecycleFilter(selectedStatus);
    }

    return lifecycleFilter;
  }, [lifecycleFilter, selectedStatus]);

  const projectFilterCounts = useMemo(() => {
    return buildLiveProjectFilterCounts(metricsState.projects);
  }, [metricsState.projects]);

  const filteredProjects = useMemo(() => {
    return metricsState.projects.filter((project) => {
      if (!isLiveProjectVisible(project)) {
        return false;
      }

      if (!matchesLiveProjectSizeFilter(project, sizeFilter)) {
        return false;
      }

      if (selectedStatus !== null) {
        return project.status === selectedStatus;
      }

      return matchesLiveProjectLifecycleFilter(project, lifecycleFilter);
    });
  }, [lifecycleFilter, metricsState.projects, selectedStatus, sizeFilter]);

  const spotlight = useLiveProjectSpotlight({
    projects: filteredProjects,
    autoSelectFirstProject: true,
    featuredLimit: LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes,
  });

  const selectedMetric = useMemo(() => {
    if (!selectedMetricId) {
      return metricsState.heroMetrics[0] ?? metricsState.snapshots[0] ?? null;
    }

    return metricsState.getSnapshotById(selectedMetricId);
  }, [metricsState, selectedMetricId]);

  const pulseSize = Math.round(102);
  const pulseX = `${30 + pointer.normalizedX * 40}%`;
  const pulseY = `${24 + pointer.normalizedY * 36}%`;

  const sceneTitle = useMemo(() => {
    return getSceneTitle({
      selectedStatus,
      lifecycleFilter: selectedLifecycleFilter,
      sizeFilter,
    });
  }, [selectedLifecycleFilter, selectedStatus, sizeFilter]);

  const sceneHint = useMemo(() => {
    return getSceneHint({
      selectedStatus,
      lifecycleFilter: selectedLifecycleFilter,
      sizeFilter,
      selectedMetricLabel: selectedMetric?.label ?? null,
    });
  }, [selectedLifecycleFilter, selectedMetric?.label, selectedStatus, sizeFilter]);

  const sceneMetaLabel = useMemo(() => {
    return getSceneMetaLabel({
      selectedStatus,
      lifecycleFilter: selectedLifecycleFilter,
      sizeFilter,
    });
  }, [selectedLifecycleFilter, selectedStatus, sizeFilter]);

  const sceneHudStyle = useMemo<CSSProperties>(() => {
    return {
      ["--live-scene-pointer-x" as const]: `${Math.round(
        pointer.normalizedX * 100
      )}%`,
      ["--live-scene-pointer-y" as const]: `${Math.round(
        pointer.normalizedY * 100
      )}%`,
    } as CSSProperties;
  }, [pointer.normalizedX, pointer.normalizedY]);

  const spotlightProject = spotlight.spotlightProject;
  const spotlightTags = spotlightProject?.tags.slice(0, 3) ?? [];

  const globeTarget = useMemo(() => {
    return resolveGlobeTarget({
      selectedStatus,
      fallbackMetricId: selectedMetricId,
      spotlightStatus: spotlightProject?.status ?? null,
    });
  }, [selectedMetricId, selectedStatus, spotlightProject?.status]);

  const globeTitle = useMemo(() => {
    if (spotlightProject) {
      return spotlightProject.name;
    }

    if (selectedStatus) {
      return `Foco • ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}`;
    }

    return "Presença global";
  }, [selectedStatus, spotlightProject]);

  const globeSubtitle = useMemo(() => {
    if (spotlightProject) {
      return `${LIVE_PROJECT_STATUS_LABELS[spotlightProject.status]} · ${spotlightProject.clientLabel}`;
    }

    if (selectedMetric) {
      return `Leitura guiada por ${selectedMetric.label.toLowerCase()}.`;
    }

    return "Globo vivo para apontar o país em foco no radar.";
  }, [selectedMetric, spotlightProject]);

  const handleMetricSelect = (metricId: LiveMetricId) => {
    const nextStatus = mapMetricToStatus(metricId);

    setSelectedMetricId(metricId);
    setSelectedStatus(nextStatus);
    setLifecycleFilter(
      nextStatus ? mapLiveProjectStatusToLifecycleFilter(nextStatus) : "all"
    );
  };

  const handleLifecycleFilterChange = (
    filter: LiveProjectLifecycleFilter
  ) => {
    setSelectedStatus(null);
    setLifecycleFilter(filter);
  };

  const handleSizeFilterChange = (filter: LiveProjectSizeFilter) => {
    setSizeFilter(filter);
  };

  const clearFilters = () => {
    setSelectedStatus(null);
    setLifecycleFilter("all");
    setSizeFilter("all");
  };

  const resetPointer = () => {
    setPointer(DEFAULT_POINTER);
  };

  const hasResults = metricsState.projects.length > 0;
  const hasActiveFilters =
    selectedStatus !== null ||
    lifecycleFilter !== "all" ||
    sizeFilter !== "all";

  const visibleNodeCountLabel = toNodeCountLabel(spotlight.visibleProjects.length);

  return {
    metricsState,
    density,

    hasResults,
    hasActiveFilters,

    pointer,
    setPointer,
    resetPointer,

    selectedMetric,
    selectedMetricId,
    selectedStatus,
    lifecycleFilter,
    selectedLifecycleFilter,
    sizeFilter,

    filteredProjects,
    projectFilterCounts,

    spotlight,
    spotlightProject,
    spotlightTags,
    visibleNodeCountLabel,

    pulse: {
      size: pulseSize,
      x: pulseX,
      y: pulseY,
    },

    scene: {
      title: sceneTitle,
      hint: sceneHint,
      metaLabel: sceneMetaLabel,
      hudStyle: sceneHudStyle,
    },

    globe: {
      target: globeTarget,
      title: globeTitle,
      subtitle: globeSubtitle,
    },

    actions: {
      handleMetricSelect,
      handleLifecycleFilterChange,
      handleSizeFilterChange,
      clearFilters,
      setSelectedStatus,
      setSelectedMetricId,
      setLifecycleFilter,
      setSizeFilter,
    },
  };
}

export type UseLiveExperienceResult = ReturnType<typeof useLiveExperience>;

export default useLiveExperience;
