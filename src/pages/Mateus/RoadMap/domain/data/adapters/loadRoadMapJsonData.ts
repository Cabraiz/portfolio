import type { RoadMapGraph } from "../../model/roadmap.types";
import type {
  RoadMapJsonGraphDocument,
  RoadMapJsonRelationshipsDocument,
} from "../../model/roadmap.json.types";
import fundamentalsGraphJson from "../json/fundamentals.graph.json";
import fundamentalsRelationshipsJson from "../json/fundamentals.relationships.json";
import { mapJsonGraphToRoadMapGraph } from "./mapJsonGraphToRoadMapGraph";

const fundamentalsGraphSource =
  fundamentalsGraphJson as RoadMapJsonGraphDocument;

const fundamentalsRelationshipsSource =
  fundamentalsRelationshipsJson as RoadMapJsonRelationshipsDocument;

export function loadRoadMapJsonData(): RoadMapGraph {
  return mapJsonGraphToRoadMapGraph({
    graph: fundamentalsGraphSource,
    relationships: fundamentalsRelationshipsSource,
    fallback: {
      id: "roadmap-fundamentals",
      title: "Fundamental Topics",
      subtitle: "React foundation topics loaded from JSON sources.",
      category: "fundamentals",
      demand: "important",
    },
  });
}

export const roadMapJsonGraph = loadRoadMapJsonData();

export default roadMapJsonGraph;
