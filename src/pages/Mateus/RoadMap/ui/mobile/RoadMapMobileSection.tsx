import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapNode } from "../../domain/model/roadmap.types";
import RoadMapMobileNodeCard from "./RoadMapMobileNodeCard";

type RoadMapMobileSectionProps = Readonly<{
  title: string;
  description?: string;
  nodes: readonly RoadMapNode[];
  activeNodeId?: string | null;
  hoveredNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}>;

function RoadMapMobileSectionComponent({
  title,
  description,
  nodes,
  activeNodeId = null,
  hoveredNodeId = null,
  onNodeSelect,
  onNodeHover,
}: RoadMapMobileSectionProps) {
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
    [],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#0f172a",
      fontSize: "1rem",
      fontWeight: 900,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const descriptionStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#475569",
      fontSize: "0.88rem",
      lineHeight: 1.55,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const listStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "12px",
    }),
    [],
  );

  if (nodes.length === 0) {
    return null;
  }

  return (
    <section style={wrapperStyle}>
      <div style={{ display: "grid", gap: "8px" }}>
        <h2 style={titleStyle}>{title}</h2>
        {description ? <p style={descriptionStyle}>{description}</p> : null}
      </div>

      <div style={listStyle}>
        {nodes.map((node) => (
          <RoadMapMobileNodeCard
            key={node.id}
            node={node}
            isActive={activeNodeId === node.id}
            isHovered={hoveredNodeId === node.id}
            onSelect={onNodeSelect}
            onHover={onNodeHover}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(RoadMapMobileSectionComponent);
