// src/pages/Mateus/RoadMap/ui/canvas/RoadMapEdge.tsx
import { memo, useMemo } from "react";

import type {
  RoadMapEdge as RoadMapEdgeModel,
  RoadMapNode,
} from "../../domain/model/roadmap.types";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

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

function getEdgeStyle(type: RoadMapEdgeModel["type"]): {
  strokeDasharray?: string;
  strokeWidth: number;
  stroke: string;
} {
  switch (type) {
    case "contains":
      return {
        strokeDasharray: "4 10",
        strokeWidth: 1.25,
        stroke: "rgba(100, 116, 139, 0.26)",
      };
    case "prerequisite":
      return {
        strokeWidth: 1.8,
        stroke: "rgba(37, 99, 235, 0.44)",
      };
    case "alternative":
      return {
        strokeDasharray: "7 8",
        strokeWidth: 1.4,
        stroke: "rgba(100, 116, 139, 0.32)",
      };
    case "complements":
      return {
        strokeWidth: 1.5,
        stroke: "rgba(14, 116, 144, 0.34)",
      };
    case "specializes":
      return {
        strokeDasharray: "5 8",
        strokeWidth: 1.45,
        stroke: "rgba(99, 102, 241, 0.34)",
      };
    default:
      return {
        strokeWidth: 1.45,
        stroke: "rgba(37, 99, 235, 0.34)",
      };
  }
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

function buildPath(from: NodeBox, to: NodeBox): string {
  const fromCenterY = from.y + from.height / 2;
  const toCenterY = to.y + to.height / 2;
  const verticalFlow = toCenterY >= fromCenterY - 12;

  if (verticalFlow) {
    const { fromPoint, toPoint } = getVerticalAnchors(from, to);
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

  const { fromPoint, toPoint } = getHorizontalAnchors(from, to);
  const isLeftToRight = fromPoint.x <= toPoint.x;
  const deltaX = Math.max(
    36,
    Math.min(98, Math.abs(toPoint.x - fromPoint.x) * 0.26),
  );

  return [
    `M ${fromPoint.x} ${fromPoint.y}`,
    `C ${fromPoint.x + (isLeftToRight ? deltaX : -deltaX)} ${fromPoint.y},`,
    `${toPoint.x - (isLeftToRight ? deltaX : -deltaX)} ${toPoint.y},`,
    `${toPoint.x} ${toPoint.y}`,
  ].join(" ");
}

function getMidPoint(from: NodeBox, to: NodeBox) {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const verticalFlow = toCenterY >= fromCenterY - 12;

  return {
    x: fromCenterX + (toCenterX - fromCenterX) / 2,
    y: fromCenterY + (toCenterY - fromCenterY) / 2 + (verticalFlow ? -10 : -12),
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

  const path = useMemo(() => buildPath(fromBox, toBox), [fromBox, toBox]);
  const midPoint = useMemo(() => getMidPoint(fromBox, toBox), [fromBox, toBox]);
  const style = useMemo(() => getEdgeStyle(edge.type), [edge.type]);

  const label = edge.label?.trim();
  const shouldRenderLabel =
    Boolean(label) && !isDimmed && edge.type !== "contains";
  const labelWidth = label ? getLabelWidth(label) : 0;

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <path
        d={path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={isDimmed ? 0.1 : 0.46}
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
            fill="rgba(255,255,255,0.88)"
            stroke="rgba(148, 163, 184, 0.14)"
            opacity={0.92}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#475569"
            opacity={0.78}
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
