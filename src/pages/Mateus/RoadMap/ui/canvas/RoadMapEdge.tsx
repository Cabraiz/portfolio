import { memo, useMemo } from "react";

import type {
  RoadMapEdge as RoadMapEdgeModel,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import {
  ROADMAP_EDGE_OPACITY,
  getRoadMapEdgeStyle,
} from "./roadmapEdge.tokens";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

type TreeMetaNode = RoadMapNode &
  Readonly<{
    parentId?: string | null;
    tier?: number | null;
  }>;

type RoadMapEdgeProps = Readonly<{
  edge: RoadMapEdgeModel;
  fromNode: RoadMapNode;
  toNode: RoadMapNode;
  positionKey?: RoadMapCanvasPositionKey;
  isDimmed?: boolean;
}>;

type NodeBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type AnchorPoint = Readonly<{
  x: number;
  y: number;
}>;

type HorizontalBranchSide = "left" | "right";

function asTreeMetaNode(node: RoadMapNode): TreeMetaNode {
  return node as TreeMetaNode;
}

function getNodeTier(node: RoadMapNode): number | null {
  const tier = asTreeMetaNode(node).tier;
  return typeof tier === "number" && Number.isFinite(tier) ? tier : null;
}

function getParentId(node: RoadMapNode): string | null {
  const parentId = asTreeMetaNode(node).parentId;
  return typeof parentId === "string" && parentId.length > 0 ? parentId : null;
}

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

function getNodeBox(
  node: RoadMapNode,
  positionKey: RoadMapCanvasPositionKey,
): NodeBox {
  const position =
    node[positionKey] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };
  const dimensions = getNodeDimensions(node);

  return {
    x: position.x,
    y: position.y,
    width: dimensions.width,
    height: dimensions.height,
  };
}

function getVerticalAnchors(
  from: NodeBox,
  to: NodeBox,
): {
  fromPoint: AnchorPoint;
  toPoint: AnchorPoint;
} {
  return {
    fromPoint: {
      x: from.x + from.width / 2,
      y: from.y + from.height,
    },
    toPoint: {
      x: to.x + to.width / 2,
      y: to.y,
    },
  };
}

function getHorizontalAnchors(
  from: NodeBox,
  to: NodeBox,
): {
  fromPoint: AnchorPoint;
  toPoint: AnchorPoint;
} {
  const isLeftToRight = from.x <= to.x;

  return {
    fromPoint: isLeftToRight
      ? { x: from.x + from.width, y: from.y + from.height / 2 }
      : { x: from.x, y: from.y + from.height / 2 },
    toPoint: isLeftToRight
      ? { x: to.x, y: to.y + to.height / 2 }
      : { x: to.x + to.width, y: to.y + to.height / 2 },
  };
}

function getInheritedSideAnchors(
  side: HorizontalBranchSide,
  from: NodeBox,
  to: NodeBox,
): {
  fromPoint: AnchorPoint;
  toPoint: AnchorPoint;
} {
  if (side === "left") {
    return {
      fromPoint: {
        x: from.x,
        y: from.y + from.height / 2,
      },
      toPoint: {
        x: to.x + to.width,
        y: to.y + to.height / 2,
      },
    };
  }

  return {
    fromPoint: {
      x: from.x + from.width,
      y: from.y + from.height / 2,
    },
    toPoint: {
      x: to.x,
      y: to.y + to.height / 2,
    },
  };
}

function buildVerticalPath(fromPoint: AnchorPoint, toPoint: AnchorPoint): string {
  const deltaY = Math.max(
    30,
    Math.min(88, Math.abs(toPoint.y - fromPoint.y) * 0.28),
  );

  return [
    `M ${fromPoint.x} ${fromPoint.y}`,
    `C ${fromPoint.x} ${fromPoint.y + deltaY},`,
    `${toPoint.x} ${toPoint.y - deltaY},`,
    `${toPoint.x} ${toPoint.y}`,
  ].join(" ");
}

function buildHorizontalPath(
  fromPoint: AnchorPoint,
  toPoint: AnchorPoint,
): string {
  const isLeftToRight = fromPoint.x <= toPoint.x;
  const deltaX = Math.max(
    36,
    Math.min(104, Math.abs(toPoint.x - fromPoint.x) * 0.3),
  );

  return [
    `M ${fromPoint.x} ${fromPoint.y}`,
    `C ${fromPoint.x + (isLeftToRight ? deltaX : -deltaX)} ${fromPoint.y},`,
    `${toPoint.x - (isLeftToRight ? deltaX : -deltaX)} ${toPoint.y},`,
    `${toPoint.x} ${toPoint.y}`,
  ].join(" ");
}

function resolveBranchSide(
  from: NodeBox,
  to: NodeBox,
): HorizontalBranchSide | null {
  const fromCenterX = from.x + from.width / 2;
  const toCenterX = to.x + to.width / 2;
  const deltaX = toCenterX - fromCenterX;

  if (deltaX <= -16) {
    return "left";
  }

  if (deltaX >= 16) {
    return "right";
  }

  return null;
}

function isHierarchyEdge(fromNode: RoadMapNode, toNode: RoadMapNode): boolean {
  return (
    getParentId(toNode) === fromNode.id ||
    getParentId(fromNode) === toNode.id
  );
}

function shouldUseInheritedSideAnchors(
  fromNode: RoadMapNode,
  toNode: RoadMapNode,
  from: NodeBox,
  to: NodeBox,
  preferredSide: HorizontalBranchSide | null,
): preferredSide is HorizontalBranchSide {
  if (!preferredSide) {
    return false;
  }

  if (!isHierarchyEdge(fromNode, toNode)) {
    return false;
  }

  const fromTier = getNodeTier(fromNode);
  const toTier = getNodeTier(toNode);

  const isDeepBranch =
    (fromTier !== null && fromTier >= 2) ||
    (toTier !== null && toTier >= 3);

  if (!isDeepBranch) {
    return false;
  }

  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;

  const horizontalDistance = Math.abs(toCenterX - fromCenterX);
  const verticalDistance = Math.abs(toCenterY - fromCenterY);

  return horizontalDistance >= Math.max(56, verticalDistance * 0.6);
}

function buildPath(
  fromNode: RoadMapNode,
  toNode: RoadMapNode,
  from: NodeBox,
  to: NodeBox,
): string {
  const preferredSide = resolveBranchSide(from, to);

  if (
    shouldUseInheritedSideAnchors(
      fromNode,
      toNode,
      from,
      to,
      preferredSide,
    )
  ) {
    const { fromPoint, toPoint } = getInheritedSideAnchors(
      preferredSide,
      from,
      to,
    );

    return buildHorizontalPath(fromPoint, toPoint);
  }

  const fromCenterY = from.y + from.height / 2;
  const toCenterY = to.y + to.height / 2;
  const verticalFlow = toCenterY >= fromCenterY - 12;

  if (verticalFlow) {
    const { fromPoint, toPoint } = getVerticalAnchors(from, to);
    return buildVerticalPath(fromPoint, toPoint);
  }

  const { fromPoint, toPoint } = getHorizontalAnchors(from, to);
  return buildHorizontalPath(fromPoint, toPoint);
}

function getMidPoint(
  fromNode: RoadMapNode,
  toNode: RoadMapNode,
  from: NodeBox,
  to: NodeBox,
) {
  const preferredSide = resolveBranchSide(from, to);

  if (
    shouldUseInheritedSideAnchors(
      fromNode,
      toNode,
      from,
      to,
      preferredSide,
    )
  ) {
    const { fromPoint, toPoint } = getInheritedSideAnchors(
      preferredSide,
      from,
      to,
    );

    return {
      x: fromPoint.x + (toPoint.x - fromPoint.x) / 2,
      y: fromPoint.y + (toPoint.y - fromPoint.y) / 2 - 12,
    };
  }

  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const verticalFlow = toCenterY >= fromCenterY - 12;

  return {
    x: fromCenterX + (toCenterX - fromCenterX) / 2,
    y:
      fromCenterY +
      (toCenterY - fromCenterY) / 2 +
      (verticalFlow ? -10 : -12),
  };
}

function getLabelWidth(label: string): number {
  return Math.min(112, Math.max(48, label.length * 6 + 14));
}

function RoadMapEdgeComponent({
  edge,
  fromNode,
  toNode,
  positionKey = "desktop",
  isDimmed = false,
}: RoadMapEdgeProps) {
  const fromBox = useMemo(
    () => getNodeBox(fromNode, positionKey),
    [fromNode, positionKey],
  );
  const toBox = useMemo(
    () => getNodeBox(toNode, positionKey),
    [toNode, positionKey],
  );

  const path = useMemo(
    () => buildPath(fromNode, toNode, fromBox, toBox),
    [fromNode, toNode, fromBox, toBox],
  );
  const midPoint = useMemo(
    () => getMidPoint(fromNode, toNode, fromBox, toBox),
    [fromNode, toNode, fromBox, toBox],
  );
  const style = useMemo(() => getRoadMapEdgeStyle(edge.type), [edge.type]);

  const pathOpacity = isDimmed
    ? ROADMAP_EDGE_OPACITY.dimmedOpacity
    : ROADMAP_EDGE_OPACITY.defaultOpacity;

  const label = edge.label?.trim();
  const shouldRenderLabel = Boolean(label) && edge.type !== "contains";
  const labelWidth = label ? getLabelWidth(label) : 0;

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <path
        d={path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={pathOpacity}
        strokeLinecap="round"
      />

      {shouldRenderLabel && label ? (
        <>
          <rect
            x={midPoint.x - labelWidth / 2}
            y={midPoint.y - 9}
            width={labelWidth}
            height={18}
            rx={9}
            fill="rgba(255,255,255,0.96)"
            stroke="rgba(148, 163, 184, 0.22)"
            opacity={0.98}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#334155"
            opacity={0.94}
            style={{
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {label}
          </text>
        </>
      ) : null}
    </g>
  );
}

export default memo(RoadMapEdgeComponent);
