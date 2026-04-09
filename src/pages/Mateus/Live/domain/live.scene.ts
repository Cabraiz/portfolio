// src/pages/Mateus/Live/domain/live.scene.ts

import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_INTERACTION_LABELS,
  LIVE_PROJECT_LIFECYCLE_FILTER_LABELS,
  LIVE_PROJECT_SIZE_FILTER_LABELS,
  LIVE_PROJECT_STATUS_LABELS,
} from "./live.constants";
import type {
  LiveMetricId,
  LiveProjectLifecycleFilter,
  LiveProjectSizeFilter,
  LiveProjectStatus,
} from "./live.types";
import { LIVE_GLOBE_TARGETS } from "./live.globe";
import type { LiveWorldGlobePoint } from "../ui/chrome/LiveWorldGlobe";

export type PointerSnapshot = Readonly<{
  clientX: number;
  clientY: number;
  normalizedX: number;
  normalizedY: number;
  centeredX: number;
  centeredY: number;
  distance: number;
}>;

export const DEFAULT_POINTER: PointerSnapshot = {
  clientX: 0,
  clientY: 0,
  normalizedX: 0.5,
  normalizedY: 0.5,
  centeredX: 0,
  centeredY: 0,
  distance: 0,
};

export function mapMetricToStatus(
  metricId: LiveMetricId | null
): LiveProjectStatus | null {
  switch (metricId) {
    case "projects-active":
    case "automations":
      return "active";

    case "projects-monitoring":
      return "monitoring";

    case "projects-delivered":
    case "deliveries-shipped":
      return "delivered";

    default:
      return null;
  }
}

export function getSceneTitle(
  options: Readonly<{
    selectedStatus: LiveProjectStatus | null;
    lifecycleFilter: LiveProjectLifecycleFilter;
    sizeFilter: LiveProjectSizeFilter;
  }>
): string {
  const { selectedStatus, lifecycleFilter, sizeFilter } = options;

  if (selectedStatus) {
    return `Radar • ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}`;
  }

  const activeLabels: string[] = [];

  if (lifecycleFilter !== "all") {
    activeLabels.push(LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter]);
  }

  if (sizeFilter !== "all") {
    activeLabels.push(LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter]);
  }

  if (activeLabels.length === 0) {
    return "Radar de projetos";
  }

  return `Radar • ${activeLabels.join(" · ")}`;
}

export function getSceneHint(
  options: Readonly<{
    selectedStatus: LiveProjectStatus | null;
    lifecycleFilter: LiveProjectLifecycleFilter;
    sizeFilter: LiveProjectSizeFilter;
    selectedMetricLabel: string | null;
  }>
): string {
  const {
    selectedStatus,
    lifecycleFilter,
    sizeFilter,
    selectedMetricLabel,
  } = options;

  const activeSlices: string[] = [];

  if (selectedStatus) {
    activeSlices.push(LIVE_PROJECT_STATUS_LABELS[selectedStatus]);
  } else if (lifecycleFilter !== "all") {
    activeSlices.push(LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter]);
  }

  if (sizeFilter !== "all") {
    activeSlices.push(LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter]);
  }

  if (activeSlices.length > 0 && selectedMetricLabel) {
    return `Recorte ativo: ${activeSlices.join(" · ")}. O spotlight acompanha ${selectedMetricLabel.toLowerCase()}.`;
  }

  if (activeSlices.length > 0) {
    return `Recorte ativo: ${activeSlices.join(" · ")}. Passe o mouse pelos nós para abrir o spotlight.`;
  }

  if (selectedMetricLabel) {
    return `Métrica em foco: ${selectedMetricLabel}. Passe o mouse pelos nós e compare placar com radar.`;
  }

  return "Passe o mouse pelos nós para abrir o spotlight e deixar o radar vivo.";
}

export function getSceneMetaLabel(
  options: Readonly<{
    selectedStatus: LiveProjectStatus | null;
    lifecycleFilter: LiveProjectLifecycleFilter;
    sizeFilter: LiveProjectSizeFilter;
  }>
): string {
  const { selectedStatus, lifecycleFilter, sizeFilter } = options;

  if (selectedStatus) {
    return LIVE_PROJECT_STATUS_LABELS[selectedStatus];
  }

  if (sizeFilter !== "all") {
    return LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter];
  }

  if (lifecycleFilter !== "all") {
    return LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter];
  }

  return LIVE_INTERACTION_LABELS[LIVE_DEFAULT_SCENE_CONFIG.interactionMode];
}

export function toNodeCountLabel(count: number): string {
  return `${count} ${count === 1 ? "nó" : "nós"}`;
}

export function resolveGlobeTarget(
  options: Readonly<{
    selectedStatus: LiveProjectStatus | null;
    fallbackMetricId: LiveMetricId | null;
    spotlightStatus: LiveProjectStatus | null;
  }>
): LiveWorldGlobePoint {
  const { selectedStatus, fallbackMetricId, spotlightStatus } = options;

  if (spotlightStatus) {
    return LIVE_GLOBE_TARGETS[spotlightStatus];
  }

  if (selectedStatus) {
    return LIVE_GLOBE_TARGETS[selectedStatus];
  }

  const metricStatus = mapMetricToStatus(fallbackMetricId);

  if (metricStatus) {
    return LIVE_GLOBE_TARGETS[metricStatus];
  }

  return LIVE_GLOBE_TARGETS.active;
}
