// Posicionamento recursivo das subárvores desktop e mobile (movido do resolveRoadMapTreeLayout).

import type {
  RoadMapLayoutViewport,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";
import { getRoadMapNodeDimensions } from "./resolveRoadMapNodeCollisions";
import {
  estimateSubtreeHeight,
  getChildren,
  groupAssignedChildrenBySide,
  resolveChildSideAssignments,
} from "./resolveRoadMapTreeLayout.tree";
import type {
  ResolvedVerticalSpacing,
  TreeSide,
} from "./resolveRoadMapTreeLayout.tree";

function clampToPositiveAxis(value: number, minValue: number): number {
  return Math.max(minValue, value);
}

function layoutDesktopSideStack(
  side: TreeSide,
  children: readonly RoadMapNode[],
  params: Readonly<{
    parentX: number;
    topY: number;
    subtreeHeight: number;
    viewport: RoadMapLayoutViewport;
    tokens: RoadMapViewportLayoutTokens;
    spacing: ResolvedVerticalSpacing;
    childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>;
    subtreeHeightCache: Map<string, number>;
    positionMap: Map<string, RoadMapPosition>;
    horizontalStep: number;
  }>,
  activePath: Set<string>,
): void {
  if (children.length === 0) {
    return;
  }

  const sideHeights = children.map((child) =>
    estimateSubtreeHeight(
      child,
      params.viewport,
      params.childrenMap,
      params.spacing,
      params.subtreeHeightCache,
      new Set(),
      side,
    ),
  );

  const totalSideHeight = sideHeights.reduce((accumulator, height, index) => {
    if (index === 0) {
      return height;
    }

    return accumulator + params.spacing.siblingGapY + height;
  }, 0);

  let cursorY = params.topY + (params.subtreeHeight - totalSideHeight) / 2;

  const childX =
    side === "left"
      ? clampToPositiveAxis(
          params.parentX - params.horizontalStep,
          params.tokens.paddingX,
        )
      : params.parentX + params.horizontalStep;

  children.forEach((child, index) => {
    const childHeight = sideHeights[index];

    layoutDesktopSubtree(
      child,
      {
        x: childX,
        topY: cursorY,
        viewport: params.viewport,
        tokens: params.tokens,
        spacing: params.spacing,
        childrenMap: params.childrenMap,
        subtreeHeightCache: params.subtreeHeightCache,
        positionMap: params.positionMap,
        horizontalStep: params.horizontalStep,
        nodeSide: side,
      },
      activePath,
    );

    cursorY += childHeight + params.spacing.siblingGapY;
  });
}

function layoutDesktopSubtree(
  node: RoadMapNode,
  params: Readonly<{
    x: number;
    topY: number;
    viewport: RoadMapLayoutViewport;
    tokens: RoadMapViewportLayoutTokens;
    spacing: ResolvedVerticalSpacing;
    childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>;
    subtreeHeightCache: Map<string, number>;
    positionMap: Map<string, RoadMapPosition>;
    horizontalStep: number;
    nodeSide: TreeSide | null;
  }>,
  activePath: Set<string>,
): number {
  if (activePath.has(node.id)) {
    const fallbackHeight = getRoadMapNodeDimensions(node).height;

    params.positionMap.set(node.id, {
      x: Math.round(params.x),
      y: Math.round(params.topY),
    });

    return fallbackHeight;
  }

  const nextPath = new Set(activePath);
  nextPath.add(node.id);

  const dimensions = getRoadMapNodeDimensions(node);
  const children = getChildren(params.childrenMap, node.id);

  const subtreeHeight = estimateSubtreeHeight(
    node,
    params.viewport,
    params.childrenMap,
    params.spacing,
    params.subtreeHeightCache,
    new Set(),
    params.nodeSide,
  );

  const nodeY = params.topY + (subtreeHeight - dimensions.height) / 2;

  params.positionMap.set(node.id, {
    x: Math.round(params.x),
    y: Math.round(nodeY),
  });

  if (children.length === 0) {
    return subtreeHeight;
  }

  const childAssignments = resolveChildSideAssignments(
    children,
    params.nodeSide,
  );
  const { left, right } = groupAssignedChildrenBySide(childAssignments);

  layoutDesktopSideStack(
    "left",
    left,
    {
      parentX: params.x,
      topY: params.topY,
      subtreeHeight,
      viewport: params.viewport,
      tokens: params.tokens,
      spacing: params.spacing,
      childrenMap: params.childrenMap,
      subtreeHeightCache: params.subtreeHeightCache,
      positionMap: params.positionMap,
      horizontalStep: params.horizontalStep,
    },
    nextPath,
  );

  layoutDesktopSideStack(
    "right",
    right,
    {
      parentX: params.x,
      topY: params.topY,
      subtreeHeight,
      viewport: params.viewport,
      tokens: params.tokens,
      spacing: params.spacing,
      childrenMap: params.childrenMap,
      subtreeHeightCache: params.subtreeHeightCache,
      positionMap: params.positionMap,
      horizontalStep: params.horizontalStep,
    },
    nextPath,
  );

  return subtreeHeight;
}

function layoutMobileSubtree(
  node: RoadMapNode,
  params: Readonly<{
    x: number;
    topY: number;
    viewport: RoadMapLayoutViewport;
    tokens: RoadMapViewportLayoutTokens;
    spacing: ResolvedVerticalSpacing;
    childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>;
    subtreeHeightCache: Map<string, number>;
    positionMap: Map<string, RoadMapPosition>;
  }>,
  activePath: Set<string>,
): number {
  if (activePath.has(node.id)) {
    const fallbackHeight = getRoadMapNodeDimensions(node).height;

    params.positionMap.set(node.id, {
      x: Math.round(params.x),
      y: Math.round(params.topY),
    });

    return fallbackHeight;
  }

  const nextPath = new Set(activePath);
  nextPath.add(node.id);

  const dimensions = getRoadMapNodeDimensions(node);
  const children = getChildren(params.childrenMap, node.id);

  params.positionMap.set(node.id, {
    x: Math.round(params.x),
    y: Math.round(params.topY),
  });

  if (children.length === 0) {
    return dimensions.height;
  }

  let cursorY = params.topY + dimensions.height + params.spacing.branchGapY;

  for (const child of children) {
    layoutMobileSubtree(
      child,
      {
        ...params,
        x: params.tokens.paddingX,
        topY: cursorY,
      },
      nextPath,
    );

    const childHeight = estimateSubtreeHeight(
      child,
      params.viewport,
      params.childrenMap,
      params.spacing,
      params.subtreeHeightCache,
      new Set(),
      null,
    );

    cursorY += childHeight + params.spacing.branchGapY;
  }

  return cursorY - params.topY - params.spacing.branchGapY;
}

export { clampToPositiveAxis, layoutDesktopSubtree, layoutMobileSubtree };
