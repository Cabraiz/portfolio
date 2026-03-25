import { memo, useMemo, type CSSProperties } from "react";

import type {
  RoadMapCluster as RoadMapClusterModel,
  RoadMapNode,
} from "../../domain/model/roadmap.types";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

type RoadMapClusterProps = Readonly<{
  cluster: RoadMapClusterModel;
  nodes: readonly RoadMapNode[];
  positionKey?: RoadMapCanvasPositionKey;
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

function getClusterBounds(
  clusterNodes: readonly RoadMapNode[],
  positionKey: RoadMapCanvasPositionKey,
) {
  const paddingX = 28;
  const paddingY = 24;
  const headerOffsetY = 34;

  const positioned = clusterNodes
    .map((node) => {
      const position = node[positionKey] ?? node.desktop ?? node.mobile;
      if (!position) {
        return null;
      }

      const dimensions = getNodeDimensions(node);

      return {
        x: position.x,
        y: position.y,
        right: position.x + dimensions.width,
        bottom: position.y + dimensions.height,
      };
    })
    .filter(
      (
        entry,
      ): entry is { x: number; y: number; right: number; bottom: number } =>
        Boolean(entry),
    );

  if (positioned.length === 0) {
    return null;
  }

  const minX = Math.min(...positioned.map((entry) => entry.x)) - paddingX;
  const minY = Math.min(...positioned.map((entry) => entry.y)) - paddingY - headerOffsetY;
  const maxRight = Math.max(...positioned.map((entry) => entry.right)) + paddingX;
  const maxBottom = Math.max(...positioned.map((entry) => entry.bottom)) + paddingY;

  return {
    x: minX,
    y: minY,
    width: maxRight - minX,
    height: maxBottom - minY,
  };
}

function RoadMapClusterComponent({
  cluster,
  nodes,
  positionKey = "desktop",
}: RoadMapClusterProps) {
  const clusterNodes = useMemo(
    () => nodes.filter((node) => cluster.nodeIds.includes(node.id)),
    [cluster.nodeIds, nodes],
  );

  const bounds = useMemo(
    () => getClusterBounds(clusterNodes, positionKey),
    [clusterNodes, positionKey],
  );

  if (!bounds) {
    return null;
  }

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    borderRadius: "18px",
    border: "1px solid rgba(30, 94, 255, 0.18)",
    background:
      "linear-gradient(180deg, rgba(30, 94, 255, 0.06) 0%, rgba(30, 94, 255, 0.02) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
    pointerEvents: "none",
    zIndex: 1,
  };

  const titleStyle: CSSProperties = {
    position: "absolute",
    top: "10px",
    left: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(30, 94, 255, 0.12)",
    color: "#15308f",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "0.01em",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return (
    <div aria-hidden="true" style={wrapperStyle}>
      <div style={titleStyle}>{cluster.label}</div>
    </div>
  );
}

export default memo(RoadMapClusterComponent);
