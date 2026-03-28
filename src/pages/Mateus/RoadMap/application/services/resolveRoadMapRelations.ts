// src/pages/Mateus/RoadMap/application/services/resolveRoadMapRelations.ts
import {
  createRoadMapNodeMap,
  getRoadMapConnectedEdges,
  sortRoadMapEdges,
} from "../../domain/model/roadmap.selectors";
import {
  ROADMAP_RELATION_LABELS,
  ROADMAP_RELATION_ORDER,
} from "../../domain/model/roadmap.constants";
import { getRoadMapRelationRegistryEntry } from "../../domain/model/roadmap.registry";
import type {
  RoadMapEdge,
  RoadMapGraph,
  RoadMapNode,
  RoadMapRelationStyle,
  RoadMapRelationType,
  RoadMapSemanticWeight,
} from "../../domain/model/roadmap.types";

export type RoadMapResolvedRelationDirection =
  | "incoming"
  | "outgoing"
  | "bidirectional";

export type RoadMapResolvedRelation = Readonly<{
  edge: RoadMapEdge;
  type: RoadMapRelationType;
  label: string;
  description: string;
  direction: RoadMapResolvedRelationDirection;
  sourceNode: RoadMapNode;
  targetNode: RoadMapNode;
  counterpartNode: RoadMapNode;
  directed: boolean;
  style: RoadMapRelationStyle;
  semanticWeight: RoadMapSemanticWeight;
}>;

export type RoadMapResolvedRelations = Readonly<{
  all: readonly RoadMapResolvedRelation[];
  incoming: readonly RoadMapResolvedRelation[];
  outgoing: readonly RoadMapResolvedRelation[];
  bidirectional: readonly RoadMapResolvedRelation[];
  primary: readonly RoadMapResolvedRelation[];
  secondary: readonly RoadMapResolvedRelation[];
  groupedByType: Readonly<
    Record<RoadMapRelationType, readonly RoadMapResolvedRelation[]>
  >;
}>;

function resolveDirection(
  edge: RoadMapEdge,
  activeNodeId: string,
): RoadMapResolvedRelationDirection {
  if (edge.isBidirectional) {
    return "bidirectional";
  }

  return edge.from === activeNodeId ? "outgoing" : "incoming";
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

function resolveDirectionOrder(
  direction: RoadMapResolvedRelationDirection,
): number {
  switch (direction) {
    case "outgoing":
      return 0;
    case "bidirectional":
      return 1;
    case "incoming":
      return 2;
    default:
      return 99;
  }
}

function resolveSemanticWeightOrder(weight: RoadMapSemanticWeight): number {
  return weight === "primary" ? 0 : 1;
}

function sortResolvedRelations(
  relations: readonly RoadMapResolvedRelation[],
): RoadMapResolvedRelation[] {
  return [...relations].sort((left, right) => {
    const semanticWeightDiff =
      resolveSemanticWeightOrder(left.semanticWeight) -
      resolveSemanticWeightOrder(right.semanticWeight);

    if (semanticWeightDiff !== 0) {
      return semanticWeightDiff;
    }

    const relationTypeDiff =
      ROADMAP_RELATION_ORDER[left.type] - ROADMAP_RELATION_ORDER[right.type];

    if (relationTypeDiff !== 0) {
      return relationTypeDiff;
    }

    const directionDiff =
      resolveDirectionOrder(left.direction) - resolveDirectionOrder(right.direction);

    if (directionDiff !== 0) {
      return directionDiff;
    }

    return left.counterpartNode.label.localeCompare(
      right.counterpartNode.label,
      "pt-BR",
      {
        sensitivity: "base",
      },
    );
  });
}

function buildResolvedRelation(
  edge: RoadMapEdge,
  activeNodeId: string,
  sourceNode: RoadMapNode,
  targetNode: RoadMapNode,
): RoadMapResolvedRelation {
  const direction = resolveDirection(edge, activeNodeId);
  const counterpartNode = edge.from === activeNodeId ? targetNode : sourceNode;
  const registryEntry = getRoadMapRelationRegistryEntry(edge.type);

  return {
    edge,
    type: edge.type,
    label: edge.label?.trim() || ROADMAP_RELATION_LABELS[edge.type],
    description: registryEntry.description,
    direction,
    sourceNode,
    targetNode,
    counterpartNode,
    directed: registryEntry.directed,
    style: registryEntry.style,
    semanticWeight: registryEntry.semanticWeight,
  };
}

export function resolveRoadMapRelations(
  graph: RoadMapGraph,
  nodeId: string,
): RoadMapResolvedRelations {
  const nodeMap = createRoadMapNodeMap(graph);
  const connectedEdges = sortRoadMapEdges(getRoadMapConnectedEdges(graph, nodeId));

  const resolvedRelations: RoadMapResolvedRelation[] = [];

  for (const edge of connectedEdges) {
    const sourceNode = nodeMap.get(edge.from);
    const targetNode = nodeMap.get(edge.to);

    if (!sourceNode || !targetNode) {
      continue;
    }

    resolvedRelations.push(
      buildResolvedRelation(edge, nodeId, sourceNode, targetNode),
    );
  }

  const sortedRelations = sortResolvedRelations(resolvedRelations);

  const incoming = sortedRelations.filter(
    (relation) => relation.direction === "incoming",
  );

  const outgoing = sortedRelations.filter(
    (relation) => relation.direction === "outgoing",
  );

  const bidirectional = sortedRelations.filter(
    (relation) => relation.direction === "bidirectional",
  );

  const primary = sortedRelations.filter(
    (relation) => relation.semanticWeight === "primary",
  );

  const secondary = sortedRelations.filter(
    (relation) => relation.semanticWeight === "secondary",
  );

  const groupedByType = sortedRelations.reduce<
    Record<RoadMapRelationType, RoadMapResolvedRelation[]>
  >((accumulator, relation) => {
    accumulator[relation.type].push(relation);
    return accumulator;
  }, emptyGroupedRelations());

  return {
    all: sortedRelations,
    incoming,
    outgoing,
    bidirectional,
    primary,
    secondary,
    groupedByType: {
      contains: sortResolvedRelations(groupedByType.contains),
      prerequisite: sortResolvedRelations(groupedByType.prerequisite),
      alternative: sortResolvedRelations(groupedByType.alternative),
      complements: sortResolvedRelations(groupedByType.complements),
      specializes: sortResolvedRelations(groupedByType.specializes),
    },
  };
}
