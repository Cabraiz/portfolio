// src/pages/Mateus/RoadMap/domain/model/roadmap.layout.constants.ts
import type {
  RoadMapLaneId,
  RoadMapLayoutNodeDimensions,
  RoadMapViewportLayoutTokens,
} from "./roadmap.layout.types";
import type { RoadMapNodeKind } from "./roadmap.types";

export const ROADMAP_DESKTOP_LANE_ORDER: readonly RoadMapLaneId[] = [
  "domain",
  "topic",
  "technology",
  "concept",
] as const;

export const ROADMAP_MOBILE_LANE_ORDER: readonly RoadMapLaneId[] = [
  "stack",
] as const;

export const ROADMAP_DESKTOP_LAYOUT_TOKENS: Readonly<RoadMapViewportLayoutTokens> =
  {
    paddingTop: 24,
    paddingX: 16,
    sectionGapY: 96,
    minGapX: 28,
    minGapY: 22,
    domainX: 20,
    topicX: 56,
    technologyX: 472,
    conceptX: 760,
    domainTopOffset: 12,
    laneTopOffset: 150,
  };

export const ROADMAP_MOBILE_LAYOUT_TOKENS: Readonly<RoadMapViewportLayoutTokens> =
  {
    paddingTop: 16,
    paddingX: 16,
    sectionGapY: 30,
    minGapX: 0,
    minGapY: 16,
    domainX: 16,
    topicX: 16,
    technologyX: 16,
    conceptX: 16,
    domainTopOffset: 8,
    laneTopOffset: 112,
  };

export const ROADMAP_DEFAULT_NODE_DIMENSIONS_BY_KIND: Readonly<
  Record<RoadMapNodeKind, RoadMapLayoutNodeDimensions>
> = {
  domain: {
    width: 260,
    height: 84,
  },
  topic: {
    width: 224,
    height: 60,
  },
  technology: {
    width: 208,
    height: 56,
  },
  concept: {
    width: 176,
    height: 42,
  },
};
