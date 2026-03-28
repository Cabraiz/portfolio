import { ROADMAP_CATEGORY_ORDER } from "../../domain/model/roadmap.constants";
import {
  ROADMAP_DEFAULT_NODE_DIMENSIONS_BY_KIND,
  ROADMAP_DESKTOP_LANE_ORDER,
  ROADMAP_DESKTOP_LAYOUT_TOKENS,
  ROADMAP_MOBILE_LANE_ORDER,
  ROADMAP_MOBILE_LAYOUT_TOKENS,
} from "../../domain/model/roadmap.layout.constants";
import type {
  RoadMapLaneId,
  RoadMapLayoutViewport,
  RoadMapResolvedLane,
  RoadMapResolvedSection,
  RoadMapViewportLayoutTokenOverrides,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapCategoryId,
  RoadMapGraph,
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";

export type ResolveRoadMapLanesOptions = Readonly<{
  tokens?: RoadMapViewportLayoutTokenOverrides;
}>;

export type ResolvedRoadMapLanesResult = Readonly<{
  viewport: RoadMapLayoutViewport;
  tokens: RoadMapViewportLayoutTokens;
  sections: readonly RoadMapResolvedSection[];
}>;

const [ROADMAP_STACK_LANE_ID] = ROADMAP_MOBILE_LANE_ORDER;

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

function getExistingPosition(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): RoadMapPosition | null {
  const position = node[viewport] ?? node.desktop ?? node.mobile;

  if (!position) {
    return null;
  }

  return {
    x: position.x,
    y: position.y,
  };
}

function getEstimatedNodeHeight(node: RoadMapNode): number {
  return ROADMAP_DEFAULT_NODE_DIMENSIONS_BY_KIND[node.kind].height;
}

function getOrderedCategories(nodes: readonly RoadMapNode[]): RoadMapCategoryId[] {
  return Array.from(new Set(nodes.map((node) => node.category))).sort(
    (left, right) => ROADMAP_CATEGORY_ORDER[left] - ROADMAP_CATEGORY_ORDER[right],
  );
}

function compareNodesForLane(
  left: RoadMapNode,
  right: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): number {
  const leftPosition = getExistingPosition(left, viewport);
  const rightPosition = getExistingPosition(right, viewport);

  if (leftPosition && rightPosition) {
    if (leftPosition.y !== rightPosition.y) {
      return leftPosition.y - rightPosition.y;
    }

    if (leftPosition.x !== rightPosition.x) {
      return leftPosition.x - rightPosition.x;
    }
  }

  if (left.parentId && !right.parentId) {
    return 1;
  }

  if (!left.parentId && right.parentId) {
    return -1;
  }

  if (left.parentId && right.parentId && left.parentId !== right.parentId) {
    const parentCompare = left.parentId.localeCompare(right.parentId, "pt-BR", {
      sensitivity: "base",
    });

    if (parentCompare !== 0) {
      return parentCompare;
    }
  }

  if (left.featured && !right.featured) {
    return -1;
  }

  if (!left.featured && right.featured) {
    return 1;
  }

  return left.label.localeCompare(right.label, "pt-BR", {
    sensitivity: "base",
  });
}

function sortLaneNodes(
  nodes: readonly RoadMapNode[],
  viewport: RoadMapLayoutViewport,
): readonly RoadMapNode[] {
  return [...nodes].sort((left, right) =>
    compareNodesForLane(left, right, viewport),
  );
}

function getLaneMinExistingY(
  nodes: readonly RoadMapNode[],
  viewport: RoadMapLayoutViewport,
): number | null {
  const existingYs = nodes
    .map((node) => getExistingPosition(node, viewport)?.y)
    .filter((value): value is number => typeof value === "number");

  if (existingYs.length === 0) {
    return null;
  }

  return Math.min(...existingYs);
}

function getLaneIdForNode(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
): RoadMapLaneId {
  if (viewport === "mobile") {
    return ROADMAP_STACK_LANE_ID;
  }

  switch (node.kind) {
    case "domain":
      return "domain";
    case "topic":
      return "topic";
    case "technology":
      return "technology";
    case "concept":
      return "concept";
    default:
      return "technology";
  }
}

function getLaneX(
  laneId: RoadMapLaneId,
  viewport: RoadMapLayoutViewport,
  tokens: RoadMapViewportLayoutTokens,
): number {
  if (viewport === "mobile") {
    return tokens.paddingX;
  }

  switch (laneId) {
    case "domain":
      return tokens.domainX;
    case "topic":
      return tokens.topicX;
    case "technology":
      return tokens.technologyX;
    case "concept":
      return tokens.conceptX;
    case "stack":
      return tokens.paddingX;
    default:
      return tokens.paddingX;
  }
}

function getLaneTop(
  laneId: RoadMapLaneId,
  sectionTop: number,
  viewport: RoadMapLayoutViewport,
  tokens: RoadMapViewportLayoutTokens,
): number {
  if (viewport === "mobile") {
    return sectionTop + tokens.domainTopOffset;
  }

  if (laneId === "domain") {
    return sectionTop + tokens.domainTopOffset;
  }

  return sectionTop + tokens.laneTopOffset;
}

function estimateSectionHeight(
  nodes: readonly RoadMapNode[],
  viewport: RoadMapLayoutViewport,
  tokens: RoadMapViewportLayoutTokens,
): number {
  if (nodes.length === 0) {
    return 0;
  }

  const existingPositions = nodes
    .map((node) => getExistingPosition(node, viewport))
    .filter((value): value is RoadMapPosition => value !== null);

  if (existingPositions.length > 0) {
    const minY = Math.min(...existingPositions.map((position) => position.y));
    const maxBottom = Math.max(
      ...nodes.map((node) => {
        const position = getExistingPosition(node, viewport) ?? { x: 0, y: minY };
        return position.y + getEstimatedNodeHeight(node);
      }),
    );

    return Math.max(180, maxBottom - minY + tokens.sectionGapY * 0.35);
  }

  const estimatedStackHeight =
    nodes.reduce((accumulator, node) => {
      return accumulator + getEstimatedNodeHeight(node);
    }, 0) +
    Math.max(0, nodes.length - 1) * tokens.minGapY;

  return Math.max(180, estimatedStackHeight + tokens.sectionGapY * 0.35);
}

function createDesktopSectionLanes(
  category: RoadMapCategoryId,
  categoryNodes: readonly RoadMapNode[],
  sectionTop: number,
  viewport: RoadMapLayoutViewport,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapResolvedSection {
  const sectionKey = `${category}:${viewport}`;
  const lanes: RoadMapResolvedLane[] = [];

  for (const laneId of ROADMAP_DESKTOP_LANE_ORDER) {
    const laneNodes = sortLaneNodes(
      categoryNodes.filter((node) => getLaneIdForNode(node, viewport) === laneId),
      viewport,
    );

    if (laneNodes.length === 0) {
      continue;
    }

    const lane: RoadMapResolvedLane = {
      id: laneId,
      category,
      sectionKey,
      x: getLaneX(laneId, viewport, tokens),
      top: getLaneTop(laneId, sectionTop, viewport, tokens),
      nodes: laneNodes,
      minExistingY: getLaneMinExistingY(laneNodes, viewport),
    };

    lanes.push(lane);
  }

  return {
    category,
    sectionKey,
    top: sectionTop,
    lanes,
  };
}

function createMobileSectionLanes(
  category: RoadMapCategoryId,
  categoryNodes: readonly RoadMapNode[],
  sectionTop: number,
  viewport: RoadMapLayoutViewport,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapResolvedSection {
  const sectionKey = `${category}:${viewport}`;

  const orderedNodes: readonly RoadMapNode[] = [
    ...sortLaneNodes(
      categoryNodes.filter((node) => node.kind === "domain"),
      viewport,
    ),
    ...sortLaneNodes(
      categoryNodes.filter((node) => node.kind === "topic"),
      viewport,
    ),
    ...sortLaneNodes(
      categoryNodes.filter((node) => node.kind === "technology"),
      viewport,
    ),
    ...sortLaneNodes(
      categoryNodes.filter((node) => node.kind === "concept"),
      viewport,
    ),
  ];

  const lanes: RoadMapResolvedLane[] = [];

  if (orderedNodes.length > 0) {
    lanes.push({
      id: ROADMAP_STACK_LANE_ID,
      category,
      sectionKey,
      x: getLaneX(ROADMAP_STACK_LANE_ID, viewport, tokens),
      top: getLaneTop(ROADMAP_STACK_LANE_ID, sectionTop, viewport, tokens),
      nodes: orderedNodes,
      minExistingY: getLaneMinExistingY(orderedNodes, viewport),
    });
  }

  return {
    category,
    sectionKey,
    top: sectionTop,
    lanes,
  };
}

export function resolveRoadMapLanes(
  graph: RoadMapGraph,
  viewport: RoadMapLayoutViewport,
  options: ResolveRoadMapLanesOptions = {},
): ResolvedRoadMapLanesResult {
  const tokens = mergeViewportTokens(viewport, options.tokens);
  const categories = getOrderedCategories(graph.nodes);

  const sections: RoadMapResolvedSection[] = [];
  let currentSectionTop = tokens.paddingTop;

  for (const category of categories) {
    const categoryNodes = graph.nodes.filter((node) => node.category === category);

    if (categoryNodes.length === 0) {
      continue;
    }

    const section =
      viewport === "desktop"
        ? createDesktopSectionLanes(
            category,
            categoryNodes,
            currentSectionTop,
            viewport,
            tokens,
          )
        : createMobileSectionLanes(
            category,
            categoryNodes,
            currentSectionTop,
            viewport,
            tokens,
          );

    sections.push(section);

    currentSectionTop +=
      estimateSectionHeight(categoryNodes, viewport, tokens) + tokens.sectionGapY;
  }

  return {
    viewport,
    tokens,
    sections,
  };
}
