import { memo, useMemo, type CSSProperties, type ReactNode } from "react";

import {
	ROADMAP_CATEGORY_IDS,
	ROADMAP_CATEGORY_LABELS,
	ROADMAP_DEMAND_LABELS,
	ROADMAP_DEMAND_LEVELS,
	ROADMAP_KIND_LABELS,
	ROADMAP_MARKET_SIGNAL_LABELS,
	ROADMAP_MARKET_SIGNALS,
	ROADMAP_NODE_KINDS,
	ROADMAP_RELATION_LABELS,
	ROADMAP_RELATION_TYPES,
} from "../../domain/model/roadmap.constants";
import type {
	RoadMapFilterState,
	RoadMapNodeKind,
} from "../../domain/model/roadmap.types";

type RoadMapFiltersProps = Readonly<{
	filters: RoadMapFilterState;
	activeFilterCount?: number;
	onQueryChange: (query: string) => void;
	onReset: () => void;
	onToggleCategory: (category: (typeof ROADMAP_CATEGORY_IDS)[number]) => void;
	onToggleDemand: (demand: (typeof ROADMAP_DEMAND_LEVELS)[number]) => void;
	onToggleKind: (kind: RoadMapNodeKind) => void;
	onToggleSignal: (signal: (typeof ROADMAP_MARKET_SIGNALS)[number]) => void;
	onToggleRelationType: (
		relationType: (typeof ROADMAP_RELATION_TYPES)[number]
	) => void;
	onShowDeprecatedChange: (value: boolean) => void;
	onShowHiddenChange: (value: boolean) => void;
}>;

type FilterChipProps = Readonly<{
	label: string;
	active?: boolean;
	onClick: () => void;
}>;

function FilterChip({ label, active = false, onClick }: FilterChipProps) {
	const style: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "34px",
		padding: "0 12px",
		borderRadius: "999px",
		border: active
			? "1px solid rgba(30, 94, 255, 0.28)"
			: "1px solid rgba(15, 23, 42, 0.08)",
		background: active ? "rgba(30, 94, 255, 0.10)" : "rgba(255,255,255,0.94)",
		color: active ? "#15308f" : "#0f172a",
		fontSize: "0.76rem",
		fontWeight: 800,
		lineHeight: 1,
		whiteSpace: "nowrap",
		cursor: "pointer",
		transition:
			"background 160ms ease, border-color 160ms ease, color 160ms ease",
		boxShadow: active
			? "0 10px 22px rgba(30, 94, 255, 0.10)"
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

function CheckboxChip({
	label,
	checked,
	onChange,
}: Readonly<{
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}>) {
	const wrapperStyle: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: "8px",
		minHeight: "34px",
		padding: "0 12px",
		borderRadius: "999px",
		border: "1px solid rgba(15, 23, 42, 0.08)",
		background: "rgba(255,255,255,0.94)",
		color: "#0f172a",
		fontSize: "0.76rem",
		fontWeight: 800,
		cursor: "pointer",
		boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
		fontFamily:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	};

	return (
		<label style={wrapperStyle}>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
			/>
			<span>{label}</span>
		</label>
	);
}

function FilterSection({
	title,
	children,
}: Readonly<{
	title: string;
	children: ReactNode;
}>) {
	const titleStyle: CSSProperties = {
		margin: 0,
		color: "#334155",
		fontSize: "0.75rem",
		fontWeight: 900,
		textTransform: "uppercase",
		letterSpacing: "0.08em",
		fontFamily:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	};

	const sectionStyle: CSSProperties = {
		display: "grid",
		gap: "10px",
	};

	const contentStyle: CSSProperties = {
		display: "flex",
		flexWrap: "wrap",
		gap: "8px",
	};

	return (
		<section style={sectionStyle}>
			<h3 style={titleStyle}>{title}</h3>
			<div style={contentStyle}>{children}</div>
		</section>
	);
}

function RoadMapFiltersComponent({
	filters,
	activeFilterCount = 0,
	onQueryChange,
	onReset,
	onToggleCategory,
	onToggleDemand,
	onToggleKind,
	onToggleSignal,
	onToggleRelationType,
	onShowDeprecatedChange,
	onShowHiddenChange,
}: RoadMapFiltersProps) {
	const wrapperStyle = useMemo<CSSProperties>(
		() => ({
			display: "grid",
			gap: "18px",
			padding: "20px 22px",
			borderRadius: "24px",
			border: "1px solid rgba(30, 94, 255, 0.08)",
			background:
				"linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
			boxShadow:
				"0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
		}),
		[]
	);

	const topRowStyle = useMemo<CSSProperties>(
		() => ({
			display: "grid",
			gridTemplateColumns: "minmax(0, 1fr) auto",
			gap: "12px",
			alignItems: "center",
		}),
		[]
	);

	const inputStyle = useMemo<CSSProperties>(
		() => ({
			width: "100%",
			minHeight: "46px",
			padding: "0 14px",
			borderRadius: "14px",
			border: "1px solid rgba(15, 23, 42, 0.10)",
			background: "#ffffff",
			color: "#0f172a",
			fontSize: "0.95rem",
			outline: "none",
			boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const resetButtonStyle = useMemo<CSSProperties>(
		() => ({
			minHeight: "46px",
			padding: "0 16px",
			borderRadius: "14px",
			border: "1px solid rgba(15, 23, 42, 0.08)",
			background: "#ffffff",
			color: "#0f172a",
			fontSize: "0.82rem",
			fontWeight: 800,
			cursor: "pointer",
			boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const countBadgeStyle = useMemo<CSSProperties>(
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
			width: "fit-content",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	return (
		<section style={wrapperStyle}>
			<div style={topRowStyle}>
				<input
					type="search"
					value={filters.query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder="Buscar por tecnologia, conceito, tag ou descrição..."
					style={inputStyle}
				/>

				<button type="button" style={resetButtonStyle} onClick={onReset}>
					Limpar filtros
				</button>
			</div>

			<span style={countBadgeStyle}>{activeFilterCount} filtros ativos</span>

			<FilterSection title="Categorias">
				{ROADMAP_CATEGORY_IDS.map((category) => (
					<FilterChip
						key={category}
						label={ROADMAP_CATEGORY_LABELS[category]}
						active={filters.activeCategories.includes(category)}
						onClick={() => onToggleCategory(category)}
					/>
				))}
			</FilterSection>

			<FilterSection title="Prioridade">
				{ROADMAP_DEMAND_LEVELS.map((demand) => (
					<FilterChip
						key={demand}
						label={ROADMAP_DEMAND_LABELS[demand]}
						active={filters.activeDemands.includes(demand)}
						onClick={() => onToggleDemand(demand)}
					/>
				))}
			</FilterSection>

			<FilterSection title="Tipo de nó">
				{ROADMAP_NODE_KINDS.map((kind) => (
					<FilterChip
						key={kind}
						label={ROADMAP_KIND_LABELS[kind]}
						active={filters.activeKinds.includes(kind)}
						onClick={() => onToggleKind(kind)}
					/>
				))}
			</FilterSection>

			<FilterSection title="Sinais de mercado">
				{ROADMAP_MARKET_SIGNALS.map((signal) => (
					<FilterChip
						key={signal}
						label={ROADMAP_MARKET_SIGNAL_LABELS[signal]}
						active={filters.activeSignals.includes(signal)}
						onClick={() => onToggleSignal(signal)}
					/>
				))}
			</FilterSection>

			<FilterSection title="Tipo de relação">
				{ROADMAP_RELATION_TYPES.map((relationType) => (
					<FilterChip
						key={relationType}
						label={ROADMAP_RELATION_LABELS[relationType]}
						active={filters.activeRelationTypes.includes(relationType)}
						onClick={() => onToggleRelationType(relationType)}
					/>
				))}
			</FilterSection>

			<FilterSection title="Visibilidade">
				<CheckboxChip
					label="Mostrar itens legados"
					checked={filters.showDeprecated}
					onChange={onShowDeprecatedChange}
				/>
				<CheckboxChip
					label="Mostrar itens ocultos"
					checked={filters.showHidden}
					onChange={onShowHiddenChange}
				/>
			</FilterSection>
		</section>
	);
}

export default memo(RoadMapFiltersComponent);
