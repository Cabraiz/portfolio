import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  PortfolioActiveProjectState,
  PortfolioProject,
  PortfolioProjectId,
  PortfolioProjectSelection,
} from "../types";

type UsePortfolioActiveItemParams = Readonly<{
  projects: readonly PortfolioProject[];
  defaultProjectId?: PortfolioProjectId;
}>;

type UsePortfolioActiveItemResult = Readonly<{
  activeIndex: number;
  activeProject: PortfolioProject;
  previousProject: PortfolioProject | null;
  nextProject: PortfolioProject | null;
  hasPrevious: boolean;
  hasNext: boolean;
  activeProjectId: PortfolioProjectId;
  setActiveIndex: (index: number) => void;
  setActiveProjectById: (projectId: PortfolioProjectId) => void;
  selectProject: (selection: PortfolioProjectSelection) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  isProjectActive: (projectId: PortfolioProjectId) => boolean;
  getProjectIndexById: (projectId: PortfolioProjectId) => number;
  getProjectById: (projectId: PortfolioProjectId) => PortfolioProject | undefined;
}>;

function wrapIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return ((index % total) + total) % total;
}

function resolveInitialIndex(
  projects: readonly PortfolioProject[],
  defaultProjectId?: PortfolioProjectId,
): number {
  if (projects.length === 0) {
    return 0;
  }

  if (!defaultProjectId) {
    return 0;
  }

  const foundIndex = projects.findIndex(
    (project) => project.id === defaultProjectId,
  );

  return foundIndex >= 0 ? foundIndex : 0;
}

export default function usePortfolioActiveItem({
  projects,
  defaultProjectId,
}: UsePortfolioActiveItemParams): UsePortfolioActiveItemResult {
  const [activeIndex, setActiveIndexState] = useState<number>(() =>
    resolveInitialIndex(projects, defaultProjectId),
  );

  useEffect(() => {
    setActiveIndexState((currentIndex) => {
      if (projects.length === 0) {
        return 0;
      }

      const nextResolvedIndex =
        defaultProjectId != null
          ? resolveInitialIndex(projects, defaultProjectId)
          : wrapIndex(currentIndex, projects.length);

      return nextResolvedIndex;
    });
  }, [defaultProjectId, projects]);

  const projectLookup = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );

  const safeActiveIndex = wrapIndex(activeIndex, projects.length);
  const activeProject = projects[safeActiveIndex];
  const hasCircularNavigation = projects.length > 1;

  const previousProject = hasCircularNavigation
    ? projects[wrapIndex(safeActiveIndex - 1, projects.length)]
    : null;

  const nextProject = hasCircularNavigation
    ? projects[wrapIndex(safeActiveIndex + 1, projects.length)]
    : null;

  const state = useMemo<PortfolioActiveProjectState>(() => {
    if (!activeProject) {
      throw new Error(
        "usePortfolioActiveItem requires at least one project in the projects array.",
      );
    }

    return {
      activeIndex: safeActiveIndex,
      activeProject,
      previousProject,
      nextProject,
    };
  }, [activeProject, nextProject, previousProject, safeActiveIndex]);

  const setActiveIndex = useCallback(
    (index: number) => {
      setActiveIndexState(wrapIndex(index, projects.length));
    },
    [projects.length],
  );

  const getProjectIndexById = useCallback(
    (projectId: PortfolioProjectId): number =>
      projects.findIndex((project) => project.id === projectId),
    [projects],
  );

  const getProjectById = useCallback(
    (projectId: PortfolioProjectId): PortfolioProject | undefined =>
      projectLookup.get(projectId),
    [projectLookup],
  );

  const setActiveProjectById = useCallback(
    (projectId: PortfolioProjectId) => {
      const nextIndex = getProjectIndexById(projectId);

      if (nextIndex >= 0) {
        setActiveIndexState(nextIndex);
      }
    },
    [getProjectIndexById],
  );

  const selectProject = useCallback(
    (selection: PortfolioProjectSelection) => {
      if (selection.projectId) {
        const resolvedIndex = getProjectIndexById(selection.projectId);

        if (resolvedIndex >= 0) {
          setActiveIndexState(resolvedIndex);
          return;
        }
      }

      setActiveIndexState(wrapIndex(selection.index, projects.length));
    },
    [getProjectIndexById, projects.length],
  );

  const goToPrevious = useCallback(() => {
    if (projects.length <= 1) {
      return;
    }

    setActiveIndexState((currentIndex) =>
      wrapIndex(currentIndex - 1, projects.length),
    );
  }, [projects.length]);

  const goToNext = useCallback(() => {
    if (projects.length <= 1) {
      return;
    }

    setActiveIndexState((currentIndex) =>
      wrapIndex(currentIndex + 1, projects.length),
    );
  }, [projects.length]);

  const isProjectActive = useCallback(
    (projectId: PortfolioProjectId): boolean => activeProject?.id === projectId,
    [activeProject],
  );

  if (!activeProject) {
    throw new Error(
      "usePortfolioActiveItem could not resolve an active project. Check the projects array.",
    );
  }

  return {
    activeIndex: state.activeIndex,
    activeProject: state.activeProject,
    previousProject: state.previousProject,
    nextProject: state.nextProject,
    hasPrevious: hasCircularNavigation,
    hasNext: hasCircularNavigation,
    activeProjectId: state.activeProject.id,
    setActiveIndex,
    setActiveProjectById,
    selectProject,
    goToPrevious,
    goToNext,
    isProjectActive,
    getProjectIndexById,
    getProjectById,
  };
}
