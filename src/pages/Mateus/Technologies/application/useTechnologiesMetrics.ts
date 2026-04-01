import { useMemo } from "react";

import type { TechnologyItem } from "../domain/technologies.types";

type TechnologyMetricCard = Readonly<{
  id: string;
  label: string;
  value: string;
  helperText: string;
}>;

type TechnologyCategoryMetric = Readonly<{
  categoryId: string;
  count: number;
  totalYears: number;
  averageYears: number;
  highlightedCount: number;
}>;

type UseTechnologiesMetricsParams = Readonly<{
  items: readonly TechnologyItem[];
  visibleItems?: readonly TechnologyItem[];
  seniorThreshold?: number;
  highlightThreshold?: number;
}>;

type UseTechnologiesMetricsResult = Readonly<{
  totalItems: number;
  totalVisibleItems: number;
  totalCategories: number;
  totalYears: number;
  averageYears: number;
  maxYears: number;
  seniorCount: number;
  highlightedCount: number;
  categoryMetrics: readonly TechnologyCategoryMetric[];
  topTechnologies: readonly TechnologyItem[];
  metricCards: readonly TechnologyMetricCard[];
}>;

function getTechnologyYears(item: TechnologyItem): number {
  return item.years ?? 0;
}

function formatYears(value: number): string {
  if (value <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAverageYears(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function sortTopTechnologies(
  items: readonly TechnologyItem[],
): readonly TechnologyItem[] {
  return [...items].sort((a, b) => {
    const byYears = getTechnologyYears(b) - getTechnologyYears(a);

    if (byYears !== 0) {
      return byYears;
    }

    const byFeatured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));

    if (byFeatured !== 0) {
      return byFeatured;
    }

    const byPriority = (b.priority ?? 0) - (a.priority ?? 0);

    if (byPriority !== 0) {
      return byPriority;
    }

    return a.name.localeCompare(b.name, "pt-BR", {
      sensitivity: "base",
      numeric: true,
    });
  });
}

export function useTechnologiesMetrics({
  items,
  visibleItems,
  seniorThreshold = 8,
  highlightThreshold = 5,
}: UseTechnologiesMetricsParams): UseTechnologiesMetricsResult {
  return useMemo(() => {
    const safeItems = items.filter((item) => !item.hidden);
    const safeVisibleItems = (visibleItems ?? safeItems).filter(
      (item) => !item.hidden,
    );

    const totalItems = safeItems.length;
    const totalVisibleItems = safeVisibleItems.length;

    const totalYears = safeItems.reduce(
      (accumulator, item) => accumulator + getTechnologyYears(item),
      0,
    );

    const averageYears =
      totalItems > 0 ? totalYears / totalItems : 0;

    const maxYears = safeItems.reduce(
      (accumulator, item) => Math.max(accumulator, getTechnologyYears(item)),
      0,
    );

    const seniorCount = safeItems.filter(
      (item) => getTechnologyYears(item) >= seniorThreshold,
    ).length;

    const highlightedCount = safeItems.filter(
      (item) => getTechnologyYears(item) >= highlightThreshold,
    ).length;

    const categoryMap = new Map<string, TechnologyCategoryMetric>();

    for (const item of safeItems) {
      const categoryId = item.categoryId;
      const years = getTechnologyYears(item);

      const previous = categoryMap.get(categoryId);

      if (!previous) {
        categoryMap.set(categoryId, {
          categoryId,
          count: 1,
          totalYears: years,
          averageYears: years,
          highlightedCount: years >= highlightThreshold ? 1 : 0,
        });

        continue;
      }

      const nextCount = previous.count + 1;
      const nextTotalYears = previous.totalYears + years;
      const nextHighlightedCount =
        previous.highlightedCount + (years >= highlightThreshold ? 1 : 0);

      categoryMap.set(categoryId, {
        categoryId,
        count: nextCount,
        totalYears: nextTotalYears,
        averageYears: nextTotalYears / nextCount,
        highlightedCount: nextHighlightedCount,
      });
    }

    const categoryMetrics = [...categoryMap.values()].sort((a, b) => {
      const byCount = b.count - a.count;

      if (byCount !== 0) {
        return byCount;
      }

      const byTotalYears = b.totalYears - a.totalYears;

      if (byTotalYears !== 0) {
        return byTotalYears;
      }

      return a.categoryId.localeCompare(b.categoryId, "pt-BR", {
        sensitivity: "base",
      });
    });

    const totalCategories = categoryMetrics.length;

    const topTechnologies = sortTopTechnologies(safeItems).slice(0, 6);

    const metricCards: readonly TechnologyMetricCard[] = [
      {
        id: "visible-stack",
        label: "Tecnologias visíveis",
        value: formatYears(totalVisibleItems),
        helperText: `de ${formatYears(totalItems)} mapeadas`,
      },
      {
        id: "years-sum",
        label: "Anos acumulados",
        value: formatYears(totalYears),
        helperText: "somatório de experiência declarada",
      },
      {
        id: "average-years",
        label: "Média por stack",
        value: formatAverageYears(averageYears),
        helperText: "anos médios por tecnologia",
      },
      {
        id: "senior-stack",
        label: "Stacks maduras",
        value: formatYears(seniorCount),
        helperText: `${formatYears(seniorThreshold)}+ anos de prática`,
      },
    ];

    return {
      totalItems,
      totalVisibleItems,
      totalCategories,
      totalYears,
      averageYears,
      maxYears,
      seniorCount,
      highlightedCount,
      categoryMetrics,
      topTechnologies,
      metricCards,
    };
  }, [items, visibleItems, seniorThreshold, highlightThreshold]);
}
