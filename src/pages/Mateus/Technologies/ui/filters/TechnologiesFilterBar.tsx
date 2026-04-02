import React, { memo, useMemo } from "react";

import styles from "./TechnologiesFilterBar.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function isBlank(value?: string): boolean {
  return !value || value.trim().length === 0;
}

const COUNT_FORMATTER = new Intl.NumberFormat("pt-BR");

export type TechnologiesFilterItem = Readonly<{
  id: string;
  label: string;
  shortLabel?: string;
  count?: number;
  color?: string;
  disabled?: boolean;
}>;

export type TechnologiesFilterBarVariant =
  | "default"
  | "headerRail"
  | "clusterNav";

type TechnologiesFilterBarProps = Readonly<{
  items: readonly TechnologiesFilterItem[];
  activeFilterId: string;
  onChange: (filterId: string) => void;
  className?: string;
  variant?: TechnologiesFilterBarVariant;
  eyebrow?: string;
  title?: string;
  description?: string;
  summaryLabel?: string;
  helperText?: string;
  resultText?: string;
  ariaLabel?: string;
  allFilterId?: string;
  allFilterLabel?: string;
  allFilterCount?: number;
  includeAllFilter?: boolean;
  showResetButton?: boolean;
  resetLabel?: string;
  onReset?: () => void;
}>;

type ResolvedFilterItem = TechnologiesFilterItem;

function normalizeCount(count?: number): number | null {
  if (typeof count !== "number" || Number.isNaN(count) || count < 0) {
    return null;
  }

  return count;
}

function formatVisualCount(
  count?: number,
  isCompactRail?: boolean,
): string | null {
  const normalizedCount = normalizeCount(count);

  if (normalizedCount === null) {
    return null;
  }

  if (isCompactRail) {
    return COUNT_FORMATTER.format(normalizedCount);
  }

  if (normalizedCount === 1) {
    return "1 item";
  }

  return `${COUNT_FORMATTER.format(normalizedCount)} itens`;
}

function formatAriaCount(count?: number): string | null {
  const normalizedCount = normalizeCount(count);

  if (normalizedCount === null) {
    return null;
  }

  if (normalizedCount === 1) {
    return "1 item";
  }

  return `${COUNT_FORMATTER.format(normalizedCount)} itens`;
}

function TechnologiesFilterBarComponent(props: TechnologiesFilterBarProps) {
  const {
    items,
    activeFilterId,
    onChange,
    className,
    variant,
    eyebrow,
    title,
    description,
    summaryLabel,
    helperText,
    resultText,
    ariaLabel,
    allFilterId = "all",
    allFilterLabel = "Todos",
    allFilterCount,
    includeAllFilter = true,
    showResetButton,
    resetLabel,
    onReset,
  } = props;

  void showResetButton;
  void resetLabel;
  void onReset;

  const resolvedItems = useMemo<ResolvedFilterItem[]>(() => {
    const nextItems = [...items];

    if (!includeAllFilter) {
      return nextItems;
    }

    const hasAllFilter = nextItems.some((item) => item.id === allFilterId);

    if (hasAllFilter) {
      return nextItems;
    }

    return [
      {
        id: allFilterId,
        label: allFilterLabel,
        count: allFilterCount,
        color: "rgba(186, 152, 82, 0.82)",
      },
      ...nextItems,
    ];
  }, [items, includeAllFilter, allFilterId, allFilterLabel, allFilterCount]);

  const inferredVariant: TechnologiesFilterBarVariant =
    isBlank(title) &&
    isBlank(description) &&
    isBlank(helperText) &&
    isBlank(resultText) &&
    isBlank(summaryLabel)
      ? "clusterNav"
      : "default";

  const resolvedVariant = variant ?? inferredVariant;
  const isCompactRail =
    resolvedVariant === "headerRail" || resolvedVariant === "clusterNav";

  const resolvedEyebrow =
    eyebrow ?? (isCompactRail ? "" : "Capability Filters");
  const resolvedTitle =
    title ?? (isCompactRail ? "" : "Filtrar tecnologias por domínio");
  const resolvedDescription =
    description ??
    (isCompactRail
      ? ""
      : "Organize a leitura por especialidade e destaque rapidamente os blocos mais relevantes da stack.");
  const resolvedHelperText =
    helperText ??
    (isCompactRail
      ? ""
      : "Selecione um domínio para focar a leitura do grid e do spotlight técnico.");
  const resolvedResultText = resultText ?? "";
  const resolvedAriaLabel = ariaLabel ?? "Filtros de tecnologias";

  const showHeader =
    !isCompactRail &&
    (!isBlank(resolvedEyebrow) ||
      !isBlank(resolvedTitle) ||
      !isBlank(resolvedDescription) ||
      Boolean(summaryLabel));

  const showUtilityRow = isCompactRail && Boolean(summaryLabel);

  const showFooter =
    !isCompactRail &&
    (!isBlank(resolvedHelperText) || !isBlank(resolvedResultText));

  return (
    <section
      className={joinClasses(
        styles.root,
        isCompactRail && styles.rootCompactRail,
        className,
      )}
      aria-label={resolvedAriaLabel}
      data-technologies-filter-bar="true"
      data-filter-variant={resolvedVariant}
    >
      {showHeader ? (
        <div className={styles.header}>
          <div className={styles.headingGroup}>
            {!isBlank(resolvedEyebrow) ? (
              <p className={styles.eyebrow}>{resolvedEyebrow}</p>
            ) : null}

            {!isBlank(resolvedTitle) ? (
              <h2 className={styles.title}>{resolvedTitle}</h2>
            ) : null}

            {!isBlank(resolvedDescription) ? (
              <p className={styles.description}>{resolvedDescription}</p>
            ) : null}
          </div>

          <div className={styles.actions}>
            {summaryLabel ? (
              <span className={styles.summaryChip}>{summaryLabel}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showUtilityRow ? (
        <div className={styles.utilityRow}>
          {summaryLabel ? (
            <span
              className={joinClasses(
                styles.summaryChip,
                styles.summaryChipCompactRail,
              )}
            >
              {summaryLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={joinClasses(
          styles.filtersScroller,
          isCompactRail && styles.filtersScrollerCompactRail,
        )}
      >
        <div
          className={joinClasses(
            styles.filterList,
            isCompactRail && styles.filterListCompactRail,
          )}
          role="tablist"
          aria-label={resolvedAriaLabel}
        >
          {resolvedItems.map((item) => {
            const isActive = item.id === activeFilterId;
            const visualCount = formatVisualCount(item.count, isCompactRail);
            const ariaCount = formatAriaCount(item.count);

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={
                  ariaCount
                    ? `${item.label}, ${ariaCount}${
                        isActive ? ", filtro ativo" : ""
                      }`
                    : `${isActive ? "Filtro ativo" : "Filtrar por"} ${item.label}`
                }
                disabled={item.disabled}
                className={joinClasses(
                  styles.filterButton,
                  isCompactRail && styles.filterButtonCompactRail,
                  isActive && styles.filterButtonActive,
                  item.disabled && styles.filterButtonDisabled,
                )}
                style={
                  {
                    "--filter-accent":
                      item.color ?? "rgba(255, 255, 255, 0.18)",
                  } as React.CSSProperties
                }
                onClick={() => onChange(item.id)}
                data-filter-id={item.id}
                data-filter-active={isActive ? "true" : "false"}
              >
                <span
                  className={joinClasses(
                    styles.filterMarker,
                    isCompactRail && styles.filterMarkerCompactRail,
                  )}
                  aria-hidden="true"
                />

                <span
                  className={joinClasses(
                    styles.filterLabelGroup,
                    isCompactRail && styles.filterLabelGroupCompactRail,
                  )}
                >
                  <span className={styles.filterLabel}>
                    {item.shortLabel ?? item.label}
                  </span>

                  {visualCount ? (
                    <span
                      className={joinClasses(
                        styles.filterCount,
                        isCompactRail && styles.filterCountCompactRail,
                      )}
                    >
                      {visualCount}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showFooter ? (
        <div className={styles.footer}>
          {!isBlank(resolvedHelperText) ? (
            <p className={styles.helperText}>{resolvedHelperText}</p>
          ) : null}

          {!isBlank(resolvedResultText) ? (
            <p className={styles.resultText}>{resolvedResultText}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

const TechnologiesFilterBar = memo(TechnologiesFilterBarComponent);
TechnologiesFilterBar.displayName = "TechnologiesFilterBar";

export default TechnologiesFilterBar;
