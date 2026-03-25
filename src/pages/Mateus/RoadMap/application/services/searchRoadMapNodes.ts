import { ROADMAP_MIN_SEARCH_LENGTH } from "../../domain/model/roadmap.constants";
import { sortRoadMapNodes } from "../../domain/model/roadmap.selectors";
import type {
  RoadMapFilterState,
  RoadMapGraph,
  RoadMapNode,
} from "../../domain/model/roadmap.types";
import { filterRoadMapGraph } from "./filterRoadMapGraph";

export type SearchRoadMapNodesParams = Readonly<{
  graph: RoadMapGraph;
  query: string;
  filters?: Partial<RoadMapFilterState>;
  limit?: number;
}>;

export type SearchRoadMapNodeResult = Readonly<{
  node: RoadMapNode;
  score: number;
  matchedFields: readonly string[];
}>;

function normalizeText(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buildSearchEntries(node: RoadMapNode): Array<{
  field: string;
  value: string;
  weight: number;
}> {
  return [
    { field: "label", value: node.label, weight: 100 },
    { field: "shortLabel", value: node.shortLabel ?? "", weight: 80 },
    { field: "description", value: node.description ?? "", weight: 40 },
    { field: "tags", value: (node.tags ?? []).join(" "), weight: 30 },
    { field: "aliases", value: (node.aliases ?? []).join(" "), weight: 30 },
    { field: "summary", value: node.details?.summary ?? "", weight: 25 },
    {
      field: "whyItMatters",
      value: node.details?.whyItMatters ?? "",
      weight: 20,
    },
    {
      field: "whenToUse",
      value: (node.details?.whenToUse ?? []).join(" "),
      weight: 15,
    },
    {
      field: "whenNotToUse",
      value: (node.details?.whenNotToUse ?? []).join(" "),
      weight: 10,
    },
    {
      field: "useCases",
      value: (node.details?.useCases ?? []).join(" "),
      weight: 15,
    },
    {
      field: "cautions",
      value: (node.details?.cautions ?? []).join(" "),
      weight: 10,
    },
  ];
}

function scoreMatch(value: string, normalizedQuery: string, weight: number): number {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return weight + 40;
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return weight + 20;
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return weight;
  }

  return 0;
}

function scoreNode(
  node: RoadMapNode,
  normalizedQuery: string,
): SearchRoadMapNodeResult | null {
  const entries = buildSearchEntries(node);

  let score = 0;
  const matchedFields = new Set<string>();

  for (const entry of entries) {
    const currentScore = scoreMatch(entry.value, normalizedQuery, entry.weight);

    if (currentScore > 0) {
      score += currentScore;
      matchedFields.add(entry.field);
    }
  }

  if (score === 0) {
    return null;
  }

  return {
    node,
    score,
    matchedFields: Array.from(matchedFields),
  };
}

export function searchRoadMapNodes({
  graph,
  query,
  filters = {},
  limit = 12,
}: SearchRoadMapNodesParams): SearchRoadMapNodeResult[] {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < ROADMAP_MIN_SEARCH_LENGTH) {
    return [];
  }

  const filteredGraph = filterRoadMapGraph(graph, filters, {
    includeAncestors: false,
    includeRelated: false,
  });

  return sortRoadMapNodes(filteredGraph.visibleNodes)
    .map((node) => scoreNode(node, normalizedQuery))
    .filter((result): result is SearchRoadMapNodeResult => Boolean(result))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.node.label.localeCompare(right.node.label, "pt-BR", {
        sensitivity: "base",
      });
    })
    .slice(0, Math.max(1, limit));
}
