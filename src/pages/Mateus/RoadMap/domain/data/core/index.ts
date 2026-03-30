import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../model/roadmap.types";

import {
  fundamentalsRoadMapGraph,
  fundamentalsRoadMapSegment,
} from "./fundamentals.data";
import { reactCoreRoadMapSegment } from "./react-core.data";
import { renderingRoutingRoadMapSegment } from "./rendering-routing.data";
import { stateManagementRoadMapSegment } from "./state-management.data";

export type RoadMapDataSegment = Readonly<{
  nodes: readonly RoadMapNode[];
  edges: readonly RoadMapEdge[];
  clusters: readonly RoadMapCluster[];
}>;

export const coreRoadMapSegments: readonly RoadMapDataSegment[] = [
  fundamentalsRoadMapSegment,
  reactCoreRoadMapSegment,
  stateManagementRoadMapSegment,
  renderingRoutingRoadMapSegment,
] as const;

export const coreRoadMapNodes: readonly RoadMapNode[] =
  coreRoadMapSegments.flatMap((segment) => segment.nodes);

export const coreRoadMapEdges: readonly RoadMapEdge[] =
  coreRoadMapSegments.flatMap((segment) => segment.edges);

export const coreRoadMapClusters: readonly RoadMapCluster[] =
  coreRoadMapSegments.flatMap((segment) => segment.clusters);

export { fundamentalsRoadMapGraph, fundamentalsRoadMapSegment } from "./fundamentals.data";
export { reactCoreRoadMapSegment } from "./react-core.data";
export { renderingRoutingRoadMapSegment } from "./rendering-routing.data";
export { stateManagementRoadMapSegment } from "./state-management.data";
