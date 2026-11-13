// Tipos, árvore e altura das subárvores (movido do resolveRoadMapTreeLayout).

import {
  ROADMAP_DESKTOP_LAYOUT_TOKENS,
  ROADMAP_MOBILE_LAYOUT_TOKENS,
} from "../../domain/model/roadmap.layout.constants";
import type {
  RoadMapLayoutViewport,
  RoadMapViewportLayoutTokenOverrides,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";
import { getRoadMapNodeDimensions } from "./resolveRoadMapNodeCollisions";

export type ResolveRoadMapTreeLayoutOptions = Readonly<{
  tokens?: RoadMapViewportLayoutTokenOverrides;
  horizontalStep?: number;
  rootGapY?: number;
  siblingGapY?: number;
  branchGapY?: number;
}>;

export type ResolvedRoadMapTreeLayoutResult = Readonly<{
  viewport: RoadMapLayoutViewport;
  tokens: RoadMapViewportLayoutTokens;
  positionMap: ReadonlyMap<string, RoadMapPosition>;
}>;

type TreeMetaNode = RoadMapNode &
  Readonly<{
    parentId?: string | null;
    order?: number | null;
    tier?: number | null;
  }>;

type TreeSide = "left" | "right";

type SideAssignedNode = Readonly<{
  node: RoadMapNode;
  side: TreeSide;
}>;

type ResolvedVerticalSpacing = Readonly<{
  siblingGapY: number;
  branchGapY: number;
  rootGapY: number;
}>;

function mergeViewportTokens(
  viewport: RoadMapLayoutViewport,
  override?: RoadMapViewportLayoutTokenOverrides,
): RoadMapViewportLayoutTokens {
  const base =
    viewport === "desktop"
      ? ROADMAP_DESKTOP_LAYOUT_TOKENS
      : ROADMAP_MOBILE_LAYOUT_TOKENS;

  return {
    ...base,
    ...override,
  };
}

function asTreeMetaNode(node: RoadMapNode): TreeMetaNode {
  return node as TreeMetaNode;
}

function resolveNodeOrder(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): number {
  const meta = asTreeMetaNode(node);

  if (typeof meta.order === "number" && Number.isFinite(meta.order)) {
    return meta.order;
  }

  const existingPosition =
    node[viewport] ?? node.desktop ?? node.mobile ?? null;

  if (existingPosition) {
    return existingPosition.y;
  }

  if (typeof meta.tier === "number" && Number.isFinite(meta.tier)) {
    return meta.tier * 1000;
  }

  return Number.MAX_SAFE_INTEGER;
}

function compareNodesByTreeOrder(
  left: RoadMapNode,
  right: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): number {
  const orderDiff =
    resolveNodeOrder(left, viewport) - resolveNodeOrder(right, viewport);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  const leftLabel = left.label ?? left.id;
  const rightLabel = right.label ?? right.id;

  return leftLabel.localeCompare(rightLabel, "pt-BR", {
    sensitivity: "base",
  });
}

function buildNodeMap(
  nodes: readonly RoadMapNode[],
): ReadonlyMap<string, RoadMapNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function buildChildrenMap(
  nodes: readonly RoadMapNode[],
  nodeMap: ReadonlyMap<string, RoadMapNode>,
  viewport: RoadMapLayoutViewport,
): ReadonlyMap<string | null, readonly RoadMapNode[]> {
  const draft = new Map<string | null, RoadMapNode[]>();

  for (const node of nodes) {
    const meta = asTreeMetaNode(node);
    const rawParentId = meta.parentId ?? null;
    const parentId =
      rawParentId && nodeMap.has(rawParentId) ? rawParentId : null;

    const currentChildren = draft.get(parentId) ?? [];
    currentChildren.push(node);
    draft.set(parentId, currentChildren);
  }

  for (const [key, value] of draft.entries()) {
    draft.set(
      key,
      [...value].sort((left, right) =>
        compareNodesByTreeOrder(left, right, viewport),
      ),
    );
  }

  return draft;
}

function getRootNodes(
  nodes: readonly RoadMapNode[],
  nodeMap: ReadonlyMap<string, RoadMapNode>,
  viewport: RoadMapLayoutViewport,
): readonly RoadMapNode[] {
  return [...nodes]
    .filter((node) => {
      const meta = asTreeMetaNode(node);
      return !meta.parentId || !nodeMap.has(meta.parentId);
    })
    .sort((left, right) => compareNodesByTreeOrder(left, right, viewport));
}

function getChildren(
  childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>,
  parentId: string | null,
): readonly RoadMapNode[] {
  return childrenMap.get(parentId) ?? [];
}

function resolveChildSideAssignments(
  children: readonly RoadMapNode[],
  nodeSide: TreeSide | null,
): readonly SideAssignedNode[] {
  if (children.length === 0) {
    return [];
  }

  if (nodeSide !== null) {
    return children.map((child) => ({
      node: child,
      side: nodeSide,
    }));
  }

  return children.map((child, index) => ({
    node: child,
    side: index % 2 === 0 ? "left" : "right",
  }));
}

function groupAssignedChildrenBySide(
  assignments: readonly SideAssignedNode[],
): Readonly<{
  left: readonly RoadMapNode[];
  right: readonly RoadMapNode[];
}> {
  const left: RoadMapNode[] = [];
  const right: RoadMapNode[] = [];

  for (const assignment of assignments) {
    if (assignment.side === "left") {
      left.push(assignment.node);
      continue;
    }

    right.push(assignment.node);
  }

  return {
    left,
    right,
  };
}

function resolveVerticalSpacing(
  tokens: RoadMapViewportLayoutTokens,
  options: ResolveRoadMapTreeLayoutOptions,
): ResolvedVerticalSpacing {
  const siblingGapY =
    typeof options.siblingGapY === "number" && options.siblingGapY >= 0
      ? options.siblingGapY
      : Math.max(10, Math.round(tokens.minGapY * 0.18));

  const branchGapY =
    typeof options.branchGapY === "number" && options.branchGapY >= 0
      ? options.branchGapY
      : Math.max(14, Math.round(tokens.minGapY * 0.24));

  const rootGapY =
    typeof options.rootGapY === "number" && options.rootGapY >= 0
      ? options.rootGapY
      : Math.max(18, Math.round(tokens.sectionGapY * 0.18));

  return {
    siblingGapY,
    branchGapY,
    rootGapY,
  };
}

function sumStackHeight(
  nodes: readonly RoadMapNode[],
  getHeight: (node: RoadMapNode) => number,
  gapY: number,
): number {
  if (nodes.length === 0) {
    return 0;
  }

  return nodes.reduce((accumulator, node, index) => {
    const nextHeight = getHeight(node);

    if (index === 0) {
      return nextHeight;
    }

    return accumulator + gapY + nextHeight;
  }, 0);
}

function estimateSubtreeHeight(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
  childrenMap: ReadonlyMap<string | null, readonly RoadMapNode[]>,
  spacing: ResolvedVerticalSpacing,
  cache: Map<string, number>,
  activePath: Set<string>,
  nodeSide: TreeSide | null = null,
): number {
  const cacheKey = `${node.id}::${viewport}::${nodeSide ?? "root"}`;
  const cached = cache.get(cacheKey);

  if (typeof cached === "number") {
    return cached;
  }

  if (activePath.has(node.id)) {
    const fallbackHeight = getRoadMapNodeDimensions(node).height;
    cache.set(cacheKey, fallbackHeight);
    return fallbackHeight;
  }

  activePath.add(node.id);

  const dimensions = getRoadMapNodeDimensions(node);
  const children = getChildren(childrenMap, node.id);

  if (children.length === 0) {
    cache.set(cacheKey, dimensions.height);
    activePath.delete(node.id);
    return dimensions.height;
  }

  if (viewport === "mobile") {
    let totalHeight = dimensions.height;

    for (const child of children) {
      totalHeight +=
        spacing.branchGapY +
        estimateSubtreeHeight(
          child,
          viewport,
          childrenMap,
          spacing,
          cache,
          activePath,
          null,
        );
    }

    cache.set(cacheKey, totalHeight);
    activePath.delete(node.id);
    return totalHeight;
  }

  const childAssignments = resolveChildSideAssignments(children, nodeSide);
  const { left, right } = groupAssignedChildrenBySide(childAssignments);

  const leftHeight = sumStackHeight(
    left,
    (child) =>
      estimateSubtreeHeight(
        child,
        viewport,
        childrenMap,
        spacing,
        cache,
        activePath,
        "left",
      ),
    spacing.siblingGapY,
  );

  const rightHeight = sumStackHeight(
    right,
    (child) =>
      estimateSubtreeHeight(
        child,
        viewport,
        childrenMap,
        spacing,
        cache,
        activePath,
        "right",
      ),
    spacing.siblingGapY,
  );

  const subtreeHeight = Math.max(
    dimensions.height,
    leftHeight,
    rightHeight,
  );

  cache.set(cacheKey, subtreeHeight);
  activePath.delete(node.id);

  return subtreeHeight;
}

export {
  buildChildrenMap,
  buildNodeMap,
  estimateSubtreeHeight,
  getChildren,
  getRootNodes,
  groupAssignedChildrenBySide,
  mergeViewportTokens,
  resolveChildSideAssignments,
  resolveVerticalSpacing,
};
export type { ResolvedVerticalSpacing, TreeSide };
