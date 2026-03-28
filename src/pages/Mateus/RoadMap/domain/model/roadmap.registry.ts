// src/pages/Mateus/RoadMap/domain/model/roadmap.registry.ts

import {
  ROADMAP_KIND_LABELS,
  ROADMAP_RELATION_LABELS,
} from "./roadmap.constants";
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
    label: ROADMAP_KIND_LABELS.domain,
    description:
      "Agrupa uma frente principal de atuação dentro do mapa da stack.",
    isContainer: true,
    emphasis: "high",
    defaultShape: "card",
  },
  topic: {
    kind: "topic",
    label: ROADMAP_KIND_LABELS.topic,
    description:
      "Organiza tecnologias e práticas relacionadas dentro da mesma frente.",
    isContainer: true,
    emphasis: "medium",
    defaultShape: "pill",
  },
  technology: {
    kind: "technology",
    label: ROADMAP_KIND_LABELS.technology,
    description:
      "Representa uma tecnologia concreta, framework, biblioteca, runtime, serviço ou ferramenta utilizada na prática.",
    isContainer: false,
    emphasis: "high",
    defaultShape: "card",
  },
  concept: {
    kind: "concept",
    label: ROADMAP_KIND_LABELS.concept,
    description:
      "Representa padrão, capacidade, abordagem técnica ou conceito aplicado em conjunto com a stack.",
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
    label: ROADMAP_RELATION_LABELS.contains,
    description:
      "O nó de origem organiza estruturalmente o nó de destino dentro da mesma frente ou bloco.",
    directed: true,
    style: "dotted",
    semanticWeight: "primary",
  },
  prerequisite: {
    type: "prerequisite",
    label: ROADMAP_RELATION_LABELS.prerequisite,
    description:
      "O nó de origem costuma servir como base técnica para o uso consistente do nó de destino.",
    directed: true,
    style: "solid",
    semanticWeight: "primary",
  },
  alternative: {
    type: "alternative",
    label: ROADMAP_RELATION_LABELS.alternative,
    description:
      "Os nós ocupam papéis parecidos na stack e normalmente representam escolhas alternativas.",
    directed: false,
    style: "dashed",
    semanticWeight: "secondary",
  },
  complements: {
    type: "complements",
    label: ROADMAP_RELATION_LABELS.complements,
    description:
      "Os nós aparecem juntos com frequência e se reforçam dentro do mesmo contexto de entrega.",
    directed: false,
    style: "solid",
    semanticWeight: "secondary",
  },
  specializes: {
    type: "specializes",
    label: ROADMAP_RELATION_LABELS.specializes,
    description:
      "O nó de destino representa um recorte mais específico, especializado ou aprofundado do nó de origem.",
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

export function isRoadMapContainerKind(kind: RoadMapNodeKind): boolean {
  return ROADMAP_NODE_REGISTRY[kind].isContainer;
}
