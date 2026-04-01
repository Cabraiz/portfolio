import React, { memo, useMemo } from "react";

import styles from "./TechnologiesFilterBar.module.css";

function joinClasses(
	...classes: Array<string | undefined | null | false>
): string {
	return classes.filter(Boolean).join(" ");
}

export type TechnologiesFilterItem = Readonly<{
	id: string;
	label: string;
	shortLabel?: string;
	count?: number;
	color?: string;
	disabled?: boolean;
}>;

type TechnologiesFilterBarProps = Readonly<{
	items: readonly TechnologiesFilterItem[];
	activeFilterId: string;
	onChange: (filterId: string) => void;
	className?: string;
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
	eyebrow = "Capability Filters",
	title = "Filtrar tecnologias por domínio",
	description = "Organize a leitura por especialidade e destaque rapidamente os blocos mais relevantes da stack.",
	summaryLabel,
	helperText = "Selecione um domínio para focar a leitura do grid hexagonal e do spotlight técnico.",
	resultText,
	ariaLabel = "Filtros de tecnologias",
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

	const showReset = showResetButton && activeFilterId !== allFilterId;

	const handleReset = (): void => {
		if (onReset) {
			onReset();
			return;
		}

		onChange(allFilterId);
	};

	return (
		<section
			className={joinClasses(styles.root, className)}
			aria-label={ariaLabel}
			data-technologies-filter-bar="true"
		>
			<div className={styles.header}>
				<div className={styles.headingGroup}>
					<p className={styles.eyebrow}>{eyebrow}</p>
					<h2 className={styles.title}>{title}</h2>
					{description ? (
						<p className={styles.description}>{description}</p>
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

			<div className={styles.filtersScroller}>
				<div
					className={styles.filterList}
					role="tablist"
					aria-label={ariaLabel}
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
									isActive && styles.filterButtonActive,
									item.disabled && styles.filterButtonDisabled
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
								<span className={styles.filterDot} aria-hidden="true" />
								<span className={styles.filterLabelGroup}>
									<span className={styles.filterLabel}>
										{item.shortLabel ?? item.label}
									</span>
									{countLabel ? (
										<span className={styles.filterCount}>{countLabel}</span>
									) : null}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{helperText || resultText ? (
				<div className={styles.footer}>
					{helperText ? (
						<p className={styles.helperText}>{helperText}</p>
					) : null}
					{resultText ? (
						<p className={styles.resultText}>{resultText}</p>
					) : null}
				</div>
			) : null}
		</section>
	);
}

const TechnologiesFilterBar = memo(TechnologiesFilterBarComponent);
TechnologiesFilterBar.displayName = "TechnologiesFilterBar";

export default TechnologiesFilterBar;
