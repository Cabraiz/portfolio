// src/pages/Mateus/Technologies/domain/technologies.helpers.ts

import {
  TECHNOLOGY_CATEGORIES,
  TECHNOLOGY_FLAGSHIP_THRESHOLD_YEARS,
  TECHNOLOGY_HIGHLIGHT_THRESHOLD_YEARS,
  TECHNOLOGY_SENIOR_THRESHOLD_YEARS,
} from "./technologies.constants";
import type {
  TechnologyCategory,
  TechnologyCategoryFilter,
  TechnologyCategoryId,
  TechnologyItem,
  TechnologyProficiencyTone,
  TechnologiesFiltersState,
  TechnologySortMode,
} from "./technologies.types";

function normalizeStringValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function normalizeTechnologyText(value: string): string {
  return normalizeStringValue(value);
}

export function getTechnologyYears(item: TechnologyItem): number {
  return item.years ?? 0;
}

export function formatTechnologyYears(
  years: number | null | undefined,
  fallback = "—",
): string {
  if (typeof years !== "number" || Number.isNaN(years) || years < 0) {
    return fallback;
  }

  return `${years} ano${years === 1 ? "" : "s"}`;
}

export function getTechnologySearchText(item: TechnologyItem): string {
  return normalizeTechnologyText(
    [
      item.name,
      item.label ?? "",
      item.shortName ?? "",
      item.categoryId,
      item.description ?? "",
      item.summary ?? "",
      ...(item.aliases ?? []),
    ].join(" "),
  );
}

export function matchesTechnologyQuery(
  item: TechnologyItem,
  rawQuery: string,
): boolean {
  const normalizedQuery = normalizeTechnologyText(rawQuery);

  if (!normalizedQuery) {
    return true;
  }

  return getTechnologySearchText(item).includes(normalizedQuery);
}

export function resolveTechnologyCategoryById(
  categoryId: TechnologyCategoryId,
): TechnologyCategory | null {
  return (
    TECHNOLOGY_CATEGORIES.find((category) => category.id === categoryId) ?? null
  );
}

export function groupTechnologiesByCategory(
  items: readonly TechnologyItem[],
): Readonly<Record<TechnologyCategoryId, readonly TechnologyItem[]>> {
  const initialGroups = TECHNOLOGY_CATEGORIES.reduce(
    (accumulator, category) => {
      accumulator[category.id] = [];
      return accumulator;
    },
    {} as Record<TechnologyCategoryId, TechnologyItem[]>,
  );

  for (const item of items) {
    initialGroups[item.categoryId].push(item);
  }

  return initialGroups;
}

export function getVisibleTechnologies(
  items: readonly TechnologyItem[],
): readonly TechnologyItem[] {
  return items.filter((item) => !item.hidden);
}

export function getTechnologyProficiencyTone(
  years: number | null | undefined,
): TechnologyProficiencyTone {
  const safeYears =
    typeof years === "number" && Number.isFinite(years) ? years : 0;

  if (safeYears >= TECHNOLOGY_FLAGSHIP_THRESHOLD_YEARS) {
    return "flagship";
  }

  if (safeYears >= TECHNOLOGY_SENIOR_THRESHOLD_YEARS) {
    return "advanced";
  }

  if (safeYears >= TECHNOLOGY_HIGHLIGHT_THRESHOLD_YEARS) {
    return "strong";
  }

  if (safeYears >= 3) {
    return "solid";
  }

  return "growing";
}

export function getTechnologyRelatedItems(
  item: TechnologyItem | null | undefined,
  items: readonly TechnologyItem[],
): readonly TechnologyItem[] {
  if (!item?.relatedIds?.length) {
    return [];
  }

  const relatedIdSet = new Set(item.relatedIds);

  return items.filter((candidate) => relatedIdSet.has(candidate.id));
}

export function isTechnologyCategoryMatch(
  item: TechnologyItem,
  activeCategoryId: TechnologyCategoryFilter,
): boolean {
  if (activeCategoryId === "all") {
    return true;
  }

  return item.categoryId === activeCategoryId;
}

export function isTechnologyFilterMatch(
  item: TechnologyItem,
  filters: TechnologiesFiltersState,
): boolean {
  if (!isTechnologyCategoryMatch(item, filters.activeCategoryId)) {
    return false;
  }

  if (getTechnologyYears(item) < filters.minimumYears) {
    return false;
  }

  if (filters.featuredOnly && !item.featured) {
    return false;
  }

  if (!matchesTechnologyQuery(item, filters.query)) {
    return false;
  }

  return true;
}

export function compareTechnologyByNameAsc(
  left: TechnologyItem,
  right: TechnologyItem,
): number {
  return left.name.localeCompare(right.name, "pt-BR", {
    sensitivity: "base",
    numeric: true,
  });
}

export function compareTechnologyByYearsDesc(
  left: TechnologyItem,
  right: TechnologyItem,
): number {
  const yearsDiff = getTechnologyYears(right) - getTechnologyYears(left);

  if (yearsDiff !== 0) {
    return yearsDiff;
  }

  const priorityDiff = (right.priority ?? 0) - (left.priority ?? 0);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return compareTechnologyByNameAsc(left, right);
}

export function compareTechnologyByYearsAsc(
  left: TechnologyItem,
  right: TechnologyItem,
): number {
  const yearsDiff = getTechnologyYears(left) - getTechnologyYears(right);

  if (yearsDiff !== 0) {
    return yearsDiff;
  }

  return compareTechnologyByNameAsc(left, right);
}

export function compareTechnologyFeaturedFirst(
  left: TechnologyItem,
  right: TechnologyItem,
): number {
  const featuredDiff =
    Number(Boolean(right.featured)) - Number(Boolean(left.featured));

  if (featuredDiff !== 0) {
    return featuredDiff;
  }

  return compareTechnologyByYearsDesc(left, right);
}

export function sortTechnologies(
  items: readonly TechnologyItem[],
  sortMode: TechnologySortMode,
): TechnologyItem[] {
  const nextItems = [...items];

  switch (sortMode) {
    case "years-desc":
      return nextItems.sort(compareTechnologyByYearsDesc);
    case "years-asc":
      return nextItems.sort(compareTechnologyByYearsAsc);
    case "name-asc":
      return nextItems.sort(compareTechnologyByNameAsc);
    case "featured":
    default:
      return nextItems.sort(compareTechnologyFeaturedFirst);
  }
}

export function filterAndSortTechnologies(
  items: readonly TechnologyItem[],
  filters: TechnologiesFiltersState,
): readonly TechnologyItem[] {
  return sortTechnologies(
    getVisibleTechnologies(items).filter((item) =>
      isTechnologyFilterMatch(item, filters),
    ),
    filters.sortMode,
  );
}

export function getTechnologyAvailableCategoryIds(
  items: readonly TechnologyItem[],
): readonly TechnologyCategoryId[] {
  const categoryIds = new Set<TechnologyCategoryId>();

  for (const item of items) {
    if (item.hidden) {
      continue;
    }

    categoryIds.add(item.categoryId);
  }

  return TECHNOLOGY_CATEGORIES
    .map((category) => category.id)
    .filter((categoryId) => categoryIds.has(categoryId));
}
