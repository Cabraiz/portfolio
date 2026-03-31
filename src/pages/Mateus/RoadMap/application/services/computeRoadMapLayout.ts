import type {
  RoadMapViewportLayoutTokenOverrides,
  RoadMapViewportLayoutTokens,
} from "../../domain/model/roadmap.layout.types";
import type {
  RoadMapGraph,
  RoadMapPosition,
} from "../../domain/model/roadmap.types";
import { resolveRoadMapTreeLayout } from "./resolveRoadMapTreeLayout";

export type ComputeRoadMapLayoutOptions = Readonly<{
  desktop?: RoadMapViewportLayoutTokenOverrides;
  mobile?: RoadMapViewportLayoutTokenOverrides;
}>;

type ComputeViewportLayoutResult = Readonly<{
  tokens: RoadMapViewportLayoutTokens;
  positionMap: ReadonlyMap<string, RoadMapPosition>;
}>;

function computeViewportLayout(
  graph: RoadMapGraph,
  viewport: "desktop" | "mobile",
  tokenOverrides?: RoadMapViewportLayoutTokenOverrides,
): ComputeViewportLayoutResult {
  const { tokens, positionMap } = resolveRoadMapTreeLayout(graph, viewport, {
    tokens: tokenOverrides,
  });

  return {
    tokens,
    positionMap,
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
