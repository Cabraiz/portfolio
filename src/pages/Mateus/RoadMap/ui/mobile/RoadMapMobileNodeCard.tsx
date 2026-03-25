import { memo, useMemo, type CSSProperties } from "react";

import {
  ROADMAP_DEMAND_LABELS,
  ROADMAP_KIND_LABELS,
  ROADMAP_MARKET_SIGNAL_LABELS,
} from "../../domain/model/roadmap.constants";
import type { RoadMapNode } from "../../domain/model/roadmap.types";

type RoadMapMobileNodeCardProps = Readonly<{
  node: RoadMapNode;
  isActive?: boolean;
  isHovered?: boolean;
  onSelect?: (nodeId: string) => void;
  onHover?: (nodeId: string | null) => void;
}>;

function getCardPalette(node: RoadMapNode): Readonly<{
  background: string;
  border: string;
  accent: string;
  text: string;
}> {
  switch (node.kind) {
    case "domain":
      return {
        background: "#fff35c",
        border: "#1a1a1a",
        accent: "#155eef",
        text: "#0f172a",
      };
    case "topic":
      return {
        background: "#f3e4a0",
        border: "#1f1f1f",
        accent: "#155eef",
        text: "#0f172a",
      };
    case "technology":
      return {
        background: "#efe5c7",
        border: "#232323",
        accent: "#155eef",
        text: "#0f172a",
      };
    case "concept":
      return {
        background: "#f5ebc8",
        border: "#262626",
        accent: "#155eef",
        text: "#0f172a",
      };
    default:
      return {
        background: "#f7ecd2",
        border: "#232323",
        accent: "#155eef",
        text: "#0f172a",
      };
  }
}

function InfoBadge({
  label,
  tone = "default",
}: Readonly<{
  label: string;
  tone?: "default" | "accent";
}>) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    border:
      tone === "accent"
        ? "1px solid rgba(30, 94, 255, 0.20)"
        : "1px solid rgba(15, 23, 42, 0.08)",
    background:
      tone === "accent" ? "rgba(30, 94, 255, 0.08)" : "rgba(255,255,255,0.88)",
    color: tone === "accent" ? "#15308f" : "#0f172a",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return <span style={style}>{label}</span>;
}

function RoadMapMobileNodeCardComponent({
  node,
  isActive = false,
  isHovered = false,
  onSelect,
  onHover,
}: RoadMapMobileNodeCardProps) {
  const palette = useMemo(() => getCardPalette(node), [node]);

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "12px",
      width: "100%",
      padding: node.kind === "concept" ? "14px" : "16px",
      borderRadius: "20px",
      border: isActive
        ? `2px solid ${palette.accent}`
        : `2px solid ${palette.border}`,
      background: palette.background,
      color: palette.text,
      boxShadow: isActive
        ? "0 0 0 4px rgba(30, 94, 255, 0.10), 0 16px 36px rgba(15, 23, 42, 0.10)"
        : isHovered
          ? "0 14px 30px rgba(15, 23, 42, 0.09)"
          : "0 10px 24px rgba(15, 23, 42, 0.08)",
      textAlign: "left",
      cursor: "pointer",
      transition:
        "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      transform: isActive ? "scale(1.01)" : isHovered ? "scale(1.005)" : "scale(1)",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [isActive, isHovered, node.kind, palette],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#0f172a",
      fontSize: node.kind === "domain" ? "1rem" : "0.95rem",
      fontWeight: node.kind === "domain" ? 900 : 800,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    }),
    [node.kind],
  );

  const descriptionStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#334155",
      fontSize: "0.88rem",
      lineHeight: 1.55,
    }),
    [],
  );

  const rowStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    }),
    [],
  );

  const summaryText = node.details?.summary ?? node.description;
  const marketSignals = node.marketSignals ?? [];

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={node.label}
      title={node.label}
      style={wrapperStyle}
      onClick={() => onSelect?.(node.id)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={titleStyle}>{node.label}</h3>

        <div style={rowStyle}>
          <InfoBadge label={ROADMAP_KIND_LABELS[node.kind]} />
          <InfoBadge label={ROADMAP_DEMAND_LABELS[node.demand]} tone="accent" />
          {typeof node.difficulty === "number" ? (
            <InfoBadge label={`Dificuldade ${node.difficulty}/5`} />
          ) : null}
        </div>

        {summaryText ? <p style={descriptionStyle}>{summaryText}</p> : null}
      </div>

      {marketSignals.length > 0 ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <span
            style={{
              color: "#475569",
              fontSize: "0.72rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Mercado
          </span>

          <div style={rowStyle}>
            {marketSignals.map((signal) => (
              <InfoBadge
                key={signal}
                label={ROADMAP_MARKET_SIGNAL_LABELS[signal]}
              />
            ))}
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default memo(RoadMapMobileNodeCardComponent);
