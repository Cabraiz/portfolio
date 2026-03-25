import { memo, useMemo, type CSSProperties } from "react";

import {
  ROADMAP_KIND_LABELS,
  ROADMAP_RELATION_LABELS,
} from "../../domain/model/roadmap.constants";
import {
  ROADMAP_NODE_REGISTRY,
  ROADMAP_RELATION_REGISTRY,
} from "../../domain/model/roadmap.registry";

function NodeLegendChip({
  label,
  background,
  border,
}: Readonly<{
  label: string;
  background: string;
  border: string;
}>) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "10px",
    background,
    border: `2px solid ${border}`,
    color: "#111111",
    fontSize: "0.76rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return <span style={style}>{label}</span>;
}

function RelationLegendChip({
  label,
  borderStyle,
  borderColor,
}: Readonly<{
  label: string;
  borderStyle: CSSProperties["borderStyle"];
  borderColor: string;
}>) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "#ffffff",
    borderWidth: "2px",
    borderStyle,
    borderColor,
    color: "#0f172a",
    fontSize: "0.76rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return <span style={style}>{label}</span>;
}

function RoadMapLegendComponent() {
  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "16px",
      padding: "20px 22px",
      borderRadius: "24px",
      border: "1px solid rgba(30, 94, 255, 0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow:
        "0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
    }),
    [],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#0f172a",
      fontSize: "0.96rem",
      fontWeight: 900,
      letterSpacing: "-0.02em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const sectionTitleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#334155",
      fontSize: "0.75rem",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const itemsStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    }),
    [],
  );

  return (
    <section style={wrapperStyle}>
      <h3 style={titleStyle}>Legenda do mapa</h3>

      <div style={{ display: "grid", gap: "10px" }}>
        <h4 style={sectionTitleStyle}>Tipos de nó</h4>
        <div style={itemsStyle}>
          <NodeLegendChip
            label={ROADMAP_KIND_LABELS.domain}
            background="#fff35c"
            border="#191919"
          />
          <NodeLegendChip
            label={ROADMAP_KIND_LABELS.topic}
            background="#f3e4a0"
            border="#1f1f1f"
          />
          <NodeLegendChip
            label={ROADMAP_KIND_LABELS.technology}
            background="#efe5c7"
            border="#1f1f1f"
          />
          <NodeLegendChip
            label={ROADMAP_KIND_LABELS.concept}
            background="#f5ebc8"
            border="#262626"
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h4 style={sectionTitleStyle}>Relações</h4>
        <div style={itemsStyle}>
          <RelationLegendChip
            label={ROADMAP_RELATION_LABELS.contains}
            borderStyle="dotted"
            borderColor="#1e5eff"
          />
          <RelationLegendChip
            label={ROADMAP_RELATION_LABELS.prerequisite}
            borderStyle="solid"
            borderColor="#1e5eff"
          />
          <RelationLegendChip
            label={ROADMAP_RELATION_LABELS.alternative}
            borderStyle="dashed"
            borderColor="#4a4a4a"
          />
          <RelationLegendChip
            label={ROADMAP_RELATION_LABELS.complements}
            borderStyle="solid"
            borderColor="#155eef"
          />
          <RelationLegendChip
            label={ROADMAP_RELATION_LABELS.specializes}
            borderStyle="dotted"
            borderColor="#155eef"
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "8px",
          color: "#475569",
          fontSize: "0.86rem",
          lineHeight: 1.5,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <span>{ROADMAP_NODE_REGISTRY.domain.description}</span>
        <span>{ROADMAP_RELATION_REGISTRY.prerequisite.description}</span>
      </div>
    </section>
  );
}

export default memo(RoadMapLegendComponent);
