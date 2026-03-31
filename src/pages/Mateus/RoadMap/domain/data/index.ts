import {
  sortRoadMapEdges,
  sortRoadMapNodes,
} from "../model/roadmap.selectors";
import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
} from "../model/roadmap.types";

import {
  coreRoadMapClusters,
  coreRoadMapEdges,
  coreRoadMapNodes,
  coreRoadMapSegments,
  fundamentalsRoadMapGraph,
  fundamentalsRoadMapSegment,
  type RoadMapDataSegment,
} from "./core";

function sortRoadMapClusters(
  clusters: readonly RoadMapCluster[],
): readonly RoadMapCluster[] {
  return [...clusters].sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR", {
      sensitivity: "base",
    }),
  );
}

export const roadMapDataSegments: readonly RoadMapDataSegment[] = [
  fundamentalsRoadMapSegment,
];

export const roadMapDataNodes: readonly RoadMapNode[] = sortRoadMapNodes(
  coreRoadMapNodes,
);

export const roadMapDataEdges: readonly RoadMapEdge[] = sortRoadMapEdges(
  coreRoadMapEdges,
);

export const roadMapDataClusters: readonly RoadMapCluster[] =
  sortRoadMapClusters(coreRoadMapClusters);

const roadMapGraphNormalized = {
  id: fundamentalsRoadMapGraph.id,
  title: fundamentalsRoadMapGraph.title,
  subtitle: fundamentalsRoadMapGraph.subtitle,
  nodes: roadMapDataNodes,
  edges: roadMapDataEdges,
  clusters: roadMapDataClusters,
} satisfies RoadMapGraph;

export const roadMapGraph = roadMapGraphNormalized;

export {
  coreRoadMapClusters,
  coreRoadMapEdges,
  coreRoadMapNodes,
  coreRoadMapSegments,
  fundamentalsRoadMapGraph,
  fundamentalsRoadMapSegment,
} from "./core";
