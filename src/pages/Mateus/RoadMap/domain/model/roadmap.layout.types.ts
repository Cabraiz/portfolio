import type {
  RoadMapCategoryId,
  RoadMapNode,
  RoadMapPosition,
} from "./roadmap.types";

export type RoadMapLayoutViewport = "desktop" | "mobile";

export type RoadMapLaneId =
  | "domain"
  | "topic"
  | "technology"
  | "concept"
  | "stack";

export type RoadMapLayoutNodeDimensions = Readonly<{
  width: number;
  height: number;
}>;

export type RoadMapViewportLayoutTokens = Readonly<{
  paddingTop: number;
  paddingX: number;
  sectionGapY: number;
  minGapX: number;
  minGapY: number;
  domainX: number;
  topicX: number;
  technologyX: number;
  conceptX: number;
  domainTopOffset: number;
  laneTopOffset: number;
}>;

export type RoadMapViewportLayoutTokenOverrides =
  Partial<RoadMapViewportLayoutTokens>;

export type RoadMapLayoutOptions = Readonly<{
  desktop?: RoadMapViewportLayoutTokenOverrides;
  mobile?: RoadMapViewportLayoutTokenOverrides;
}>;

export type RoadMapResolvedLane = Readonly<{
  id: RoadMapLaneId;
  category: RoadMapCategoryId;
  sectionKey: string;
  x: number;
  top: number;
  nodes: readonly RoadMapNode[];
  minExistingY: number | null;
}>;

export type RoadMapResolvedSection = Readonly<{
  category: RoadMapCategoryId;
  sectionKey: string;
  top: number;
  lanes: readonly RoadMapResolvedLane[];
}>;

export type RoadMapNodeLayoutSnapshot = Readonly<{
  nodeId: string;
  viewport: RoadMapLayoutViewport;
  lane: RoadMapLaneId;
  sectionKey: string;
  position: RoadMapPosition;
  dimensions: RoadMapLayoutNodeDimensions;
}>;

export type RoadMapLayoutNodeBox = Readonly<{
  node: RoadMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  lane: RoadMapLaneId | string;
  sectionKey: string;
  anchorY: number;
}>;

export type ResolveRoadMapNodeCollisionsOptions = Readonly<{
  minGapX?: number;
  minGapY?: number;
  maxIterations?: number;
  clampToPositiveAxis?: boolean;
}>;
