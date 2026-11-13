// Filtros e busca usados pelos seletores do roadmap

import {
  ROADMAP_DEFAULT_FILTERS,
  ROADMAP_MIN_SEARCH_LENGTH,
} from "./roadmap.constants";
import type { RoadMapFilterState, RoadMapNode } from "./roadmap.types";

function normalizeText(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function uniqueIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

function safeIncludes<T extends string>(
  activeItems: readonly T[],
  current: T,
): boolean {
  return activeItems.length === 0 || activeItems.includes(current);
}

function buildSearchableText(node: RoadMapNode): string {
  return [
    node.label,
    node.shortLabel,
    node.description,
    ...(node.tags ?? []),
    ...(node.aliases ?? []),
    node.details?.summary,
    node.details?.headline,
    node.details?.whyItMatters,
    ...(node.details?.projectContexts ?? []),
    ...(node.details?.responsibilities ?? []),
    ...(node.details?.strengths ?? []),
    ...(node.details?.relatedStacks ?? []),
    ...(node.details?.evidencePoints ?? []),
    ...(node.details?.whenToUse ?? []),
    ...(node.details?.whenNotToUse ?? []),
    ...(node.details?.useCases ?? []),
    ...(node.details?.cautions ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesSearch(node: RoadMapNode, query: string): boolean {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < ROADMAP_MIN_SEARCH_LENGTH) {
    return true;
  }

  const searchableText = normalizeText(buildSearchableText(node));
  return searchableText.includes(normalizedQuery);
}

function matchesVisibilityFlags(
  node: RoadMapNode,
  filters: RoadMapFilterState,
): boolean {
  if (!filters.showHidden && node.isHidden) {
    return false;
  }

  if (!filters.showDeprecated && node.isDeprecated) {
    return false;
  }

  return true;
}

function matchesSignals(node: RoadMapNode, filters: RoadMapFilterState): boolean {
  if (filters.activeSignals.length === 0) {
    return true;
  }

  const nodeSignals = node.marketSignals ?? [];
  return filters.activeSignals.some((signal) => nodeSignals.includes(signal));
}

function matchesNodeFilters(
  node: RoadMapNode,
  filters: RoadMapFilterState,
): boolean {
  return (
    matchesVisibilityFlags(node, filters) &&
    safeIncludes(filters.activeCategories, node.category) &&
    safeIncludes(filters.activeDemands, node.demand) &&
    safeIncludes(filters.activeKinds, node.kind) &&
    matchesSignals(node, filters) &&
    matchesSearch(node, filters.query)
  );
}

function mergeFilters(
  filters: Partial<RoadMapFilterState> = {},
): RoadMapFilterState {
  return {
    ...ROADMAP_DEFAULT_FILTERS,
    ...filters,
  };
}

export { matchesNodeFilters, mergeFilters, uniqueIds };
