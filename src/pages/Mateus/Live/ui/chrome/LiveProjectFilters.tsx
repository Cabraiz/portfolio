// src/pages/Mateus/Live/ui/chrome/LiveProjectFilters.tsx

import { type CSSProperties } from "react";

import type { LiveProjectComplexity } from "../../domain/live.types";
import styles from "./LiveProjectFilters.module.css";

export type LiveProjectLifecycleFilter = "all" | "ongoing" | "delivered";
export type LiveProjectSizeFilter = "all" | LiveProjectComplexity;
export type LiveProjectFiltersCountKey =
  | LiveProjectLifecycleFilter
  | LiveProjectSizeFilter;

export type LiveProjectFiltersProps = Readonly<{
  className?: string;
  compact?: boolean;
  disabled?: boolean;

  lifecycleFilter: LiveProjectLifecycleFilter;
  sizeFilter: LiveProjectSizeFilter;

  onLifecycleFilterChange?: (filter: LiveProjectLifecycleFilter) => void;
  onSizeFilterChange?: (filter: LiveProjectSizeFilter) => void;

  counts?: Partial<Record<LiveProjectFiltersCountKey, number>>;

  showLifecycleAll?: boolean;
  showSizeAll?: boolean;
}>;

type FiltersCssVariables = CSSProperties;

type FilterOption<TValue extends string> = Readonly<{
  id: TValue;
  label: string;
  shortLabel?: string;
}>;

const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR");

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function formatCount(value: number | undefined): string | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return NUMBER_FORMATTER.format(Math.max(0, Math.round(value)));
}

export default function LiveProjectFilters({
  className,
  compact = false,
  disabled = false,
  lifecycleFilter,
  sizeFilter,
  onLifecycleFilterChange,
  onSizeFilterChange,
  counts,
  showLifecycleAll = true,
  showSizeAll = false,
}: LiveProjectFiltersProps) {
  const lifecycleOptions: readonly FilterOption<LiveProjectLifecycleFilter>[] = [
    ...(showLifecycleAll
      ? ([{ id: "all", label: "Todos" }] as const)
      : ([] as const)),
    { id: "ongoing", label: "Em andamento" },
    { id: "delivered", label: "Concluído" },
  ];

  const sizeOptions: readonly FilterOption<LiveProjectSizeFilter>[] = [
    ...(showSizeAll
      ? ([{ id: "all", label: "Todos os portes", shortLabel: "Todos" }] as const)
      : ([] as const)),
    { id: "low", label: "Projetos pequenos", shortLabel: "Pequenos" },
    { id: "medium", label: "Projetos médios", shortLabel: "Médios" },
    { id: "high", label: "Projetos grandes", shortLabel: "Grandes" },
  ];

  const style: FiltersCssVariables = {};

  return (
    <div
      className={joinClassNames(
        styles.root,
        compact && styles.rootCompact,
        className,
      )}
      style={style}
    >
      <div
        className={styles.group}
        role="group"
        aria-label="Filtros por andamento"
      >
        {lifecycleOptions.map((option) => {
          const selected = lifecycleFilter === option.id;
          const countLabel = formatCount(counts?.[option.id]);

          return (
            <button
              key={option.id}
              type="button"
              className={styles.pill}
              data-selected={selected}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                onLifecycleFilterChange?.(option.id);
              }}
            >
              <span className={styles.pillLabel}>{option.label}</span>

              {countLabel ? (
                <span className={styles.count} aria-hidden="true">
                  {countLabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        className={styles.group}
        role="group"
        aria-label="Filtros por porte do projeto"
      >
        {sizeOptions.map((option) => {
          const selected = sizeFilter === option.id;
          const countLabel = formatCount(counts?.[option.id]);

          return (
            <button
              key={option.id}
              type="button"
              className={styles.pill}
              data-selected={selected}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                onSizeFilterChange?.(option.id);
              }}
              title={option.label}
            >
              <span className={styles.pillLabel}>
                {compact && option.shortLabel ? option.shortLabel : option.label}
              </span>

              {countLabel ? (
                <span className={styles.count} aria-hidden="true">
                  {countLabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
