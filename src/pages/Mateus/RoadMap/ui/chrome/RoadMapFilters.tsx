import { memo, type CSSProperties, type ReactNode } from "react";

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
    relationType: (typeof ROADMAP_RELATION_TYPES)[number],
  ) => void;
  onShowDeprecatedChange: (value: boolean) => void;
  onShowHiddenChange: (value: boolean) => void;
}>;

type FilterChipProps = Readonly<{
  label: string;
  active?: boolean;
  onClick: () => void;
}>;

const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "32px",
    padding: "0 10px",
    borderRadius: "999px",
    border: active
      ? "1px solid rgba(37, 99, 235, 0.18)"
      : "1px solid rgba(148, 163, 184, 0.16)",
    background: active ? "rgba(239, 246, 255, 0.96)" : "#ffffff",
    color: active ? "#1d4ed8" : "#334155",
    fontSize: "0.74rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: FONT_FAMILY,
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
    minHeight: "32px",
    padding: "0 10px",
    borderRadius: "999px",
    border: checked
      ? "1px solid rgba(37, 99, 235, 0.18)"
      : "1px solid rgba(148, 163, 184, 0.16)",
    background: checked ? "rgba(239, 246, 255, 0.96)" : "#ffffff",
    color: checked ? "#1d4ed8" : "#334155",
    fontSize: "0.74rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT_FAMILY,
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
    color: "#475569",
    fontSize: "0.7rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: FONT_FAMILY,
  };

  return (
    <section style={{ display: "grid", gap: "8px" }}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {children}
      </div>
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
  const wrapperStyle: CSSProperties = {
    display: "grid",
    gap: "16px",
    padding: "18px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "#ffffff",
  };

  const topRowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    minHeight: "42px",
    padding: "0 12px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "0.92rem",
    outline: "none",
    fontFamily: FONT_FAMILY,
  };

  const resetButtonStyle: CSSProperties = {
    minHeight: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "#ffffff",
    color: "#334155",
    fontSize: "0.8rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT_FAMILY,
  };

  const countBadgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "rgba(239, 246, 255, 0.96)",
    color: "#1d4ed8",
    fontSize: "0.7rem",
    fontWeight: 800,
    lineHeight: 1,
    width: "fit-content",
    fontFamily: FONT_FAMILY,
  };

  return (
    <section style={wrapperStyle}>
      <div style={topRowStyle}>
        <input
          type="search"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar tecnologia, prática, contexto ou tag..."
          style={inputStyle}
        />

        <button type="button" style={resetButtonStyle} onClick={onReset}>
          Limpar
        </button>
      </div>

      <span style={countBadgeStyle}>{activeFilterCount} filtros ativos</span>

      <FilterSection title="Frentes">
        {ROADMAP_CATEGORY_IDS.map((category) => (
          <FilterChip
            key={category}
            label={ROADMAP_CATEGORY_LABELS[category]}
            active={filters.activeCategories.includes(category)}
            onClick={() => onToggleCategory(category)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Peso na stack">
        {ROADMAP_DEMAND_LEVELS.map((demand) => (
          <FilterChip
            key={demand}
            label={ROADMAP_DEMAND_LABELS[demand]}
            active={filters.activeDemands.includes(demand)}
            onClick={() => onToggleDemand(demand)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Tipo de item">
        {ROADMAP_NODE_KINDS.map((kind) => (
          <FilterChip
            key={kind}
            label={ROADMAP_KIND_LABELS[kind]}
            active={filters.activeKinds.includes(kind)}
            onClick={() => onToggleKind(kind)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Mercado">
        {ROADMAP_MARKET_SIGNALS.map((signal) => (
          <FilterChip
            key={signal}
            label={ROADMAP_MARKET_SIGNAL_LABELS[signal]}
            active={filters.activeSignals.includes(signal)}
            onClick={() => onToggleSignal(signal)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Conexões">
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
          label="Mostrar legado"
          checked={filters.showDeprecated}
          onChange={onShowDeprecatedChange}
        />
        <CheckboxChip
          label="Mostrar ocultos"
          checked={filters.showHidden}
          onChange={onShowHiddenChange}
        />
      </FilterSection>
    </section>
  );
}

export default memo(RoadMapFiltersComponent);
