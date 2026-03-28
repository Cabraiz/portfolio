import { memo, type CSSProperties } from "react";

import type {
  RoadMapNodeKind,
  RoadMapRelationType,
} from "../../domain/model/roadmap.types";

const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const KIND_LABELS: Record<RoadMapNodeKind, string> = {
  domain: "Frente",
  topic: "Bloco",
  technology: "Tecnologia",
  concept: "Prática",
};

const RELATION_LABELS: Record<RoadMapRelationType, string> = {
  contains: "Agrupa",
  prerequisite: "Base",
  alternative: "Alterna",
  complements: "Compõe",
  specializes: "Especializa",
};

function getKindChipStyle(kind: RoadMapNodeKind): CSSProperties {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    background: "#ffffff",
    color: "#334155",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily: FONT_FAMILY,
  };

  switch (kind) {
    case "domain":
      return {
        ...baseStyle,
        background: "#0f172a",
        borderColor: "#0f172a",
        color: "#f8fafc",
      };
    case "topic":
      return {
        ...baseStyle,
        borderColor: "rgba(37, 99, 235, 0.16)",
        color: "#0f172a",
      };
    case "technology":
      return {
        ...baseStyle,
        background: "#f8fafc",
        borderColor: "rgba(148, 163, 184, 0.14)",
        color: "#334155",
      };
    case "concept":
      return {
        ...baseStyle,
        background: "rgba(248, 250, 252, 0.92)",
        borderColor: "rgba(148, 163, 184, 0.14)",
        color: "#475569",
      };
    default:
      return baseStyle;
  }
}

function getRelationChipStyle(type: RoadMapRelationType): CSSProperties {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    borderWidth: "1px",
    borderStyle: "solid",
    background: "#ffffff",
    color: "#334155",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily: FONT_FAMILY,
  };

  switch (type) {
    case "contains":
      return {
        ...baseStyle,
        borderColor: "rgba(148, 163, 184, 0.22)",
        borderStyle: "dashed",
      };
    case "prerequisite":
      return {
        ...baseStyle,
        borderColor: "rgba(37, 99, 235, 0.58)",
        color: "#1d4ed8",
      };
    case "alternative":
      return {
        ...baseStyle,
        borderColor: "rgba(148, 163, 184, 0.24)",
        borderStyle: "dashed",
      };
    case "complements":
      return {
        ...baseStyle,
        borderColor: "rgba(14, 116, 144, 0.34)",
      };
    case "specializes":
      return {
        ...baseStyle,
        borderColor: "rgba(99, 102, 241, 0.24)",
        borderStyle: "dashed",
      };
    default:
      return baseStyle;
  }
}

function RoadMapLegendComponent() {
  const wrapperStyle: CSSProperties = {
    display: "grid",
    gap: "12px",
    minWidth: 0,
    fontFamily: FONT_FAMILY,
  };

  const sectionStyle: CSSProperties = {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  };

  const sectionTitleStyle: CSSProperties = {
    margin: 0,
    color: "#475569",
    fontSize: "0.68rem",
    fontWeight: 900,
    letterSpacing: "0.1em",
    lineHeight: 1,
    textTransform: "uppercase",
    fontFamily: FONT_FAMILY,
  };

  const itemsStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  };

  const captionStyle: CSSProperties = {
    margin: 0,
    color: "#64748b",
    fontSize: "0.8rem",
    lineHeight: 1.45,
    fontFamily: FONT_FAMILY,
  };

  const nodeKinds: readonly RoadMapNodeKind[] = [
    "domain",
    "topic",
    "technology",
    "concept",
  ];

  const relationTypes: readonly RoadMapRelationType[] = [
    "contains",
    "prerequisite",
    "alternative",
    "complements",
    "specializes",
  ];

  return (
    <section style={wrapperStyle}>
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Nós</h3>
        <div style={itemsStyle}>
          {nodeKinds.map((kind) => (
            <span key={kind} style={getKindChipStyle(kind)}>
              {KIND_LABELS[kind]}
            </span>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Linhas</h3>
        <div style={itemsStyle}>
          {relationTypes.map((type) => (
            <span key={type} style={getRelationChipStyle(type)}>
              {RELATION_LABELS[type]}
            </span>
          ))}
        </div>
      </div>

      <p style={captionStyle}>Nós mostram nível. Linhas mostram vínculo.</p>
    </section>
  );
}

export default memo(RoadMapLegendComponent);
