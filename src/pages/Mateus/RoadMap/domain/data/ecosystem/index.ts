import type {
	RoadMapCluster,
	RoadMapEdge,
	RoadMapNode,
} from "../../model/roadmap.types";
import { dataLayerRoadMapSegment } from "./data-layer.data";
import { marketSignalsRoadMapSegment } from "./market-signals.data";
import { stylingRoadMapSegment } from "./styling.data";
import { testingToolingRoadMapSegment } from "./testing-tooling.data";

export const ecosystemRoadMapSegments = [
	dataLayerRoadMapSegment,
	stylingRoadMapSegment,
	testingToolingRoadMapSegment,
	marketSignalsRoadMapSegment,
] as const;

export const ecosystemRoadMapNodes: readonly RoadMapNode[] =
	ecosystemRoadMapSegments.flatMap((segment) => segment.nodes);

export const ecosystemRoadMapEdges: readonly RoadMapEdge[] =
	ecosystemRoadMapSegments.flatMap((segment) => segment.edges);

export const ecosystemRoadMapClusters: readonly RoadMapCluster[] =
	ecosystemRoadMapSegments.flatMap((segment) => segment.clusters);

export { dataLayerRoadMapSegment } from "./data-layer.data";
export { stylingRoadMapSegment } from "./styling.data";
export { testingToolingRoadMapSegment } from "./testing-tooling.data";
export { marketSignalsRoadMapSegment } from "./market-signals.data";
