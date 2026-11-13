import { memo, useMemo } from "react";

import type {
  RoadMapEdge as RoadMapEdgeModel,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import {
  ROADMAP_EDGE_OPACITY,
  getRoadMapEdgeStyle,
} from "./roadmapEdge.tokens";
import {
  buildPath,
  getLabelWidth,
  getMidPoint,
  getNodeBox,
  type RoadMapCanvasPositionKey,
} from "./RoadMapEdge.geometry";

type RoadMapEdgeProps = Readonly<{
  edge: RoadMapEdgeModel;
  fromNode: RoadMapNode;
  toNode: RoadMapNode;
  positionKey?: RoadMapCanvasPositionKey;
  isDimmed?: boolean;
}>;

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
