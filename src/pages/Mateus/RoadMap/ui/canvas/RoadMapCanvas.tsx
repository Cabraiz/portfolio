import { memo, useMemo, type CSSProperties } from "react";

import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import RoadMapClusterView from "./RoadMapCluster";
import RoadMapEdgeView from "./RoadMapEdge";
import RoadMapNodeView from "./RoadMapNode";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

type RoadMapCanvasProps = Readonly<{
  nodes: readonly RoadMapNode[];
  edges: readonly RoadMapEdge[];
  clusters?: readonly RoadMapCluster[];
  positionKey?: RoadMapCanvasPositionKey;
  activeNodeId?: string | null;
  hoveredNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  className?: string;
  minHeight?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}>;

function getNodeDimensions(node: RoadMapNode): { width: number; height: number } {
  switch (node.kind) {
    case "domain":
      return { width: 240, height: 72 };
    case "topic":
      return { width: 220, height: 64 };
    case "technology":
      return { width: 200, height: 64 };
    case "concept":
      return { width: 176, height: 52 };
    default:
      return { width: 200, height: 60 };
  }
}

function getCanvasSize(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapCanvasPositionKey,
  minHeight: number,
) {
  if (nodes.length === 0) {
    return {
      width: 960,
      height: minHeight,
    };
  }

  const paddingRight = 240;
  const paddingBottom = 180;

  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    const position = node[positionKey] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };
    const dimensions = getNodeDimensions(node);

    maxX = Math.max(maxX, position.x + dimensions.width);
    maxY = Math.max(maxY, position.y + dimensions.height);
  }

  return {
    width: Math.max(960, maxX + paddingRight),
    height: Math.max(minHeight, maxY + paddingBottom),
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
  minHeight = 840,
  emptyTitle = "Roadmap indisponível",
  emptyDescription = "Nenhum nó foi encontrado para esta visualização.",
}: RoadMapCanvasProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const canvasSize = useMemo(
    () => getCanvasSize(nodes, positionKey, minHeight),
    [nodes, positionKey, minHeight],
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      borderRadius: "24px",
      border: "1px solid rgba(30, 94, 255, 0.08)",
      background:
        "radial-gradient(circle at top left, rgba(30, 94, 255, 0.05), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
      boxShadow:
        "0 20px 60px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)",
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
      padding: "24px",
    }),
    [canvasSize.height, canvasSize.width],
  );

  const svgStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      overflow: "visible",
      zIndex: 2,
      pointerEvents: "none",
    }),
    [],
  );

  const emptyStateStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      placeItems: "center",
      minHeight: `${minHeight}px`,
      padding: "32px",
      textAlign: "center",
      color: "#334155",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [minHeight],
  );

  if (nodes.length === 0) {
    return (
      <div className={className} style={wrapperStyle}>
        <div style={emptyStateStyle}>
          <div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {emptyTitle}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                lineHeight: 1.5,
                color: "#475569",
              }}
            >
              {emptyDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <div style={stageStyle}>
        {clusters.map((cluster) => (
          <RoadMapClusterView
            key={cluster.id}
            cluster={cluster}
            nodes={nodes}
            positionKey={positionKey}
          />
        ))}

        <svg
          aria-hidden="true"
          viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
          style={svgStyle}
        >
          {edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);

            if (!fromNode || !toNode) {
              return null;
            }

            const isDimmed =
              Boolean(activeNodeId) &&
              edge.from !== activeNodeId &&
              edge.to !== activeNodeId;

            return (
              <RoadMapEdgeView
                key={edge.id}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                positionKey={positionKey}
                isDimmed={isDimmed}
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
            onSelect={onNodeSelect}
            onHover={onNodeHover}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(RoadMapCanvasComponent);
