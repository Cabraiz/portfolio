import { useCallback, useMemo, useState } from "react";

import type { TechnologyItem } from "../domain/technologies.types";

export type TechnologySortMode =
  | "featured"
  | "years-desc"
  | "years-asc"
  | "name-asc";

export type TechnologyCategoryFilter = string | "all";

export type TechnologyFiltersState = Readonly<{
  query: string;
  activeCategoryId: TechnologyCategoryFilter;
  minimumYears: number;
  featuredOnly: boolean;
  sortMode: TechnologySortMode;
}>;

type UseTechnologiesFiltersParams = Readonly<{
  items: readonly TechnologyItem[];
  initialFilters?: Partial<TechnologyFiltersState>;
}>;

type UseTechnologiesFiltersResult = Readonly<{
  filters: TechnologyFiltersState;
  filteredItems: readonly TechnologyItem[];
  availableCategoryIds: readonly string[];
  totalItems: number;
  totalVisibleItems: number;
  hasActiveFilters: boolean;
  setQuery: (query: string) => void;
  setActiveCategoryId: (categoryId: TechnologyCategoryFilter) => void;
  setMinimumYears: (years: number) => void;
  setFeaturedOnly: (featuredOnly: boolean) => void;
  toggleFeaturedOnly: () => void;
  setSortMode: (sortMode: TechnologySortMode) => void;
  clearFilters: () => void;
}>;

const DEFAULT_FILTERS: TechnologyFiltersState = {
  query: "",
  activeCategoryId: "all",
  minimumYears: 0,
  featuredOnly: false,
  sortMode: "featured",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function getTechnologySearchText(item: TechnologyItem): string {
  return normalizeText(
    [
      item.name,
      item.label ?? "",
      item.categoryId,
      ...(item.aliases ?? []),
    ].join(" "),
  );
}

function getTechnologyYears(item: TechnologyItem): number {
  return item.years ?? 0;
}

function compareByNameAsc(a: TechnologyItem, b: TechnologyItem): number {
  return a.name.localeCompare(b.name, "pt-BR", {
    sensitivity: "base",
    numeric: true,
  });
}

function compareByYearsDesc(a: TechnologyItem, b: TechnologyItem): number {
  const byYears = getTechnologyYears(b) - getTechnologyYears(a);

  if (byYears !== 0) {
    return byYears;
  }

  const byPriority = (b.priority ?? 0) - (a.priority ?? 0);

  if (byPriority !== 0) {
    return byPriority;
  }

  return compareByNameAsc(a, b);
}

function compareByYearsAsc(a: TechnologyItem, b: TechnologyItem): number {
  const byYears = getTechnologyYears(a) - getTechnologyYears(b);

  if (byYears !== 0) {
    return byYears;
  }

  return compareByNameAsc(a, b);
}

function compareFeaturedFirst(a: TechnologyItem, b: TechnologyItem): number {
  const byFeatured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));

  if (byFeatured !== 0) {
    return byFeatured;
  }

  return compareByYearsDesc(a, b);
}

function sortItems(
  items: readonly TechnologyItem[],
  sortMode: TechnologySortMode,
): TechnologyItem[] {
  const nextItems = [...items];

  switch (sortMode) {
    case "years-desc":
      return nextItems.sort(compareByYearsDesc);
    case "years-asc":
      return nextItems.sort(compareByYearsAsc);
    case "name-asc":
      return nextItems.sort(compareByNameAsc);
    case "featured":
    default:
      return nextItems.sort(compareFeaturedFirst);
  }
}

export function useTechnologiesFilters({
  items,
  initialFilters,
}: UseTechnologiesFiltersParams): UseTechnologiesFiltersResult {
  const [filters, setFilters] = useState<TechnologyFiltersState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const visibleBaseItems = useMemo(
    () => items.filter((item) => !item.hidden),
    [items],
  );

  const availableCategoryIds = useMemo(
    () =>
      Array.from(new Set(visibleBaseItems.map((item) => item.categoryId))).sort(
        (a, b) =>
          a.localeCompare(b, "pt-BR", {
            sensitivity: "base",
            numeric: true,
          }),
      ),
    [visibleBaseItems],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(filters.query);

    const nextItems = visibleBaseItems.filter((item) => {
      if (
        filters.activeCategoryId !== "all" &&
        item.categoryId !== filters.activeCategoryId
      ) {
        return false;
      }

      if (getTechnologyYears(item) < filters.minimumYears) {
        return false;
      }

      if (filters.featuredOnly && !item.featured) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return getTechnologySearchText(item).includes(normalizedQuery);
    });

    return sortItems(nextItems, filters.sortMode);
  }, [filters, visibleBaseItems]);

  const hasActiveFilters = useMemo(
    () =>
      filters.query.trim().length > 0 ||
      filters.activeCategoryId !== DEFAULT_FILTERS.activeCategoryId ||
      filters.minimumYears !== DEFAULT_FILTERS.minimumYears ||
      filters.featuredOnly !== DEFAULT_FILTERS.featuredOnly ||
      filters.sortMode !== DEFAULT_FILTERS.sortMode,
    [filters],
  );

  const setQuery = useCallback((query: string) => {
    setFilters((current) => ({
      ...current,
      query,
    }));
  }, []);

  const setActiveCategoryId = useCallback(
    (activeCategoryId: TechnologyCategoryFilter) => {
      setFilters((current) => ({
        ...current,
        activeCategoryId,
      }));
    },
    [],
  );

  const setMinimumYears = useCallback((minimumYears: number) => {
    setFilters((current) => ({
      ...current,
      minimumYears: Math.max(0, Number.isFinite(minimumYears) ? minimumYears : 0),
    }));
  }, []);

  const setFeaturedOnly = useCallback((featuredOnly: boolean) => {
    setFilters((current) => ({
      ...current,
      featuredOnly,
    }));
  }, []);

  const toggleFeaturedOnly = useCallback(() => {
    setFilters((current) => ({
      ...current,
      featuredOnly: !current.featuredOnly,
    }));
  }, []);

  const setSortMode = useCallback((sortMode: TechnologySortMode) => {
    setFilters((current) => ({
      ...current,
      sortMode,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    filteredItems,
    availableCategoryIds,
    totalItems: items.length,
    totalVisibleItems: filteredItems.length,
    hasActiveFilters,
    setQuery,
    setActiveCategoryId,
    setMinimumYears,
    setFeaturedOnly,
    toggleFeaturedOnly,
    setSortMode,
    clearFilters,
  };
}
