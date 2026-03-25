import { useCallback, useMemo, useState } from "react";

import { ROADMAP_DEFAULT_FILTERS } from "../../domain/model/roadmap.constants";
import type {
  RoadMapCategoryId,
  RoadMapDemandLevel,
  RoadMapFilterState,
  RoadMapMarketSignal,
  RoadMapNodeKind,
  RoadMapRelationType,
} from "../../domain/model/roadmap.types";

type UseRoadMapFiltersParams = Readonly<{
  initialFilters?: Partial<RoadMapFilterState>;
}>;

type UseRoadMapFiltersResult = Readonly<{
  filters: RoadMapFilterState;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  setQuery: (query: string) => void;
  replaceFilters: (next: Partial<RoadMapFilterState>) => void;
  resetFilters: () => void;
  clearQuery: () => void;
  toggleCategory: (category: RoadMapCategoryId) => void;
  toggleDemand: (demand: RoadMapDemandLevel) => void;
  toggleKind: (kind: RoadMapNodeKind) => void;
  toggleSignal: (signal: RoadMapMarketSignal) => void;
  toggleRelationType: (relationType: RoadMapRelationType) => void;
  setShowDeprecated: (value: boolean) => void;
  setShowHidden: (value: boolean) => void;
}>;

function mergeFilters(
  initialFilters?: Partial<RoadMapFilterState>,
): RoadMapFilterState {
  return {
    ...ROADMAP_DEFAULT_FILTERS,
    ...initialFilters,
    activeCategories: initialFilters?.activeCategories ?? [],
    activeDemands: initialFilters?.activeDemands ?? [],
    activeKinds: initialFilters?.activeKinds ?? [],
    activeSignals: initialFilters?.activeSignals ?? [],
    activeRelationTypes: initialFilters?.activeRelationTypes ?? [],
  };
}

function toggleValue<T extends string>(
  currentValues: readonly T[],
  value: T,
): readonly T[] {
  return currentValues.includes(value)
    ? currentValues.filter((item) => item !== value)
    : [...currentValues, value];
}

function countActiveFilters(filters: RoadMapFilterState): number {
  let count = 0;

  if (filters.query.trim().length > 0) {
    count += 1;
  }

  count += filters.activeCategories.length;
  count += filters.activeDemands.length;
  count += filters.activeKinds.length;
  count += filters.activeSignals.length;
  count += filters.activeRelationTypes.length;

  if (filters.showDeprecated) {
    count += 1;
  }

  if (filters.showHidden) {
    count += 1;
  }

  return count;
}

export function useRoadMapFilters({
  initialFilters,
}: UseRoadMapFiltersParams = {}): UseRoadMapFiltersResult {
  const [filters, setFilters] = useState<RoadMapFilterState>(() =>
    mergeFilters(initialFilters),
  );

  const setQuery = useCallback((query: string) => {
    setFilters((current) => ({
      ...current,
      query,
    }));
  }, []);

  const clearQuery = useCallback(() => {
    setFilters((current) => ({
      ...current,
      query: "",
    }));
  }, []);

  const replaceFilters = useCallback((next: Partial<RoadMapFilterState>) => {
    setFilters((current) => ({
      ...current,
      ...next,
      activeCategories: next.activeCategories ?? current.activeCategories,
      activeDemands: next.activeDemands ?? current.activeDemands,
      activeKinds: next.activeKinds ?? current.activeKinds,
      activeSignals: next.activeSignals ?? current.activeSignals,
      activeRelationTypes:
        next.activeRelationTypes ?? current.activeRelationTypes,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(ROADMAP_DEFAULT_FILTERS);
  }, []);

  const toggleCategory = useCallback((category: RoadMapCategoryId) => {
    setFilters((current) => ({
      ...current,
      activeCategories: toggleValue(current.activeCategories, category),
    }));
  }, []);

  const toggleDemand = useCallback((demand: RoadMapDemandLevel) => {
    setFilters((current) => ({
      ...current,
      activeDemands: toggleValue(current.activeDemands, demand),
    }));
  }, []);

  const toggleKind = useCallback((kind: RoadMapNodeKind) => {
    setFilters((current) => ({
      ...current,
      activeKinds: toggleValue(current.activeKinds, kind),
    }));
  }, []);

  const toggleSignal = useCallback((signal: RoadMapMarketSignal) => {
    setFilters((current) => ({
      ...current,
      activeSignals: toggleValue(current.activeSignals, signal),
    }));
  }, []);

  const toggleRelationType = useCallback(
    (relationType: RoadMapRelationType) => {
      setFilters((current) => ({
        ...current,
        activeRelationTypes: toggleValue(
          current.activeRelationTypes,
          relationType,
        ),
      }));
    },
    [],
  );

  const setShowDeprecated = useCallback((value: boolean) => {
    setFilters((current) => ({
      ...current,
      showDeprecated: value,
    }));
  }, []);

  const setShowHidden = useCallback((value: boolean) => {
    setFilters((current) => ({
      ...current,
      showHidden: value,
    }));
  }, []);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setQuery,
    replaceFilters,
    resetFilters,
    clearQuery,
    toggleCategory,
    toggleDemand,
    toggleKind,
    toggleSignal,
    toggleRelationType,
    setShowDeprecated,
    setShowHidden,
  };
}
