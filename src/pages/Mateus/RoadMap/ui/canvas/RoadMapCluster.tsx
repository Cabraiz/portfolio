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
  isDimmed?: boolean;
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

function getClusterBounds(
  clusterNodes: readonly RoadMapNode[],
  positionKey: RoadMapCanvasPositionKey,
) {
  const paddingX = 24;
  const paddingTop = 42;
  const paddingBottom = 20;

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
  const minY = Math.min(...positioned.map((entry) => entry.y)) - paddingTop;
  const maxRight = Math.max(...positioned.map((entry) => entry.right)) + paddingX;
  const maxBottom = Math.max(...positioned.map((entry) => entry.bottom)) + paddingBottom;

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
  isDimmed = false,
}: RoadMapClusterProps) {
  const clusterNodeIdSet = useMemo(() => new Set(cluster.nodeIds), [cluster.nodeIds]);

  const clusterNodes = useMemo(
    () => nodes.filter((node) => clusterNodeIdSet.has(node.id)),
    [clusterNodeIdSet, nodes],
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
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "rgba(255, 255, 255, 0.42)",
    opacity: isDimmed ? 0.28 : 1,
    pointerEvents: "none",
    zIndex: 1,
  };

  const titleStyle: CSSProperties = {
    position: "absolute",
    top: "12px",
    left: "14px",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "24px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#ffffff",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    color: "#334155",
    fontSize: "0.68rem",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
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
