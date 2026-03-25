import { memo, useMemo, type CSSProperties } from "react";

import {
  ROADMAP_KIND_LABELS,
  ROADMAP_RELATION_LABELS,
} from "../../domain/model/roadmap.constants";
import {
  ROADMAP_NODE_REGISTRY,
  ROADMAP_RELATION_REGISTRY,
} from "../../domain/model/roadmap.registry";
import type {
  RoadMapNodeKind,
  RoadMapRelationStyle,
  RoadMapRelationType,
} from "../../domain/model/roadmap.types";

type NodeLegendChipProps = Readonly<{
  kind: RoadMapNodeKind;
  label: string;
}>;

type RelationLegendChipProps = Readonly<{
  type: RoadMapRelationType;
  label: string;
  borderStyle: RoadMapRelationStyle;
}>;

function getNodeLegendStyle(kind: RoadMapNodeKind): CSSProperties {
  switch (kind) {
    case "domain":
      return {
        borderRadius: "14px",
        background: "linear-gradient(180deg, #0f172a 0%, #16203b 100%)",
        border: "1px solid rgba(96, 165, 250, 0.34)",
        color: "#f8fafc",
      };
    case "topic":
      return {
        borderRadius: "12px",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        border: "1px solid rgba(37, 99, 235, 0.18)",
        color: "#0f172a",
      };
    case "technology":
      return {
        borderRadius: "12px",
        background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        color: "#0f172a",
      };
    case "concept":
      return {
        borderRadius: "999px",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        color: "#1e293b",
      };
    default:
      return {
        borderRadius: "12px",
        background: "#ffffff",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        color: "#0f172a",
      };
  }
}

function getRelationBorderColor(type: RoadMapRelationType): string {
  switch (type) {
    case "contains":
      return "rgba(59, 130, 246, 0.62)";
    case "prerequisite":
      return "rgba(37, 99, 235, 0.82)";
    case "alternative":
      return "rgba(100, 116, 139, 0.56)";
    case "complements":
      return "rgba(14, 116, 144, 0.62)";
    case "specializes":
      return "rgba(99, 102, 241, 0.58)";
    default:
      return "rgba(37, 99, 235, 0.70)";
  }
}

function NodeLegendChip({ kind, label }: NodeLegendChipProps) {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    fontSize: "0.76rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return <span style={{ ...baseStyle, ...getNodeLegendStyle(kind) }}>{label}</span>;
}

function RelationLegendChip({
  type,
  label,
  borderStyle,
}: RelationLegendChipProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.92)",
    borderWidth: "2px",
    borderStyle,
    borderColor: getRelationBorderColor(type),
    color: "#0f172a",
    fontSize: "0.76rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
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
      border: "1px solid rgba(148, 163, 184, 0.16)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
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
      fontSize: "0.74rem",
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

  const captionStyle = useMemo<CSSProperties>(
    () => ({
      color: "#475569",
      fontSize: "0.84rem",
      lineHeight: 1.55,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const nodeKinds = useMemo(
    () => [
      "domain",
      "topic",
      "technology",
      "concept",
    ] as const satisfies readonly RoadMapNodeKind[],
    [],
  );

  const relationTypes = useMemo(
    () => [
      "contains",
      "prerequisite",
      "alternative",
      "complements",
      "specializes",
    ] as const satisfies readonly RoadMapRelationType[],
    [],
  );

  return (
    <section style={wrapperStyle}>
      <h3 style={titleStyle}>Leitura visual</h3>

      <div style={{ display: "grid", gap: "10px" }}>
        <h4 style={sectionTitleStyle}>Tipos de item</h4>
        <div style={itemsStyle}>
          {nodeKinds.map((kind) => (
            <NodeLegendChip
              key={kind}
              kind={kind}
              label={ROADMAP_KIND_LABELS[kind]}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <h4 style={sectionTitleStyle}>Conexões</h4>
        <div style={itemsStyle}>
          {relationTypes.map((relationType) => (
            <RelationLegendChip
              key={relationType}
              type={relationType}
              label={ROADMAP_RELATION_LABELS[relationType]}
              borderStyle={ROADMAP_RELATION_REGISTRY[relationType].style}
            />
          ))}
        </div>
      </div>

      <div style={captionStyle}>
        <div>{ROADMAP_NODE_REGISTRY.domain.description}</div>
        <div>{ROADMAP_RELATION_REGISTRY.prerequisite.description}</div>
      </div>
    </section>
  );
}

export default memo(RoadMapLegendComponent);
