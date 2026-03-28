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

export const roadMapDataSegments = [
  ...coreRoadMapSegments,
  ...ecosystemRoadMapSegments,
] as const;

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

export const roadMapGraph: RoadMapGraph = {
  id: "frontend-market-roadmap",
  title: "Roadmap de Tecnologias Front-end",
  subtitle:
    "Mapa visual orientado por mercado, relacionando fundamentos, React, estado, dados, estilização, testes e sinais de adoção.",
  nodes: roadMapDataNodes,
  edges: roadMapDataEdges,
  clusters: roadMapDataClusters,
};

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
