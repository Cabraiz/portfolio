import type { RoadMapGraph } from "../../model/roadmap.types";
import type { RoadMapJsonGraphDocument } from "../../model/roadmap.json.types";
import fundamentalsGraphJson from "../json/fundamentals.graph.json";
import { mapJsonGraphToRoadMapGraph } from "./mapJsonGraphToRoadMapGraph";

const fundamentalsGraphSource =
  fundamentalsGraphJson as RoadMapJsonGraphDocument;

export function loadRoadMapJsonData(): RoadMapGraph {
  return mapJsonGraphToRoadMapGraph({
    graph: fundamentalsGraphSource,
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
