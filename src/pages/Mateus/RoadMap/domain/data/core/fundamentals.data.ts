import type {
  RoadMapCluster,
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
} from "../../model/roadmap.types";
import { loadRoadMapJsonData } from "../adapters/loadRoadMapJsonData";

/**
 * Camada de compatibilidade.
 *
 * O conteúdo de "Fundamentals" deixa de ficar embutido em arrays TS
 * e passa a vir da fonte JSON + adapter canônico.
 *
 * Este arquivo continua exportando os mesmos nomes antigos para não
 * quebrar os consumers já existentes do domínio e da aplicação.
 */
const fundamentalsRoadMapGraphSource = loadRoadMapJsonData();

const fundamentalsRoadMapGraphNormalized = {
  ...fundamentalsRoadMapGraphSource,
  nodes: fundamentalsRoadMapGraphSource.nodes ?? [],
  edges: fundamentalsRoadMapGraphSource.edges ?? [],
  clusters: fundamentalsRoadMapGraphSource.clusters ?? [],
} satisfies RoadMapGraph;

export const fundamentalsRoadMapGraph = fundamentalsRoadMapGraphNormalized;

export const fundamentalsRoadMapNodes: readonly RoadMapNode[] =
  fundamentalsRoadMapGraphNormalized.nodes;

export const fundamentalsRoadMapEdges: readonly RoadMapEdge[] =
  fundamentalsRoadMapGraphNormalized.edges;

export const fundamentalsRoadMapClusters: readonly RoadMapCluster[] =
  fundamentalsRoadMapGraphNormalized.clusters;

export const fundamentalsRoadMapSegment = {
  nodes: fundamentalsRoadMapNodes,
  edges: fundamentalsRoadMapEdges,
  clusters: fundamentalsRoadMapClusters,
} as const;

export default fundamentalsRoadMapSegment;
