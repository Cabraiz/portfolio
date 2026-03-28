// src/pages/Mateus/RoadMap/application/services/resolveRoadMapNodeCollisions.ts
import { ROADMAP_DEFAULT_NODE_DIMENSIONS_BY_KIND } from "../../domain/model/roadmap.layout.constants";
import type {
  ResolveRoadMapNodeCollisionsOptions,
  RoadMapLayoutNodeBox,
  RoadMapLayoutNodeDimensions,
  RoadMapLayoutViewport,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";

function sortBoxesForResolution(
  boxes: readonly RoadMapLayoutNodeBox[],
): RoadMapLayoutNodeBox[] {
  return [...boxes].sort((left, right) => {
    if (left.sectionKey !== right.sectionKey) {
      return left.sectionKey.localeCompare(right.sectionKey, "pt-BR", {
        sensitivity: "base",
      });
    }

    if (left.anchorY !== right.anchorY) {
      return left.anchorY - right.anchorY;
    }

    if (left.y !== right.y) {
      return left.y - right.y;
    }

    if (left.x !== right.x) {
      return left.x - right.x;
    }

    if (left.lane !== right.lane) {
      return left.lane.localeCompare(right.lane, "pt-BR", {
        sensitivity: "base",
      });
    }

    return left.node.label.localeCompare(right.node.label, "pt-BR", {
      sensitivity: "base",
    });
  });
}

export function getRoadMapNodeDimensions(
  node: RoadMapNode,
): RoadMapLayoutNodeDimensions {
  return ROADMAP_DEFAULT_NODE_DIMENSIONS_BY_KIND[node.kind];
}

export function getRoadMapNodePosition(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): RoadMapPosition {
  const fallback = node[viewport] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };

  return {
    x: fallback.x,
    y: fallback.y,
  };
}

export function createRoadMapLayoutNodeBox(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
  x: number,
  y: number,
  lane: RoadMapLayoutNodeBox["lane"],
  sectionKey: string,
  anchorY = y,
): RoadMapLayoutNodeBox {
  const dimensions = getRoadMapNodeDimensions(node);

  return {
    node,
    x,
    y,
    width: dimensions.width,
    height: dimensions.height,
    lane,
    sectionKey,
    anchorY,
  };
}

export function boxesOverlap(
  left: Pick<RoadMapLayoutNodeBox, "x" | "y" | "width" | "height">,
  right: Pick<RoadMapLayoutNodeBox, "x" | "y" | "width" | "height">,
  minGapX = 24,
  minGapY = 20,
): boolean {
  const horizontalOverlap =
    left.x < right.x + right.width + minGapX &&
    left.x + left.width + minGapX > right.x;

  const verticalOverlap =
    left.y < right.y + right.height + minGapY &&
    left.y + left.height + minGapY > right.y;

  return horizontalOverlap && verticalOverlap;
}

export function resolveRoadMapNodeCollisions(
  boxes: readonly RoadMapLayoutNodeBox[],
  options: ResolveRoadMapNodeCollisionsOptions = {},
): RoadMapLayoutNodeBox[] {
  const {
    minGapX = 24,
    minGapY = 20,
    maxIterations = 300,
    clampToPositiveAxis = true,
  } = options;

  const sortedBoxes = sortBoxesForResolution(boxes);
  const placedBoxes: RoadMapLayoutNodeBox[] = [];

  for (const rawBox of sortedBoxes) {
    let currentX = rawBox.x;
    let currentY = rawBox.y;

    if (clampToPositiveAxis) {
      currentX = Math.max(0, currentX);
      currentY = Math.max(0, currentY);
    }

    let currentBox: RoadMapLayoutNodeBox = {
      ...rawBox,
      x: currentX,
      y: currentY,
    };

    let iterations = 0;
    let hasCollision = true;

    while (hasCollision && iterations < maxIterations) {
      hasCollision = false;
      iterations += 1;

      for (const placedBox of placedBoxes) {
        if (placedBox.sectionKey !== currentBox.sectionKey) {
          continue;
        }

        if (!boxesOverlap(currentBox, placedBox, minGapX, minGapY)) {
          continue;
        }

        currentBox = {
          ...currentBox,
          y: Math.max(currentBox.y, placedBox.y + placedBox.height + minGapY),
        };

        hasCollision = true;
      }
    }

    placedBoxes.push(currentBox);
  }

  return placedBoxes.sort((left, right) => {
    if (left.sectionKey !== right.sectionKey) {
      return left.sectionKey.localeCompare(right.sectionKey, "pt-BR", {
        sensitivity: "base",
      });
    }

    if (left.y !== right.y) {
      return left.y - right.y;
    }

    if (left.x !== right.x) {
      return left.x - right.x;
    }

    return left.node.label.localeCompare(right.node.label, "pt-BR", {
      sensitivity: "base",
    });
  });
}

export function toResolvedRoadMapPositionMap(
  boxes: readonly RoadMapLayoutNodeBox[],
): ReadonlyMap<string, RoadMapPosition> {
  return new Map(
    boxes.map((box) => [
      box.node.id,
      {
        x: Math.round(box.x),
        y: Math.round(box.y),
      },
    ]),
  );
}

export function getRoadMapLayoutBottom(
  boxes: readonly Pick<RoadMapLayoutNodeBox, "y" | "height">[],
): number {
  if (boxes.length === 0) {
    return 0;
  }

  return Math.max(...boxes.map((box) => box.y + box.height));
}
