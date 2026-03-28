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

function createSpotlightNodeIdSet(
  spotlightNodeId: string | null,
  edges: readonly RoadMapEdge[],
): ReadonlySet<string> {
  if (!spotlightNodeId) {
    return new Set<string>();
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

  const spotlightNodeId = hoveredNodeId ?? activeNodeId ?? null;
  const hasSpotlight = spotlightNodeId !== null;

  const spotlightNodeIds = useMemo(
    () => createSpotlightNodeIdSet(spotlightNodeId, edges),
    [spotlightNodeId, edges],
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
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
      backgroundImage:
        positionKey === "mobile"
          ? "none"
          : `
              linear-gradient(rgba(15, 23, 42, 0.028) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15, 23, 42, 0.028) 1px, transparent 1px)
            `,
      backgroundSize: positionKey === "mobile" ? undefined : "44px 44px",
      backgroundPosition: "0 0",
      boxSizing: "border-box",
    }),
    [canvasSize.height, canvasSize.width, positionKey],
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

  const drawableEdges = useMemo(
    () => edges.filter((edge) => nodeMap.has(edge.from) && nodeMap.has(edge.to)),
    [edges, nodeMap],
  );

  if (nodes.length === 0) {
    return (
      <div className={className} style={wrapperStyle}>
        <div style={emptyStateStyle}>
          <div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {emptyTitle}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
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
            hasSpotlight &&
            !cluster.nodeIds.some((nodeId) => spotlightNodeIds.has(nodeId));

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
          {drawableEdges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);

            if (!fromNode || !toNode) {
              return null;
            }

            const isDimmed =
              hasSpotlight &&
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
          const isDimmed = hasSpotlight && !spotlightNodeIds.has(node.id);

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
