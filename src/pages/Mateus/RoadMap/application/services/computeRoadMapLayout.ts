import type {
  RoadMapLayoutNodeBox,
  RoadMapLayoutViewport,
  RoadMapResolvedLane,
  RoadMapResolvedSection,
  RoadMapViewportLayoutTokenOverrides,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapGraph,
  RoadMapNode,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";
import {
  createRoadMapLayoutNodeBox,
  getRoadMapLayoutBottom,
  getRoadMapNodeDimensions,
  resolveRoadMapNodeCollisions,
  toResolvedRoadMapPositionMap,
} from "./resolveRoadMapNodeCollisions";
import { resolveRoadMapLanes } from "./resolveRoadMapLanes";

export type ComputeRoadMapLayoutOptions = Readonly<{
  desktop?: RoadMapViewportLayoutTokenOverrides;
  mobile?: RoadMapViewportLayoutTokenOverrides;
}>;

type ComputeViewportLayoutResult = Readonly<{
  tokens: RoadMapViewportLayoutTokens;
  positionMap: ReadonlyMap<string, RoadMapPosition>;
}>;

function normalizeLaneY(
  node: RoadMapNode,
  viewport: RoadMapLayoutViewport,
  laneTop: number,
  laneMinExistingY: number | null,
  fallbackY: number,
): Readonly<{
  y: number;
  nextFallbackY: number;
}> {
  const existingPosition = node[viewport] ?? node.desktop ?? node.mobile ?? null;
  const dimensions = getRoadMapNodeDimensions(node);

  if (!existingPosition || laneMinExistingY === null) {
    return {
      y: fallbackY,
      nextFallbackY: fallbackY + dimensions.height,
    };
  }

  const normalizedY = laneTop + Math.max(0, existingPosition.y - laneMinExistingY);

  return {
    y: Math.max(laneTop, normalizedY),
    nextFallbackY: Math.max(fallbackY, normalizedY + dimensions.height),
  };
}

function createSequentialLaneBoxes(
  lane: RoadMapResolvedLane,
  viewport: RoadMapLayoutViewport,
  laneTop: number,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapLayoutNodeBox[] {
  const boxes: RoadMapLayoutNodeBox[] = [];
  let cursorY = laneTop;

  for (const node of lane.nodes) {
    const box = createRoadMapLayoutNodeBox(
      node,
      viewport,
      lane.x,
      cursorY,
      lane.id,
      lane.sectionKey,
      cursorY,
    );

    boxes.push(box);
    cursorY += box.height + tokens.minGapY;
  }

  return boxes;
}

function createNormalizedLaneBoxes(
  lane: RoadMapResolvedLane,
  viewport: RoadMapLayoutViewport,
  laneTop: number,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapLayoutNodeBox[] {
  const boxes: RoadMapLayoutNodeBox[] = [];
  let fallbackY = laneTop;

  for (const node of lane.nodes) {
    const { y, nextFallbackY } = normalizeLaneY(
      node,
      viewport,
      laneTop,
      lane.minExistingY,
      fallbackY,
    );

    const box = createRoadMapLayoutNodeBox(
      node,
      viewport,
      lane.x,
      y,
      lane.id,
      lane.sectionKey,
      y,
    );

    boxes.push(box);
    fallbackY = nextFallbackY + tokens.minGapY;
  }

  return boxes;
}

function createLaneBoxes(
  lane: RoadMapResolvedLane,
  viewport: RoadMapLayoutViewport,
  resolvedSectionTop: number,
  originalSectionTop: number,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapLayoutNodeBox[] {
  const laneTopOffset = Math.max(0, lane.top - originalSectionTop);
  const resolvedLaneTop = resolvedSectionTop + laneTopOffset;

  const shouldUseSequentialStack =
    (viewport === "desktop" && lane.id === "domain") ||
    (viewport === "mobile" && lane.id === "stack");

  if (shouldUseSequentialStack) {
    return createSequentialLaneBoxes(lane, viewport, resolvedLaneTop, tokens);
  }

  return createNormalizedLaneBoxes(lane, viewport, resolvedLaneTop, tokens);
}

function createSectionBoxes(
  section: RoadMapResolvedSection,
  viewport: RoadMapLayoutViewport,
  resolvedSectionTop: number,
  tokens: RoadMapViewportLayoutTokens,
): RoadMapLayoutNodeBox[] {
  const boxes: RoadMapLayoutNodeBox[] = [];

  for (const lane of section.lanes) {
    boxes.push(
      ...createLaneBoxes(
        lane,
        viewport,
        resolvedSectionTop,
        section.top,
        tokens,
      ),
    );
  }

  return boxes;
}

function computeViewportLayout(
  graph: RoadMapGraph,
  viewport: RoadMapLayoutViewport,
  tokenOverrides?: RoadMapViewportLayoutTokenOverrides,
): ComputeViewportLayoutResult {
  const { sections, tokens } = resolveRoadMapLanes(graph, viewport, {
    tokens: tokenOverrides,
  });

  const resolvedBoxes: RoadMapLayoutNodeBox[] = [];
  let nextSectionTop = tokens.paddingTop;

  for (const section of sections) {
    if (section.lanes.length === 0) {
      continue;
    }

    const resolvedSectionTop = Math.max(nextSectionTop, section.top);

    const rawSectionBoxes = createSectionBoxes(
      section,
      viewport,
      resolvedSectionTop,
      tokens,
    );

    if (rawSectionBoxes.length === 0) {
      continue;
    }

    const sectionBoxes = resolveRoadMapNodeCollisions(rawSectionBoxes, {
      minGapX: tokens.minGapX,
      minGapY: tokens.minGapY,
    });

    resolvedBoxes.push(...sectionBoxes);
    nextSectionTop = getRoadMapLayoutBottom(sectionBoxes) + tokens.sectionGapY;
  }

  return {
    tokens,
    positionMap: toResolvedRoadMapPositionMap(resolvedBoxes),
  };
}

export function computeRoadMapLayout(
  graph: RoadMapGraph,
  options: ComputeRoadMapLayoutOptions = {},
): RoadMapGraph {
  const desktopLayout = computeViewportLayout(
    graph,
    "desktop",
    options.desktop,
  );

  const mobileLayout = computeViewportLayout(
    graph,
    "mobile",
    options.mobile,
  );

  const nextNodes = graph.nodes.map((node) => {
    const desktop =
      desktopLayout.positionMap.get(node.id) ??
      node.desktop ??
      node.mobile ?? {
        x: desktopLayout.tokens.paddingX,
        y: desktopLayout.tokens.paddingTop,
      };

    const mobile =
      mobileLayout.positionMap.get(node.id) ??
      node.mobile ??
      node.desktop ?? {
        x: mobileLayout.tokens.paddingX,
        y: mobileLayout.tokens.paddingTop,
      };

    return {
      ...node,
      desktop,
      mobile,
    };
  });

  return {
    ...graph,
    nodes: nextNodes,
  };
}
