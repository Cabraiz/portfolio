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
  type RoadMapDataSegment,
} from "./core";
import {
  ecosystemRoadMapClusters,
  ecosystemRoadMapEdges,
  ecosystemRoadMapNodes,
  ecosystemRoadMapSegments,
} from "./ecosystem";

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
  ...coreRoadMapSegments,
  ...ecosystemRoadMapSegments,
];

export const roadMapDataNodes: readonly RoadMapNode[] = sortRoadMapNodes([
  ...coreRoadMapNodes,
  ...ecosystemRoadMapNodes,
]);

export const roadMapDataEdges: readonly RoadMapEdge[] = sortRoadMapEdges([
  ...coreRoadMapEdges,
  ...ecosystemRoadMapEdges,
]);

export const roadMapDataClusters: readonly RoadMapCluster[] =
  sortRoadMapClusters([
    ...coreRoadMapClusters,
    ...ecosystemRoadMapClusters,
  ]);

const roadMapGraphNormalized = {
  id: "frontend-market-roadmap",
  title: "Roadmap de Tecnologias Front-end",
  subtitle:
    "Mapa visual orientado por mercado, relacionando fundamentos, React, estado, dados, estilização, testes e sinais de adoção.",
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
} from "./core";

export {
  ecosystemRoadMapClusters,
  ecosystemRoadMapEdges,
  ecosystemRoadMapNodes,
  ecosystemRoadMapSegments,
} from "./ecosystem";
