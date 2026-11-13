// Tamanho do palco e âncora inicial do canvas

import type { RoadMapLayoutViewport } from "../../domain/model/roadmap.layout.types";
import type { RoadMapNode } from "../../domain/model/roadmap.types";
import {
  getRoadMapNodeDimensions,
  getRoadMapNodePosition,
} from "../../application/services/resolveRoadMapNodeCollisions";

type RoadMapCanvasBounds = Readonly<{
  minX: number;
  minY: number;
  maxRight: number;
  maxBottom: number;
}>;

type ResolvedAnchor = Readonly<{
  node: RoadMapNode;
  centerX: number;
  centerY: number;
}>;

function getCanvasNodeBounds(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapLayoutViewport,
): RoadMapCanvasBounds | null {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxRight = Number.NEGATIVE_INFINITY;
  let maxBottom = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const position = getRoadMapNodePosition(node, positionKey);
    const dimensions = getRoadMapNodeDimensions(node);

    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxRight = Math.max(maxRight, position.x + dimensions.width);
    maxBottom = Math.max(maxBottom, position.y + dimensions.height);
  }

  return {
    minX,
    minY,
    maxRight,
    maxBottom,
  };
}

function getCanvasSize(
  nodes: readonly RoadMapNode[],
  positionKey: RoadMapLayoutViewport,
  minHeight: number,
): { width: number; height: number } {
  const bounds = getCanvasNodeBounds(nodes, positionKey);

  if (!bounds) {
    return {
      width: positionKey === "mobile" ? 360 : 1120,
      height: minHeight,
    };
  }

  const paddingLeft = positionKey === "mobile" ? 20 : 28;
  const paddingRight = positionKey === "mobile" ? 28 : 120;
  const paddingTop = positionKey === "mobile" ? 24 : 28;
  const paddingBottom = positionKey === "mobile" ? 80 : 120;
  const minWidth = positionKey === "mobile" ? 360 : 1120;

  const contentWidth = Math.max(0, bounds.maxRight - bounds.minX);
  const contentHeight = Math.max(0, bounds.maxBottom - bounds.minY);

  return {
    width: Math.max(minWidth, contentWidth + paddingLeft + paddingRight),
    height: Math.max(minHeight, contentHeight + paddingTop + paddingBottom),
  };
}

function readStringField(
  node: RoadMapNode,
  field: string,
): string | null {
  const value = (node as Record<string, unknown>)[field];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readNumberField(
  node: RoadMapNode,
  field: string,
): number | null {
  const value = (node as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveInitialAnchorNode(
  nodes: readonly RoadMapNode[],
  preferredNodeId?: string | null,
): RoadMapNode | null {
  if (nodes.length === 0) {
    return null;
  }

  if (preferredNodeId) {
    const preferredNode =
      nodes.find((node) => node.id === preferredNodeId) ?? null;

    if (preferredNode) {
      return preferredNode;
    }
  }

  const mainNode =
    nodes.find((node) => {
      const kind = readStringField(node, "kind");
      const type = readStringField(node, "type");
      const tipo = readStringField(node, "tipo");

      return (
        kind === "main" ||
        kind === "root" ||
        type === "main" ||
        type === "root" ||
        tipo === "main" ||
        tipo === "root"
      );
    }) ?? null;

  if (mainNode) {
    return mainNode;
  }

  const tierOneNode =
    nodes.find((node) => {
      const tier = readNumberField(node, "tier");
      return tier === 1;
    }) ?? null;

  if (tierOneNode) {
    return tierOneNode;
  }

  return nodes[0] ?? null;
}

function resolveAnchorCenter(
  node: RoadMapNode | null,
  positionKey: RoadMapLayoutViewport,
): ResolvedAnchor | null {
  if (!node) {
    return null;
  }

  const position = getRoadMapNodePosition(node, positionKey);
  const dimensions = getRoadMapNodeDimensions(node);

  return {
    node,
    centerX: position.x + dimensions.width / 2,
    centerY: position.y + dimensions.height / 2,
  };
}

export { getCanvasSize, resolveAnchorCenter, resolveInitialAnchorNode };
