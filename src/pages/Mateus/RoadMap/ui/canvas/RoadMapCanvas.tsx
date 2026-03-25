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
      return { width: 260, height: 84 };
    case "topic":
      return { width: 224, height: 60 };
    case "technology":
      return { width: 208, height: 56 };
    case "concept":
      return { width: 176, height: 42 };
    default:
      return { width: 208, height: 56 };
  }
}

function getCanvasSize(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapCanvasPositionKey,
  minHeight: number,
) {
  if (nodes.length === 0) {
    return {
      width: positionKey === "mobile" ? 380 : 1120,
      height: minHeight,
    };
  }

  const paddingRight = positionKey === "mobile" ? 36 : 120;
  const paddingBottom = 140;
  const minWidth = positionKey === "mobile" ? 380 : 1120;

  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    const position =
      node[positionKey] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };
    const dimensions = getNodeDimensions(node);

    maxX = Math.max(maxX, position.x + dimensions.width);
    maxY = Math.max(maxY, position.y + dimensions.height);
  }

  return {
    width: Math.max(minWidth, maxX + paddingRight),
    height: Math.max(minHeight, maxY + paddingBottom),
  };
}

function createConnectedNodeIdSet(
  spotlightNodeId: string | null,
  edges: readonly RoadMapEdge[],
): ReadonlySet<string> | null {
  if (!spotlightNodeId) {
    return null;
  }

  const relatedNodeIds = new Set<string>([spotlightNodeId]);

  for (const edge of edges) {
    if (edge.from === spotlightNodeId || edge.to === spotlightNodeId) {
      relatedNodeIds.add(edge.from);
      relatedNodeIds.add(edge.to);
    }
  }

  return relatedNodeIds;
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
  emptyDescription = "Nenhuma tecnologia foi encontrada para esta visualização.",
}: RoadMapCanvasProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const canvasSize = useMemo(
    () => getCanvasSize(nodes, positionKey, minHeight),
    [nodes, positionKey, minHeight],
  );

  const spotlightNodeId = hoveredNodeId ?? activeNodeId ?? null;

  const spotlightNodeIds = useMemo(
    () => createConnectedNodeIdSet(spotlightNodeId, edges),
    [spotlightNodeId, edges],
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "#ffffff",
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
      padding: 0,
      backgroundColor: "#f8fafc",
      backgroundImage: `
        linear-gradient(rgba(148, 163, 184, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.035) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      backgroundPosition: "0 0",
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
      padding: "32px 24px",
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
                fontSize: "1rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {emptyTitle}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.92rem",
                lineHeight: 1.55,
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
        {clusters.map((cluster) => {
          const isDimmed =
            Boolean(spotlightNodeIds) &&
            !cluster.nodeIds.some((nodeId) => spotlightNodeIds?.has(nodeId));

          return (
            <RoadMapClusterView
              key={cluster.id}
              cluster={cluster}
              nodes={nodes}
              positionKey={positionKey}
              isDimmed={isDimmed}
            />
          );
        })}

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
              Boolean(spotlightNodeId) &&
              edge.from !== spotlightNodeId &&
              edge.to !== spotlightNodeId;

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

        {nodes.map((node) => {
          const isDimmed =
            Boolean(spotlightNodeIds) && !spotlightNodeIds?.has(node.id);

          return (
            <RoadMapNodeView
              key={node.id}
              node={node}
              positionKey={positionKey}
              isActive={activeNodeId === node.id}
              isHovered={hoveredNodeId === node.id}
              isDimmed={isDimmed}
              onSelect={onNodeSelect}
              onHover={onNodeHover}
            />
          );
        })}
      </div>
    </div>
  );
}

export default memo(RoadMapCanvasComponent);
