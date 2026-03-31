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
  RoadMapGraph,
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

function clampToPositiveAxis(value: number, minValue: number): number {
  return Math.max(minValue, value);
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
