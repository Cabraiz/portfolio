import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapNode,
} from "../../model/roadmap.types";
import { fundamentalsRoadMapSegment } from "./fundamentals.data";
import { reactCoreRoadMapSegment } from "./react-core.data";
import { renderingRoutingRoadMapSegment } from "./rendering-routing.data";
import { stateManagementRoadMapSegment } from "./state-management.data";

export const coreRoadMapSegments = [
  fundamentalsRoadMapSegment,
  reactCoreRoadMapSegment,
  stateManagementRoadMapSegment,
  renderingRoutingRoadMapSegment,
] as const;

export const coreRoadMapNodes: readonly RoadMapNode[] = coreRoadMapSegments.flatMap(
  (segment) => segment.nodes,
);

export const coreRoadMapEdges: readonly RoadMapEdge[] = coreRoadMapSegments.flatMap(
  (segment) => segment.edges,
);

export const coreRoadMapClusters: readonly RoadMapCluster[] =
  coreRoadMapSegments.flatMap((segment) => segment.clusters);

export { fundamentalsRoadMapSegment } from "./fundamentals.data";
export { reactCoreRoadMapSegment } from "./react-core.data";
export { stateManagementRoadMapSegment } from "./state-management.data";
export { renderingRoutingRoadMapSegment } from "./rendering-routing.data";
