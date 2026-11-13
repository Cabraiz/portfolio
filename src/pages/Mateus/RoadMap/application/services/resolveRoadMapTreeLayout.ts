import type {
  RoadMapLayoutViewport,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapGraph,
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";
import { getRoadMapNodeDimensions } from "./resolveRoadMapNodeCollisions";
import {
  buildChildrenMap,
  buildNodeMap,
  getChildren,
  getRootNodes,
  mergeViewportTokens,
  resolveVerticalSpacing,
} from "./resolveRoadMapTreeLayout.tree";
import type {
  ResolveRoadMapTreeLayoutOptions,
  ResolvedRoadMapTreeLayoutResult,
} from "./resolveRoadMapTreeLayout.tree";
import {
  clampToPositiveAxis,
  layoutDesktopSubtree,
  layoutMobileSubtree,
} from "./resolveRoadMapTreeLayout.subtrees";

export type {
  ResolveRoadMapTreeLayoutOptions,
  ResolvedRoadMapTreeLayoutResult,
} from "./resolveRoadMapTreeLayout.tree";

function estimateGraphMaxDepth(
  roots: readonly RoadMapNode[],
  childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>,
): number {
  function walk(
    node: RoadMapNode,
    depth: number,
    activePath: Set<string>,
  ): number {
    if (activePath.has(node.id)) {
      return depth;
    }

    const cycleSafePath = new Set(activePath);
    cycleSafePath.add(node.id);

    const children = getChildren(childrenMap, node.id);

    if (children.length === 0) {
      return depth;
    }

    return Math.max(
      ...children.map((child) => walk(child, depth + 1, cycleSafePath)),
    );
  }

  if (roots.length === 0) {
    return 1;
  }

  return Math.max(...roots.map((root) => walk(root, 1, new Set())));
}

function resolveHorizontalStep(
  graph: RoadMapGraph,
  tokens: RoadMapViewportLayoutTokens,
  viewport: RoadMapLayoutViewport,
  explicitHorizontalStep?: number,
): number {
  if (
    typeof explicitHorizontalStep === "number" &&
    explicitHorizontalStep > 0
  ) {
    return explicitHorizontalStep;
  }

  const widestNode = graph.nodes.reduce((currentMax, node) => {
    const { width } = getRoadMapNodeDimensions(node);
    return Math.max(currentMax, width);
  }, 0);

  if (viewport === "mobile") {
    return 0;
  }

  return Math.max(widestNode + tokens.minGapX + 48, 220);
}

function normalizePositionMap(
  draftMap: Map<string, RoadMapPosition>,
): ReadonlyMap<string, RoadMapPosition> {
  return new Map(
    [...draftMap.entries()].map(([nodeId, position]) => [
      nodeId,
      {
        x: Math.round(position.x),
        y: Math.round(position.y),
      },
    ]),
  );
}

export function resolveRoadMapTreeLayout(
  graph: RoadMapGraph,
  viewport: RoadMapLayoutViewport,
  options: ResolveRoadMapTreeLayoutOptions = {},
): ResolvedRoadMapTreeLayoutResult {
  const tokens = mergeViewportTokens(viewport, options.tokens);
  const spacing = resolveVerticalSpacing(tokens, options);
  const nodeMap = buildNodeMap(graph.nodes);
  const childrenMap = buildChildrenMap(graph.nodes, nodeMap, viewport);
  const rootNodes = getRootNodes(graph.nodes, nodeMap, viewport);
  const subtreeHeightCache = new Map<string, number>();
  const positionMap = new Map<string, RoadMapPosition>();

  const horizontalStep = resolveHorizontalStep(
    graph,
    tokens,
    viewport,
    options.horizontalStep,
  );

  const maxDepth = estimateGraphMaxDepth(rootNodes, childrenMap);

  const rootCenterX =
    viewport === "desktop"
      ? clampToPositiveAxis(
          tokens.paddingX + (maxDepth - 1) * horizontalStep,
          tokens.paddingX,
        )
      : tokens.paddingX;

  let nextRootTop = tokens.paddingTop;

  for (const rootNode of rootNodes) {
    if (viewport === "desktop") {
      const subtreeHeight = layoutDesktopSubtree(
        rootNode,
        {
          x: rootCenterX,
          topY: nextRootTop,
          viewport,
          tokens,
          spacing,
          childrenMap,
          subtreeHeightCache,
          positionMap,
          horizontalStep,
          nodeSide: null,
        },
        new Set(),
      );

      nextRootTop += subtreeHeight + spacing.rootGapY;
      continue;
    }

    const subtreeHeight = layoutMobileSubtree(
      rootNode,
      {
        x: tokens.paddingX,
        topY: nextRootTop,
        viewport,
        tokens,
        spacing,
        childrenMap,
        subtreeHeightCache,
        positionMap,
      },
      new Set(),
    );

    nextRootTop += subtreeHeight + spacing.rootGapY;
  }

  return {
    viewport,
    tokens,
    positionMap: normalizePositionMap(positionMap),
  };
}
