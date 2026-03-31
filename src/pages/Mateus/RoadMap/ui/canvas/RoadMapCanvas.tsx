import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapLayoutViewport } from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import {
  getRoadMapNodeDimensions,
  getRoadMapNodePosition,
} from "../../application/services/resolveRoadMapNodeCollisions";
import RoadMapClusterView from "./RoadMapCluster";
import RoadMapEdgeView from "./RoadMapEdge";
import RoadMapNodeView from "./RoadMapNode";

type RoadMapCanvasProps = Readonly<{
  nodes: readonly RoadMapNode[];
  edges: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
  positionKey?: RoadMapLayoutViewport;
  activeNodeId?: string | null;
  hoveredNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  className?: string;
  minHeight?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}>;

type RoadMapCanvasBounds = Readonly<{
  minX: number;
  minY: number;
  maxRight: number;
  maxBottom: number;
}>;

function getCanvasNodeBounds(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapLayoutViewport,
): RoadMapCanvasBounds | null {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxRight = Number.NEGATIVE_INFINITY;
  let maxBottom = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const position = getRoadMapNodePosition(node, positionKey);
    const dimensions = getRoadMapNodeDimensions(node);

    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxRight = Math.max(maxRight, position.x + dimensions.width);
    maxBottom = Math.max(maxBottom, position.y + dimensions.height);
  }

  return {
    minX,
    minY,
    maxRight,
    maxBottom,
  };
}

function getCanvasSize(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapLayoutViewport,
  minHeight: number,
): { width: number; height: number } {
  const bounds = getCanvasNodeBounds(nodes, positionKey);

  if (!bounds) {
    return {
      width: positionKey === "mobile" ? 360 : 1120,
      height: minHeight,
    };
  }

  const paddingLeft = positionKey === "mobile" ? 20 : 28;
  const paddingRight = positionKey === "mobile" ? 28 : 120;
  const paddingTop = positionKey === "mobile" ? 24 : 28;
  const paddingBottom = positionKey === "mobile" ? 80 : 120;
  const minWidth = positionKey === "mobile" ? 360 : 1120;

  const contentWidth = Math.max(0, bounds.maxRight - bounds.minX);
  const contentHeight = Math.max(0, bounds.maxBottom - bounds.minY);

  return {
    width: Math.max(minWidth, contentWidth + paddingLeft + paddingRight),
    height: Math.max(minHeight, contentHeight + paddingTop + paddingBottom),
  };
}

function RoadMapCanvasComponent({
  nodes,
  edges,
  clusters = [],
  positionKey = "desktop",
  activeNodeId = null,
  hoveredNodeId = null,
  onNodeSelect,
  onNodeHover,
  className,
  minHeight = 920,
  emptyTitle = "Mapa indisponível",
  emptyDescription = "Nenhum item foi encontrado para esta visualização.",
}: RoadMapCanvasProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const canvasSize = useMemo(
    () => getCanvasSize(nodes, positionKey, minHeight),
    [nodes, positionKey, minHeight],
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflow: "hidden",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
    }),
    [],
  );

  const summaryStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      alignItems: "center",
      padding: "16px 18px 0 18px",
    }),
    [],
  );

  const badgeStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "30px",
      padding: "0 12px",
      borderRadius: "999px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "rgba(255,255,255,0.8)",
      color: "#334155",
      fontSize: "0.75rem",
      fontWeight: 700,
      lineHeight: 1,
      whiteSpace: "nowrap",
      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const scrollerStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      padding: "16px 0 0 0",
      scrollbarWidth: "thin",
    }),
    [],
  );

  const stageStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: `${canvasSize.width}px`,
      minWidth: `${canvasSize.width}px`,
      height: `${canvasSize.height}px`,
      minHeight: `${canvasSize.height}px`,
      backgroundColor: "#f8fafc",
      backgroundImage:
        "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      backgroundSize: positionKey === "mobile" ? "24px 24px" : "32px 32px",
      backgroundPosition: "0 0",
    }),
    [canvasSize.height, canvasSize.width, positionKey],
  );

  const svgStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      width: `${canvasSize.width}px`,
      height: `${canvasSize.height}px`,
      overflow: "visible",
      pointerEvents: "none",
    }),
    [canvasSize.height, canvasSize.width],
  );

  const emptyStateShellStyle = useMemo<CSSProperties>(
    () => ({
      padding: "24px",
    }),
    [],
  );

  const emptyStateStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      placeItems: "center",
      minHeight: `${Math.max(320, minHeight)}px`,
      padding: "32px",
      textAlign: "center",
    }),
    [minHeight],
  );

  const emptyCardStyle = useMemo<CSSProperties>(
    () => ({
      maxWidth: "520px",
      padding: "28px 24px",
      borderRadius: "22px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      background: "rgba(255,255,255,0.84)",
      boxShadow: "0 18px 36px rgba(15, 23, 42, 0.04)",
    }),
    [],
  );

  if (nodes.length === 0) {
    return (
      <div className={className} style={wrapperStyle}>
        <div style={emptyStateShellStyle}>
          <section style={emptyStateStyle}>
            <div style={emptyCardStyle}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  color: "#0f172a",
                  fontSize: "1.1rem",
                  lineHeight: 1.2,
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
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <div style={summaryStyle}>
        <span style={badgeStyle}>{nodes.length} nós visíveis</span>
        <span style={badgeStyle}>{edges.length} relações visíveis</span>
        <span style={badgeStyle}>{clusters.length} agrupamentos</span>
      </div>

      <div style={scrollerStyle}>
        <div style={stageStyle}>
          <svg
            width={canvasSize.width}
            height={canvasSize.height}
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            aria-hidden="true"
            focusable="false"
            style={svgStyle}
          >
            {clusters.map((cluster) => (
              <RoadMapClusterView
                key={cluster.id}
                cluster={cluster}
                nodes={nodes}
                positionKey={positionKey}
                isDimmed={false}
              />
            ))}

            {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);

              if (!fromNode || !toNode) {
                return null;
              }

              return (
                <RoadMapEdgeView
                  key={`${edge.from}:${edge.to}:${edge.type}:${edge.label ?? ""}`}
                  edge={edge}
                  fromNode={fromNode}
                  toNode={toNode}
                  positionKey={positionKey}
                  isDimmed={false}
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <RoadMapNodeView
              key={node.id}
              node={node}
              positionKey={positionKey}
              isActive={activeNodeId === node.id}
              isHovered={hoveredNodeId === node.id}
              isDimmed={false}
              onSelect={onNodeSelect}
              onHover={onNodeHover}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(RoadMapCanvasComponent);
