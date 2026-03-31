import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../model/roadmap.types";

import {
  fundamentalsRoadMapGraph,
  fundamentalsRoadMapSegment,
} from "./fundamentals.data";

export type RoadMapDataSegment = Readonly<{
  nodes: readonly RoadMapNode[];
  edges: readonly RoadMapEdge[];
  clusters: readonly RoadMapCluster[];
}>;

export const coreRoadMapSegments: readonly RoadMapDataSegment[] = [
  fundamentalsRoadMapSegment,
] as const;

export const coreRoadMapNodes: readonly RoadMapNode[] =
  coreRoadMapSegments.flatMap((segment) => segment.nodes);

export const coreRoadMapEdges: readonly RoadMapEdge[] =
  coreRoadMapSegments.flatMap((segment) => segment.edges);

export const coreRoadMapClusters: readonly RoadMapCluster[] =
  coreRoadMapSegments.flatMap((segment) => segment.clusters);

export {
  fundamentalsRoadMapGraph,
  fundamentalsRoadMapSegment,
} from "./fundamentals.data";
