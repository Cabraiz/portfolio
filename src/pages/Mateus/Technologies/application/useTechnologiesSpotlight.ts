import { useCallback, useEffect, useMemo, useState } from "react";

import type { TechnologyItem } from "../domain/technologies.types";

type UseTechnologiesSpotlightParams = Readonly<{
  items: readonly TechnologyItem[];
  initialActiveTechnologyId?: string | null;
  autoSelectFirstVisible?: boolean;
}>;

type UseTechnologiesSpotlightResult = Readonly<{
  activeTechnologyId: string | null;
  hoveredTechnologyId: string | null;
  activeTechnology: TechnologyItem | null;
  hoveredTechnology: TechnologyItem | null;
  relatedTechnologies: readonly TechnologyItem[];
  previousTechnology: TechnologyItem | null;
  nextTechnology: TechnologyItem | null;
  activeIndex: number;
  selectTechnology: (technologyId: string | null) => void;
  hoverTechnology: (technologyId: string | null) => void;
  selectNextTechnology: () => void;
  selectPreviousTechnology: () => void;
  clearSelection: () => void;
  clearHover: () => void;
  isTechnologyActive: (technologyId: string) => boolean;
  isTechnologyHovered: (technologyId: string) => boolean;
}>;

function getTechnologyById(
  items: readonly TechnologyItem[],
  technologyId: string | null,
): TechnologyItem | null {
  if (!technologyId) {
    return null;
  }

  return items.find((item) => item.id === technologyId) ?? null;
}

export function useTechnologiesSpotlight({
  items,
  initialActiveTechnologyId = null,
  autoSelectFirstVisible = true,
}: UseTechnologiesSpotlightParams): UseTechnologiesSpotlightResult {
  const [activeTechnologyId, setActiveTechnologyId] = useState<string | null>(
    initialActiveTechnologyId,
  );
  const [hoveredTechnologyId, setHoveredTechnologyId] = useState<string | null>(
    null,
  );

  const activeTechnology = useMemo(
    () => getTechnologyById(items, activeTechnologyId),
    [items, activeTechnologyId],
  );

  const hoveredTechnology = useMemo(
    () => getTechnologyById(items, hoveredTechnologyId),
    [items, hoveredTechnologyId],
  );

  const activeIndex = useMemo(() => {
    if (!activeTechnologyId) {
      return -1;
    }

    return items.findIndex((item) => item.id === activeTechnologyId);
  }, [items, activeTechnologyId]);

  const relatedTechnologies = useMemo(() => {
    if (!activeTechnology?.relatedIds?.length) {
      return [];
    }

    const relatedIds = new Set(activeTechnology.relatedIds);

    return items.filter((item) => relatedIds.has(item.id));
  }, [items, activeTechnology]);

  const previousTechnology = useMemo(() => {
    if (activeIndex <= 0) {
      return null;
    }

    return items[activeIndex - 1] ?? null;
  }, [items, activeIndex]);

  const nextTechnology = useMemo(() => {
    if (activeIndex < 0) {
      return null;
    }

    return items[activeIndex + 1] ?? null;
  }, [items, activeIndex]);

  useEffect(() => {
    if (items.length === 0) {
      if (activeTechnologyId !== null) {
        setActiveTechnologyId(null);
      }

      if (hoveredTechnologyId !== null) {
        setHoveredTechnologyId(null);
      }

      return;
    }

    const activeStillExists = activeTechnologyId
      ? items.some((item) => item.id === activeTechnologyId)
      : false;

    if (activeStillExists) {
      return;
    }

    if (autoSelectFirstVisible) {
      setActiveTechnologyId(items[0]?.id ?? null);
      return;
    }

    setActiveTechnologyId(null);
  }, [items, activeTechnologyId, hoveredTechnologyId, autoSelectFirstVisible]);

  useEffect(() => {
    if (!hoveredTechnologyId) {
      return;
    }

    const hoveredStillExists = items.some(
      (item) => item.id === hoveredTechnologyId,
    );

    if (!hoveredStillExists) {
      setHoveredTechnologyId(null);
    }
  }, [items, hoveredTechnologyId]);

  const selectTechnology = useCallback((technologyId: string | null) => {
    setActiveTechnologyId(technologyId);
  }, []);

  const hoverTechnology = useCallback((technologyId: string | null) => {
    setHoveredTechnologyId(technologyId);
  }, []);

  const selectNextTechnology = useCallback(() => {
    setActiveTechnologyId((currentId) => {
      if (items.length === 0) {
        return null;
      }

      const currentIndex = currentId
        ? items.findIndex((item) => item.id === currentId)
        : -1;

      if (currentIndex < 0) {
        return items[0]?.id ?? null;
      }

      return items[(currentIndex + 1) % items.length]?.id ?? null;
    });
  }, [items]);

  const selectPreviousTechnology = useCallback(() => {
    setActiveTechnologyId((currentId) => {
      if (items.length === 0) {
        return null;
      }

      const currentIndex = currentId
        ? items.findIndex((item) => item.id === currentId)
        : -1;

      if (currentIndex < 0) {
        return items[items.length - 1]?.id ?? null;
      }

      const previousIndex =
        currentIndex === 0 ? items.length - 1 : currentIndex - 1;

      return items[previousIndex]?.id ?? null;
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setActiveTechnologyId(null);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredTechnologyId(null);
  }, []);

  const isTechnologyActive = useCallback(
    (technologyId: string) => activeTechnologyId === technologyId,
    [activeTechnologyId],
  );

  const isTechnologyHovered = useCallback(
    (technologyId: string) => hoveredTechnologyId === technologyId,
    [hoveredTechnologyId],
  );

  return {
    activeTechnologyId,
    hoveredTechnologyId,
    activeTechnology,
    hoveredTechnology,
    relatedTechnologies,
    previousTechnology,
    nextTechnology,
    activeIndex,
    selectTechnology,
    hoverTechnology,
    selectNextTechnology,
    selectPreviousTechnology,
    clearSelection,
    clearHover,
    isTechnologyActive,
    isTechnologyHovered,
  };
}
