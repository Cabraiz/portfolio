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

type FiltersCssVariables = CSSProperties & {
  "--live-project-filters-gap"?: string;
  "--live-project-filters-padding-x"?: string;
  "--live-project-filters-padding-y"?: string;
  "--live-project-filters-pill-height"?: string;
  "--live-project-filters-pill-padding-x"?: string;
  "--live-project-filters-pill-font-size"?: string;
};

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

function renderFilterButton<TValue extends string>(options: Readonly<{
  option: FilterOption<TValue>;
  value: TValue;
  compact: boolean;
  disabled: boolean;
  countValue?: number;
  onSelect?: (value: TValue) => void;
}>) {
  const { option, value, compact, disabled, countValue, onSelect } = options;
  const selected = option.id === value;
  const countLabel = formatCount(countValue);
  const visibleLabel =
    compact && option.shortLabel ? option.shortLabel : option.label;

  return (
    <button
      key={option.id}
      type="button"
      className={styles.pill}
      data-selected={selected ? "true" : "false"}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => {
        onSelect?.(option.id);
      }}
      title={visibleLabel !== option.label ? option.label : undefined}
    >
      <span className={styles.pillLabel}>{visibleLabel}</span>

      {countLabel ? (
        <span className={styles.count} aria-hidden="true">
          {countLabel}
        </span>
      ) : null}
    </button>
  );
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
      ? ([
          {
            id: "all",
            label: "Todos",
            shortLabel: "Todos",
          },
        ] as const)
      : []),
    {
      id: "ongoing",
      label: "Em andamento",
      shortLabel: "Andamento",
    },
    {
      id: "delivered",
      label: "Concluído",
      shortLabel: "Concluído",
    },
  ];

  const sizeOptions: readonly FilterOption<LiveProjectSizeFilter>[] = [
    ...(showSizeAll
      ? ([
          {
            id: "all",
            label: "Todos os portes",
            shortLabel: "Todos",
          },
        ] as const)
      : []),
    {
      id: "low",
      label: "Projetos pequenos",
      shortLabel: "Pequenos",
    },
    {
      id: "medium",
      label: "Projetos médios",
      shortLabel: "Médios",
    },
    {
      id: "high",
      label: "Projetos grandes",
      shortLabel: "Grandes",
    },
  ];

  const style: FiltersCssVariables = {
    "--live-project-filters-gap": compact ? "8px" : "10px",
    "--live-project-filters-padding-x": compact ? "12px" : "16px",
    "--live-project-filters-padding-y": compact ? "12px" : "14px",
    "--live-project-filters-pill-height": compact ? "38px" : "40px",
    "--live-project-filters-pill-padding-x": compact ? "14px" : "16px",
    "--live-project-filters-pill-font-size": compact ? "0.68rem" : "0.72rem",
  };

  return (
    <div
      className={joinClassNames(
        styles.root,
        compact && styles.rootCompact,
        className
      )}
      style={style}
      aria-label="Filtros de projetos ao vivo"
    >
      <div
        className={styles.group}
        role="group"
        aria-label="Filtros por andamento"
      >
        {lifecycleOptions.map((option) =>
          renderFilterButton({
            option,
            value: lifecycleFilter,
            compact,
            disabled,
            countValue: counts?.[option.id],
            onSelect: onLifecycleFilterChange,
          })
        )}
      </div>

      <div
        className={styles.group}
        role="group"
        aria-label="Filtros por porte do projeto"
      >
        {sizeOptions.map((option) =>
          renderFilterButton({
            option,
            value: sizeFilter,
            compact,
            disabled,
            countValue: counts?.[option.id],
            onSelect: onSizeFilterChange,
          })
        )}
      </div>
    </div>
  );
}
