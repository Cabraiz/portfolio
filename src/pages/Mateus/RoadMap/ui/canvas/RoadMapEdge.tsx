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

function getNodeBox(
  node: RoadMapNode,
  positionKey: RoadMapCanvasPositionKey,
): NodeBox {
  const position = node[positionKey] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };
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
        strokeDasharray: "2 6",
        strokeWidth: 2,
        stroke: "#1e5eff",
      };
    case "prerequisite":
      return {
        strokeWidth: 2.4,
        stroke: "#1e5eff",
      };
    case "alternative":
      return {
        strokeDasharray: "8 6",
        strokeWidth: 2,
        stroke: "#4a4a4a",
      };
    case "complements":
      return {
        strokeWidth: 2,
        stroke: "#155eef",
      };
    case "specializes":
      return {
        strokeDasharray: "4 6",
        strokeWidth: 2,
        stroke: "#155eef",
      };
    default:
      return {
        strokeWidth: 2,
        stroke: "#155eef",
      };
  }
}

function buildPath(from: NodeBox, to: NodeBox): string {
  const fromX = from.x + from.width;
  const fromY = from.y + from.height / 2;
  const toX = to.x;
  const toY = to.y + to.height / 2;

  const deltaX = Math.max(42, Math.abs(toX - fromX) * 0.35);

  return `M ${fromX} ${fromY} C ${fromX + deltaX} ${fromY}, ${toX - deltaX} ${toY}, ${toX} ${toY}`;
}

function getMidPoint(from: NodeBox, to: NodeBox) {
  const fromX = from.x + from.width;
  const fromY = from.y + from.height / 2;
  const toX = to.x;
  const toY = to.y + to.height / 2;

  return {
    x: fromX + (toX - fromX) / 2,
    y: fromY + (toY - fromY) / 2 - 10,
  };
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

  const opacity = isDimmed ? 0.24 : 0.8;

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <path
        d={path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={opacity}
        strokeLinecap="round"
      />

      {edge.label ? (
        <>
          <rect
            x={midPoint.x - 44}
            y={midPoint.y - 10}
            width={88}
            height={20}
            rx={10}
            fill="rgba(255,255,255,0.92)"
            opacity={isDimmed ? 0.55 : 0.92}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#1a1a1a"
            opacity={isDimmed ? 0.7 : 0.95}
            style={{
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {edge.label}
          </text>
        </>
      ) : null}
    </g>
  );
}

export default memo(RoadMapEdgeComponent);
