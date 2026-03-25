import {
  createRoadMapNodeMap,
  getRoadMapConnectedEdges,
  sortRoadMapEdges,
} from "../../domain/model/roadmap.selectors";
import { ROADMAP_RELATION_LABELS } from "../../domain/model/roadmap.constants";
import type {
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
  RoadMapRelationType,
} from "../../domain/model/roadmap.types";

export type RoadMapResolvedRelation = Readonly<{
  edge: RoadMapEdge;
  type: RoadMapRelationType;
  label: string;
  direction: "incoming" | "outgoing" | "bidirectional";
  sourceNode: RoadMapNode;
  targetNode: RoadMapNode;
  counterpartNode: RoadMapNode;
}>;

export type RoadMapResolvedRelations = Readonly<{
  all: readonly RoadMapResolvedRelation[];
  incoming: readonly RoadMapResolvedRelation[];
  outgoing: readonly RoadMapResolvedRelation[];
  bidirectional: readonly RoadMapResolvedRelation[];
  groupedByType: Readonly<Record<RoadMapRelationType, readonly RoadMapResolvedRelation[]>>;
}>;

function resolveDirection(
  edge: RoadMapEdge,
  activeNodeId: string,
): "incoming" | "outgoing" | "bidirectional" {
  if (edge.isBidirectional) {
    return "bidirectional";
  }

  if (edge.from === activeNodeId) {
    return "outgoing";
  }

  return "incoming";
}

function emptyGroupedRelations(): Record<
  RoadMapRelationType,
  RoadMapResolvedRelation[]
> {
  return {
    contains: [],
    prerequisite: [],
    alternative: [],
    complements: [],
    specializes: [],
  };
}

export function resolveRoadMapRelations(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapResolvedRelations {
  const nodeMap = createRoadMapNodeMap(graph);
  const connectedEdges = sortRoadMapEdges(getRoadMapConnectedEdges(graph, nodeId));

  const resolvedRelations = connectedEdges
    .map((edge) => {
      const sourceNode = nodeMap.get(edge.from);
      const targetNode = nodeMap.get(edge.to);

      if (!sourceNode || !targetNode) {
        return null;
      }

      const direction = resolveDirection(edge, nodeId);
      const counterpartNode =
        edge.from === nodeId ? targetNode : sourceNode;

      return {
        edge,
        type: edge.type,
        label: ROADMAP_RELATION_LABELS[edge.type],
        direction,
        sourceNode,
        targetNode,
        counterpartNode,
      } satisfies RoadMapResolvedRelation;
    })
    .filter((relation): relation is RoadMapResolvedRelation => Boolean(relation));

  const incoming = resolvedRelations.filter(
    (relation) => relation.direction === "incoming",
  );

  const outgoing = resolvedRelations.filter(
    (relation) => relation.direction === "outgoing",
  );

  const bidirectional = resolvedRelations.filter(
    (relation) => relation.direction === "bidirectional",
  );

  const groupedByType = resolvedRelations.reduce<
    Record<RoadMapRelationType, RoadMapResolvedRelation[]>
  >((accumulator, relation) => {
    accumulator[relation.type].push(relation);
    return accumulator;
  }, emptyGroupedRelations());

  return {
    all: resolvedRelations,
    incoming,
    outgoing,
    bidirectional,
    groupedByType,
  };
}
