import type {
  RoadMapNodeKind,
  RoadMapNodeRegistryEntry,
  RoadMapRelationRegistryEntry,
  RoadMapRelationType,
} from "./roadmap.types";

export const ROADMAP_NODE_REGISTRY: Readonly<
  Record<RoadMapNodeKind, RoadMapNodeRegistryEntry>
> = {
  domain: {
    kind: "domain",
    label: "Domain",
    description:
      "High-level subject area that organizes a major part of the roadmap.",
    isContainer: true,
    emphasis: "high",
    defaultShape: "card",
  },
  topic: {
    kind: "topic",
    label: "Topic",
    description:
      "Intermediate knowledge group that breaks a domain into clearer study blocks.",
    isContainer: true,
    emphasis: "medium",
    defaultShape: "pill",
  },
  technology: {
    kind: "technology",
    label: "Technology",
    description:
      "Concrete tool, library, framework or market-facing implementation choice.",
    isContainer: false,
    emphasis: "high",
    defaultShape: "card",
  },
  concept: {
    kind: "concept",
    label: "Concept",
    description:
      "Supporting principle, API or mental model that helps understand a technology.",
    isContainer: false,
    emphasis: "low",
    defaultShape: "chip",
  },
};

export const ROADMAP_RELATION_REGISTRY: Readonly<
  Record<RoadMapRelationType, RoadMapRelationRegistryEntry>
> = {
  contains: {
    type: "contains",
    label: "Contains",
    description:
      "The source node structurally contains or organizes the target node.",
    directed: true,
    style: "dotted",
    semanticWeight: "primary",
  },
  prerequisite: {
    type: "prerequisite",
    label: "Prerequisite",
    description:
      "The source node usually needs to be understood before the target node.",
    directed: true,
    style: "solid",
    semanticWeight: "primary",
  },
  alternative: {
    type: "alternative",
    label: "Alternative",
    description:
      "The source and target nodes compete for a similar role in the stack.",
    directed: false,
    style: "dashed",
    semanticWeight: "secondary",
  },
  complements: {
    type: "complements",
    label: "Complements",
    description:
      "The source and target nodes are commonly adopted together.",
    directed: false,
    style: "solid",
    semanticWeight: "secondary",
  },
  specializes: {
    type: "specializes",
    label: "Specializes",
    description:
      "The target node is a more specific application of the source node.",
    directed: true,
    style: "dotted",
    semanticWeight: "secondary",
  },
};

export function getRoadMapNodeRegistryEntry(
  kind: RoadMapNodeKind,
): RoadMapNodeRegistryEntry {
  return ROADMAP_NODE_REGISTRY[kind];
}

export function getRoadMapRelationRegistryEntry(
  type: RoadMapRelationType,
): RoadMapRelationRegistryEntry {
  return ROADMAP_RELATION_REGISTRY[type];
}
