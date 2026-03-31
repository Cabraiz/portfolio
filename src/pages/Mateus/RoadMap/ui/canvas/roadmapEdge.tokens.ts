// src/pages/Mateus/RoadMap/ui/canvas/roadmapEdge.tokens.ts
import type { RoadMapRelationType } from "../../domain/model/roadmap.types";

export type RoadMapEdgeVisualStyle = Readonly<{
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}>;

export type RoadMapEdgeOpacityTokens = Readonly<{
  defaultOpacity: number;
  dimmedOpacity: number;
}>;

export const ROADMAP_EDGE_OPACITY: RoadMapEdgeOpacityTokens = {
  defaultOpacity: 0.94,
  dimmedOpacity: 0.94,
} as const;

export const ROADMAP_EDGE_STYLE_BY_TYPE: Readonly<
  Record<RoadMapRelationType, RoadMapEdgeVisualStyle>
> = {
  contains: {
    stroke: "rgba(100, 116, 139, 0.82)",
    strokeWidth: 1.5,
    strokeDasharray: "4 10",
  },
  prerequisite: {
    stroke: "rgba(37, 99, 235, 0.92)",
    strokeWidth: 2.05,
  },
  alternative: {
    stroke: "rgba(147, 51, 234, 0.88)",
    strokeWidth: 1.8,
    strokeDasharray: "8 8",
  },
  complements: {
    stroke: "rgba(14, 165, 233, 0.9)",
    strokeWidth: 1.8,
  },
  specializes: {
    stroke: "rgba(15, 23, 42, 0.84)",
    strokeWidth: 1.7,
    strokeDasharray: "3 8",
  },
} as const;

export function getRoadMapEdgeStyle(
  type: RoadMapRelationType,
): RoadMapEdgeVisualStyle {
  return ROADMAP_EDGE_STYLE_BY_TYPE[type];
}
