import { memo, useMemo, type CSSProperties, type ReactNode } from "react";

import {
	ROADMAP_CATEGORY_IDS,
	ROADMAP_CATEGORY_LABELS,
	ROADMAP_DEMAND_LABELS,
	ROADMAP_DEMAND_LEVELS,
	ROADMAP_MARKET_SIGNAL_LABELS,
	ROADMAP_MARKET_SIGNALS,
} from "../../domain/model/roadmap.constants";
import type { RoadMapFilterState } from "../../domain/model/roadmap.types";

type RoadMapMobileFiltersProps = Readonly<{
	filters: RoadMapFilterState;
	activeFilterCount?: number;
	onQueryChange: (query: string) => void;
	onReset: () => void;
	onToggleCategory: (category: (typeof ROADMAP_CATEGORY_IDS)[number]) => void;
	onToggleDemand: (demand: (typeof ROADMAP_DEMAND_LEVELS)[number]) => void;
	onToggleSignal: (signal: (typeof ROADMAP_MARKET_SIGNALS)[number]) => void;
}>;

function FilterChip({
	label,
	active = false,
	onClick,
}: Readonly<{
	label: string;
	active?: boolean;
	onClick: () => void;
}>) {
	const style: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "34px",
		padding: "0 12px",
		borderRadius: "999px",
		border: active
			? "1px solid rgba(30, 94, 255, 0.24)"
			: "1px solid rgba(15, 23, 42, 0.08)",
		background: active ? "rgba(30, 94, 255, 0.10)" : "#ffffff",
		color: active ? "#15308f" : "#0f172a",
		fontSize: "0.74rem",
		fontWeight: 800,
		lineHeight: 1,
		whiteSpace: "nowrap",
		cursor: "pointer",
		boxShadow: active
			? "0 8px 20px rgba(30, 94, 255, 0.10)"
			: "0 6px 16px rgba(15, 23, 42, 0.04)",
		fontFamily:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	};

	return (
		<button type="button" style={style} onClick={onClick}>
			{label}
		</button>
	);
}

function FilterRow({
	title,
	children,
}: Readonly<{
	title: string;
	children: ReactNode;
}>) {
	return (
		<section style={{ display: "grid", gap: "8px" }}>
			<h3
				style={{
					margin: 0,
					color: "#334155",
					fontSize: "0.72rem",
					fontWeight: 900,
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					fontFamily:
						'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				}}
			>
				{title}
			</h3>

			<div
				style={{
					display: "flex",
					gap: "8px",
					overflowX: "auto",
					paddingBottom: "2px",
				}}
			>
				{children}
			</div>
		</section>
	);
}

function RoadMapMobileFiltersComponent({
	filters,
	activeFilterCount = 0,
	onQueryChange,
	onReset,
	onToggleCategory,
	onToggleDemand,
	onToggleSignal,
}: RoadMapMobileFiltersProps) {
	const wrapperStyle = useMemo<CSSProperties>(
		() => ({
			display: "grid",
			gap: "14px",
			padding: "16px",
			borderRadius: "24px",
			border: "1px solid rgba(30, 94, 255, 0.08)",
			background:
				"linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
			boxShadow:
				"0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
		}),
		[]
	);

	const inputStyle = useMemo<CSSProperties>(
		() => ({
			width: "100%",
			minHeight: "44px",
			padding: "0 14px",
			borderRadius: "14px",
			border: "1px solid rgba(15, 23, 42, 0.10)",
			background: "#ffffff",
			color: "#0f172a",
			fontSize: "0.92rem",
			outline: "none",
			boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const actionRowStyle = useMemo<CSSProperties>(
		() => ({
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			gap: "10px",
		}),
		[]
	);

	const badgeStyle = useMemo<CSSProperties>(
		() => ({
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			minHeight: "30px",
			padding: "0 10px",
			borderRadius: "999px",
			background: "rgba(30, 94, 255, 0.08)",
			color: "#15308f",
			fontSize: "0.72rem",
			fontWeight: 800,
			lineHeight: 1,
			whiteSpace: "nowrap",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const resetButtonStyle = useMemo<CSSProperties>(
		() => ({
			minHeight: "36px",
			padding: "0 12px",
			borderRadius: "10px",
			border: "1px solid rgba(15, 23, 42, 0.08)",
			background: "#ffffff",
			color: "#0f172a",
			fontSize: "0.76rem",
			fontWeight: 800,
			cursor: "pointer",
			boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	return (
		<section style={wrapperStyle}>
			<input
				type="search"
				value={filters.query}
				onChange={(event) => onQueryChange(event.target.value)}
				placeholder="Buscar tecnologia, conceito ou tag..."
				style={inputStyle}
			/>

			<div style={actionRowStyle}>
				<span style={badgeStyle}>{activeFilterCount} filtros ativos</span>

				<button type="button" style={resetButtonStyle} onClick={onReset}>
					Limpar
				</button>
			</div>

			<FilterRow title="Categorias">
				{ROADMAP_CATEGORY_IDS.map((category) => (
					<FilterChip
						key={category}
						label={ROADMAP_CATEGORY_LABELS[category]}
						active={filters.activeCategories.includes(category)}
						onClick={() => onToggleCategory(category)}
					/>
				))}
			</FilterRow>

			<FilterRow title="Prioridade">
				{ROADMAP_DEMAND_LEVELS.map((demand) => (
					<FilterChip
						key={demand}
						label={ROADMAP_DEMAND_LABELS[demand]}
						active={filters.activeDemands.includes(demand)}
						onClick={() => onToggleDemand(demand)}
					/>
				))}
			</FilterRow>

			<FilterRow title="Mercado">
				{ROADMAP_MARKET_SIGNALS.map((signal) => (
					<FilterChip
						key={signal}
						label={ROADMAP_MARKET_SIGNAL_LABELS[signal]}
						active={filters.activeSignals.includes(signal)}
						onClick={() => onToggleSignal(signal)}
					/>
				))}
			</FilterRow>
		</section>
	);
}

export default memo(RoadMapMobileFiltersComponent);
