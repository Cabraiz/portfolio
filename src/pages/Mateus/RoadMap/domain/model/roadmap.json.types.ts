import type {
  RoadMapCategoryId,
  RoadMapDemandLevel,
  RoadMapNodeDetails,
  RoadMapNodeKind,
} from "./roadmap.types";

export type RoadMapJsonNodeType =
  | "main"
  | "topic"
  | "subtopic"
  | "technology"
  | "concept";

export type RoadMapJsonGraphMeta = Readonly<{
  id?: string;
  title?: string;
  subtitle?: string;
}>;

export type RoadMapJsonDefaults = Readonly<{
  category?: RoadMapCategoryId;
  demand?: RoadMapDemandLevel;
}>;

export type RoadMapJsonGraphItem = Readonly<{
  uuid: string;
  nome: string;
  tier: number;
  parentUuid?: string | null;
  ordem?: number;
  tipo?: RoadMapJsonNodeType;
  kind?: RoadMapNodeKind;
  shortLabel?: string;
  description?: string;
  summary?: string;
  category?: RoadMapCategoryId;
  demand?: RoadMapDemandLevel;
  tags?: readonly string[];
  aliases?: readonly string[];
  featured?: boolean;
  isHidden?: boolean;
  isDeprecated?: boolean;
  details?: RoadMapNodeDetails;
}>;

export type RoadMapJsonGraphDocument = Readonly<{
  version?: number;
  graph?: RoadMapJsonGraphMeta;
  defaults?: RoadMapJsonDefaults;
  items: readonly RoadMapJsonGraphItem[];
}>;
