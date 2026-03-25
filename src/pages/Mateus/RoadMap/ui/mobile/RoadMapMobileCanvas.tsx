import { memo, useMemo, type CSSProperties } from "react";

import {
  ROADMAP_CATEGORY_IDS,
  ROADMAP_CATEGORY_LABELS,
} from "../../domain/model/roadmap.constants";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import RoadMapMobileSection from "./RoadMapMobileSection";

type RoadMapMobileCanvasProps = Readonly<{
  nodes: readonly RoadMapNode[];
  edges?: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
  activeNodeId?: string | null;
  hoveredNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}>;

type SectionEntry = Readonly<{
  id: string;
  title: string;
  description?: string;
  nodes: readonly RoadMapNode[];
}>;

function buildSections(
  nodes: readonly RoadMapNode[],
  clusters: readonly RoadMapCluster[],
): SectionEntry[] {
  if (clusters.length > 0) {
    const clusterSections = clusters
      .map((cluster) => ({
        id: cluster.id,
        title: cluster.label,
        description: cluster.description,
        nodes: nodes.filter((node) => cluster.nodeIds.includes(node.id)),
      }))
      .filter((section) => section.nodes.length > 0);

    if (clusterSections.length > 0) {
      return clusterSections;
    }
  }

  return ROADMAP_CATEGORY_IDS.map((category) => ({
    id: category,
    title: ROADMAP_CATEGORY_LABELS[category],
    nodes: nodes.filter((node) => node.category === category),
  })).filter((section) => section.nodes.length > 0);
}

function RoadMapMobileCanvasComponent({
  nodes,
  edges = [],
  clusters = [],
  activeNodeId = null,
  hoveredNodeId = null,
  onNodeSelect,
  onNodeHover,
  className,
  emptyTitle = "Roadmap indisponível",
  emptyDescription = "Nenhum item foi encontrado para esta visualização mobile.",
}: RoadMapMobileCanvasProps) {
  const sections = useMemo(
    () => buildSections(nodes, clusters),
    [nodes, clusters],
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "14px",
      width: "100%",
    }),
    [],
  );

  const summaryStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
    }),
    [],
  );

  const badgeStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "30px",
      padding: "0 10px",
      borderRadius: "999px",
      border: "1px solid rgba(15, 23, 42, 0.08)",
      background: "#ffffff",
      color: "#0f172a",
      fontSize: "0.72rem",
      fontWeight: 800,
      lineHeight: 1,
      boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const emptyStateStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "8px",
      padding: "24px 18px",
      borderRadius: "24px",
      border: "1px solid rgba(30, 94, 255, 0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow:
        "0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
      textAlign: "center",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  if (nodes.length === 0) {
    return (
      <div className={className} style={wrapperStyle}>
        <section style={emptyStateStyle}>
          <h3
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "1rem",
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            {emptyTitle}
          </h3>

          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "0.92rem",
              lineHeight: 1.6,
            }}
          >
            {emptyDescription}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <div style={summaryStyle}>
        <span style={badgeStyle}>{nodes.length} nós visíveis</span>
        <span style={badgeStyle}>{edges.length} relações visíveis</span>
        <span style={badgeStyle}>{sections.length} seções</span>
      </div>

      {sections.map((section) => (
        <RoadMapMobileSection
          key={section.id}
          title={section.title}
          description={section.description}
          nodes={section.nodes}
          activeNodeId={activeNodeId}
          hoveredNodeId={hoveredNodeId}
          onNodeSelect={onNodeSelect}
          onNodeHover={onNodeHover}
        />
      ))}
    </div>
  );
}

export default memo(RoadMapMobileCanvasComponent);
