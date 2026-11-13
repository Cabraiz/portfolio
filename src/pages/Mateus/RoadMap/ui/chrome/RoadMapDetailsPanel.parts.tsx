import type { CSSProperties, ReactNode } from "react";

import type { RoadMapNode } from "../../domain/model/roadmap.types";

// Peças visuais do painel de detalhes
const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function DetailSection({
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
      <h4 style={titleStyle}>{title}</h4>
      {children}
    </section>
  );
}

function InfoBadge({
  label,
  active = false,
}: Readonly<{
  label: string;
  active?: boolean;
}>) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    border: active
      ? "1px solid rgba(37, 99, 235, 0.18)"
      : "1px solid rgba(148, 163, 184, 0.16)",
    background: active ? "rgba(239, 246, 255, 0.96)" : "#ffffff",
    color: active ? "#1d4ed8" : "#334155",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily: FONT_FAMILY,
  };

  return <span style={style}>{label}</span>;
}

function DetailList({
  items,
}: Readonly<{
  items: readonly string[];
}>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "18px",
        display: "grid",
        gap: "5px",
        color: "#334155",
        fontSize: "0.88rem",
        lineHeight: 1.55,
        fontFamily: FONT_FAMILY,
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function NodeLinks({
  nodes,
}: Readonly<{
  nodes: readonly RoadMapNode[];
}>) {
  if (nodes.length === 0) {
    return (
      <span
        style={{
          color: "#64748b",
          fontSize: "0.84rem",
          lineHeight: 1.5,
          fontFamily: FONT_FAMILY,
        }}
      >
        Nenhum item nesta seção.
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {nodes.map((item) => (
        <InfoBadge key={item.id} label={item.shortLabel ?? item.label} />
      ))}
    </div>
  );
}

export { DetailList, DetailSection, FONT_FAMILY, InfoBadge, NodeLinks };
