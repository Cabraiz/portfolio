// src/pages/Mateus/Live/application/useLiveProjectSpotlight.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getLiveProjectStatusLabel,
  groupLiveProjectsByStatus,
  isLiveProjectVisible,
  pickFeaturedLiveProjects,
  sortLiveProjectsByPriority,
} from "../domain/live.helpers";
import type {
  LiveProjectRecord,
  LiveStatusBucket,
} from "../domain/live.types";
import { LIVE_PROJECTS } from "../data/live.metrics";

type UseLiveProjectSpotlightParams = Readonly<{
  projects?: readonly LiveProjectRecord[];
  initialActiveProjectId?: string | null;
  autoSelectFirstProject?: boolean;
  featuredLimit?: number;
  maxRelatedProjects?: number;
}>;

type UseLiveProjectSpotlightResult = Readonly<{
  projects: readonly LiveProjectRecord[];
  visibleProjects: readonly LiveProjectRecord[];
  featuredProjects: readonly LiveProjectRecord[];
  statusBuckets: readonly LiveStatusBucket[];
  activeProjectId: string | null;
  hoveredProjectId: string | null;
  spotlightProjectId: string | null;
  activeProject: LiveProjectRecord | null;
  hoveredProject: LiveProjectRecord | null;
  spotlightProject: LiveProjectRecord | null;
  relatedProjects: readonly LiveProjectRecord[];
  projectNarrative: string;
  spotlightTitle: string;
  selectProject: (projectId: string | null) => void;
  hoverProject: (projectId: string | null) => void;
  clearSelection: () => void;
  clearHover: () => void;
  clearSpotlight: () => void;
  selectNextProject: () => void;
  selectPreviousProject: () => void;
  isProjectActive: (projectId: string) => boolean;
  isProjectHovered: (projectId: string) => boolean;
  isProjectSpotlighted: (projectId: string) => boolean;
}>;

function getProjectById(
  projects: readonly LiveProjectRecord[],
  projectId: string | null,
): LiveProjectRecord | null {
  if (!projectId) {
    return null;
  }

  return projects.find((project) => project.id === projectId) ?? null;
}

function computeProjectAffinity(
  current: LiveProjectRecord,
  candidate: LiveProjectRecord,
): number {
  const sharedTags = current.tags.filter((tag) => candidate.tags.includes(tag)).length;
  const sharedStack = current.stack.filter((item) => candidate.stack.includes(item)).length;
  const sameStatus = current.status === candidate.status ? 2 : 0;
  const sameComplexity = current.complexity === candidate.complexity ? 1 : 0;
  const featuredBoost = candidate.featured ? 1 : 0;

  return sharedTags * 3 + sharedStack * 2 + sameStatus + sameComplexity + featuredBoost;
}

export function useLiveProjectSpotlight({
  projects = LIVE_PROJECTS,
  initialActiveProjectId = null,
  autoSelectFirstProject = true,
  featuredLimit = 4,
  maxRelatedProjects = 3,
}: UseLiveProjectSpotlightParams = {}): UseLiveProjectSpotlightResult {
  const visibleProjects = useMemo(() => {
    return sortLiveProjectsByPriority(projects).filter(isLiveProjectVisible);
  }, [projects]);

  const featuredProjects = useMemo(() => {
    return pickFeaturedLiveProjects(visibleProjects, featuredLimit);
  }, [featuredLimit, visibleProjects]);

  const statusBuckets = useMemo(() => {
    return groupLiveProjectsByStatus(visibleProjects);
  }, [visibleProjects]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    initialActiveProjectId,
  );
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const visibleProjectIds = useMemo(() => {
    return new Set(visibleProjects.map((project) => project.id));
  }, [visibleProjects]);

  const resolvedActiveProjectId = useMemo(() => {
    if (activeProjectId && visibleProjectIds.has(activeProjectId)) {
      return activeProjectId;
    }

    if (!autoSelectFirstProject) {
      return null;
    }

    return featuredProjects[0]?.id ?? visibleProjects[0]?.id ?? null;
  }, [
    activeProjectId,
    autoSelectFirstProject,
    featuredProjects,
    visibleProjectIds,
    visibleProjects,
  ]);

  useEffect(() => {
    const hasInvalidHover =
      hoveredProjectId !== null && !visibleProjectIds.has(hoveredProjectId);

    if (hasInvalidHover) {
      setHoveredProjectId(null);
    }
  }, [hoveredProjectId, visibleProjectIds]);

  useEffect(() => {
    if (resolvedActiveProjectId === activeProjectId) {
      return;
    }

    setActiveProjectId(resolvedActiveProjectId);
  }, [activeProjectId, resolvedActiveProjectId]);

  const activeProject = useMemo(() => {
    return getProjectById(visibleProjects, activeProjectId);
  }, [activeProjectId, visibleProjects]);

  const hoveredProject = useMemo(() => {
    return getProjectById(visibleProjects, hoveredProjectId);
  }, [hoveredProjectId, visibleProjects]);

  const spotlightProject = hoveredProject ?? activeProject;
  const spotlightProjectId = spotlightProject?.id ?? null;

  const relatedProjects = useMemo(() => {
    if (!spotlightProject) {
      return [];
    }

    return visibleProjects
      .filter((project) => project.id !== spotlightProject.id)
      .map((project) => ({
        project,
        score: computeProjectAffinity(spotlightProject, project),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return right.project.healthScore - left.project.healthScore;
      })
      .slice(0, maxRelatedProjects)
      .map((entry) => entry.project);
  }, [maxRelatedProjects, spotlightProject, visibleProjects]);

  const projectNarrative = useMemo(() => {
    if (!spotlightProject) {
      return "Passe o mouse ou selecione um projeto para abrir o spotlight.";
    }

    const client = spotlightProject.clientLabel;
    const status = getLiveProjectStatusLabel(spotlightProject.status);
    const years =
      spotlightProject.endYear && spotlightProject.endYear >= spotlightProject.startYear
        ? `${spotlightProject.startYear}–${spotlightProject.endYear}`
        : `${spotlightProject.startYear}–Atual`;

    return `${spotlightProject.name} · ${client} · ${status} · ${years}`;
  }, [spotlightProject]);

  const spotlightTitle = useMemo(() => {
    if (!spotlightProject) {
      return "Nenhum projeto em spotlight";
    }

    return spotlightProject.name;
  }, [spotlightProject]);

  const selectProject = useCallback((projectId: string | null) => {
    setActiveProjectId(projectId);
  }, []);

  const hoverProject = useCallback((projectId: string | null) => {
    setHoveredProjectId(projectId);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveProjectId(null);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredProjectId(null);
  }, []);

  const clearSpotlight = useCallback(() => {
    setHoveredProjectId(null);
    setActiveProjectId(null);
  }, []);

  const selectNextProject = useCallback(() => {
    if (visibleProjects.length === 0) {
      return;
    }

    const currentIndex = visibleProjects.findIndex(
      (project) => project.id === (activeProjectId ?? visibleProjects[0]?.id),
    );

    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + 1) % visibleProjects.length
        : 0;

    setActiveProjectId(visibleProjects[nextIndex]?.id ?? null);
  }, [activeProjectId, visibleProjects]);

  const selectPreviousProject = useCallback(() => {
    if (visibleProjects.length === 0) {
      return;
    }

    const currentIndex = visibleProjects.findIndex(
      (project) => project.id === (activeProjectId ?? visibleProjects[0]?.id),
    );

    const previousIndex =
      currentIndex >= 0
        ? (currentIndex - 1 + visibleProjects.length) % visibleProjects.length
        : 0;

    setActiveProjectId(visibleProjects[previousIndex]?.id ?? null);
  }, [activeProjectId, visibleProjects]);

  const isProjectActive = useCallback(
    (projectId: string) => activeProjectId === projectId,
    [activeProjectId],
  );

  const isProjectHovered = useCallback(
    (projectId: string) => hoveredProjectId === projectId,
    [hoveredProjectId],
  );

  const isProjectSpotlighted = useCallback(
    (projectId: string) => spotlightProjectId === projectId,
    [spotlightProjectId],
  );

  return {
    projects,
    visibleProjects,
    featuredProjects,
    statusBuckets,
    activeProjectId,
    hoveredProjectId,
    spotlightProjectId,
    activeProject,
    hoveredProject,
    spotlightProject,
    relatedProjects,
    projectNarrative,
    spotlightTitle,
    selectProject,
    hoverProject,
    clearSelection,
    clearHover,
    clearSpotlight,
    selectNextProject,
    selectPreviousProject,
    isProjectActive,
    isProjectHovered,
    isProjectSpotlighted,
  };
}
