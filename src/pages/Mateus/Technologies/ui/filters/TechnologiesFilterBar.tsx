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

export type TechnologiesFilterItem = Readonly<{
  id: string;
  label: string;
  shortLabel?: string;
  count?: number;
  color?: string;
  disabled?: boolean;
}>;

export type TechnologiesFilterBarVariant = "default" | "headerRail";

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

function formatCount(count?: number): string | null {
  if (typeof count !== "number" || Number.isNaN(count) || count < 0) {
    return null;
  }

  if (count === 1) {
    return "1 item";
  }

  return `${count} itens`;
}

function TechnologiesFilterBarComponent({
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
  showResetButton = true,
  resetLabel = "Limpar filtro",
  onReset,
}: TechnologiesFilterBarProps) {
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
        color: "rgba(212, 175, 55, 0.95)",
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
      ? "headerRail"
      : "default";

  const resolvedVariant = variant ?? inferredVariant;
  const isHeaderRail = resolvedVariant === "headerRail";

  const resolvedEyebrow =
    eyebrow ?? (isHeaderRail ? "" : "Capability Filters");
  const resolvedTitle =
    title ?? (isHeaderRail ? "" : "Filtrar tecnologias por domínio");
  const resolvedDescription =
    description ??
    (isHeaderRail
      ? ""
      : "Organize a leitura por especialidade e destaque rapidamente os blocos mais relevantes da stack.");
  const resolvedHelperText =
    helperText ??
    (isHeaderRail
      ? ""
      : "Selecione um domínio para focar a leitura do grid e do spotlight técnico.");
  const resolvedResultText = resultText ?? "";
  const resolvedAriaLabel = ariaLabel ?? "Filtros de tecnologias";

  const showReset = showResetButton && activeFilterId !== allFilterId;

  const showHeader =
    !isHeaderRail &&
    (!isBlank(resolvedEyebrow) ||
      !isBlank(resolvedTitle) ||
      !isBlank(resolvedDescription) ||
      Boolean(summaryLabel) ||
      showReset);

  const showUtilityRow = isHeaderRail && (Boolean(summaryLabel) || showReset);

  const showFooter =
    !isHeaderRail &&
    (!isBlank(resolvedHelperText) || !isBlank(resolvedResultText));

  const handleReset = (): void => {
    if (onReset) {
      onReset();
      return;
    }

    onChange(allFilterId);
  };

  return (
    <section
      className={joinClasses(
        styles.root,
        isHeaderRail && styles.rootHeaderRail,
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

            {showReset ? (
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
                aria-label={resetLabel}
              >
                {resetLabel}
              </button>
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
                styles.summaryChipHeaderRail,
              )}
            >
              {summaryLabel}
            </span>
          ) : null}

          {showReset ? (
            <button
              type="button"
              className={joinClasses(
                styles.resetButton,
                styles.resetButtonHeaderRail,
              )}
              onClick={handleReset}
              aria-label={resetLabel}
            >
              {resetLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={joinClasses(
          styles.filtersScroller,
          isHeaderRail && styles.filtersScrollerHeaderRail,
        )}
      >
        <div
          className={joinClasses(
            styles.filterList,
            isHeaderRail && styles.filterListHeaderRail,
          )}
          role="tablist"
          aria-label={resolvedAriaLabel}
        >
          {resolvedItems.map((item) => {
            const isActive = item.id === activeFilterId;
            const countLabel = formatCount(item.count);

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={
                  countLabel
                    ? `${item.label}, ${countLabel}`
                    : `Filtrar por ${item.label}`
                }
                disabled={item.disabled}
                className={joinClasses(
                  styles.filterButton,
                  isHeaderRail && styles.filterButtonHeaderRail,
                  isActive && styles.filterButtonActive,
                  item.disabled && styles.filterButtonDisabled,
                )}
                style={
                  {
                    "--filter-accent":
                      item.color ?? "rgba(255, 255, 255, 0.14)",
                  } as React.CSSProperties
                }
                onClick={() => onChange(item.id)}
                data-filter-id={item.id}
                data-filter-active={isActive ? "true" : "false"}
              >
                <span
                  className={joinClasses(
                    styles.filterDot,
                    isHeaderRail && styles.filterDotHeaderRail,
                  )}
                  aria-hidden="true"
                />

                <span
                  className={joinClasses(
                    styles.filterLabelGroup,
                    isHeaderRail && styles.filterLabelGroupHeaderRail,
                  )}
                >
                  <span className={styles.filterLabel}>
                    {item.shortLabel ?? item.label}
                  </span>

                  {countLabel ? (
                    <span
                      className={joinClasses(
                        styles.filterCount,
                        isHeaderRail && styles.filterCountHeaderRail,
                      )}
                    >
                      {countLabel}
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
