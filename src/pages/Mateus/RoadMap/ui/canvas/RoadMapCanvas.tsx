import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

import type { RoadMapLayoutViewport } from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import RoadMapClusterView from "./RoadMapCluster";
import RoadMapEdgeView from "./RoadMapEdge";
import RoadMapNodeView from "./RoadMapNode";
import {
  getCanvasSize,
  resolveAnchorCenter,
  resolveInitialAnchorNode,
} from "./RoadMapCanvas.layout";

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
  initialAnchorNodeId?: string | null;
}>;

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
  emptyTitle = "Roadmap indisponível",
  emptyDescription = "Nenhum item foi encontrado para esta visualização.",
  initialAnchorNodeId = null,
}: RoadMapCanvasProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const canvasSize = useMemo(
    () => getCanvasSize(nodes, positionKey, minHeight),
    [nodes, positionKey, minHeight],
  );

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const anchorNode = useMemo(
    () => resolveInitialAnchorNode(nodes, initialAnchorNodeId),
    [initialAnchorNodeId, nodes],
  );

  const anchor = useMemo(
    () => resolveAnchorCenter(anchorNode, positionKey),
    [anchorNode, positionKey],
  );

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || !anchor) {
      return;
    }

    const nextLeft = Math.max(
      0,
      anchor.centerX - scroller.clientWidth / 2,
    );

    scroller.scrollLeft = nextLeft;
  }, [anchor, canvasSize.width]);

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "12px",
      width: "100%",
      minWidth: 0,
    }),
    [],
  );

  const scrollerStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      overscrollBehaviorX: "contain",
      overscrollBehaviorY: "none",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "thin",
      minHeight,
      paddingBottom: positionKey === "mobile" ? "10px" : "14px",
    }),
    [minHeight, positionKey],
  );

  const stageStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: canvasSize.width,
      height: canvasSize.height,
      minHeight,
      overflow: "hidden",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
    }),
    [canvasSize.height, canvasSize.width, minHeight],
  );

  const svgStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      overflow: "visible",
      pointerEvents: "none",
    }),
    [],
  );

  const emptyStateStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      placeItems: "center",
      minHeight,
      width: "100%",
    }),
    [minHeight],
  );

  const emptyCardStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "10px",
      width: "min(100%, 480px)",
      padding: "28px 22px",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
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
        <div style={emptyStateStyle}>
          <section style={emptyCardStyle}>
            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
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
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <div ref={scrollerRef} style={scrollerStyle}>
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
