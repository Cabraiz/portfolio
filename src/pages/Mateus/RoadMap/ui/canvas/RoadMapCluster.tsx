import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapLayoutViewport } from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapCluster as RoadMapClusterModel,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import {
  getRoadMapNodeDimensions,
  getRoadMapNodePosition,
} from "../../application/services/resolveRoadMapNodeCollisions";

type RoadMapClusterProps = Readonly<{
  cluster: RoadMapClusterModel;
  nodes: readonly RoadMapNode[];
  positionKey?: RoadMapLayoutViewport;
  isDimmed?: boolean;
}>;

function getClusterBounds(
  clusterNodes: readonly RoadMapNode[],
  positionKey: RoadMapLayoutViewport,
) {
  const paddingX = positionKey === "mobile" ? 14 : 20;
  const paddingTop = positionKey === "mobile" ? 28 : 30;
  const paddingBottom = positionKey === "mobile" ? 14 : 18;

  const positionedNodes = clusterNodes
    .map((node) => {
      const position = getRoadMapNodePosition(node, positionKey);
      const dimensions = getRoadMapNodeDimensions(node);

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

  if (positionedNodes.length === 0) {
    return null;
  }

  const minX = Math.min(...positionedNodes.map((entry) => entry.x)) - paddingX;
  const minY = Math.min(...positionedNodes.map((entry) => entry.y)) - paddingTop;
  const maxRight =
    Math.max(...positionedNodes.map((entry) => entry.right)) + paddingX;
  const maxBottom =
    Math.max(...positionedNodes.map((entry) => entry.bottom)) + paddingBottom;

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
    borderRadius: "24px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(248,250,252,0.36) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.38)",
    opacity: isDimmed ? 0.2 : 1,
    pointerEvents: "none",
    zIndex: 1,
    boxSizing: "border-box",
  };

  const titleStyle: CSSProperties = {
    position: "absolute",
    top: "10px",
    left: "12px",
    display: "inline-flex",
    alignItems: "center",
    maxWidth: "calc(100% - 24px)",
    minHeight: "22px",
    padding: "0 8px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.84)",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    color: "#475569",
    fontSize: "0.64rem",
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxSizing: "border-box",
  };

  return (
    <div aria-hidden="true" style={wrapperStyle}>
      <div style={titleStyle}>{cluster.label}</div>
    </div>
  );
}

export default memo(RoadMapClusterComponent);
