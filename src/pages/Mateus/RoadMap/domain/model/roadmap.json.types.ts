import type {
  RoadMapCategoryId,
  RoadMapDemandLevel,
  RoadMapNodeDetails,
  RoadMapNodeKind,
  RoadMapPosition,
  RoadMapRelationType,
} from "./roadmap.types";

export type RoadMapJsonNodeType =
  | "main"
  | "topic"
  | "subtopic"
  | "technology"
  | "concept";

export type RoadMapJsonRelationAlias =
  | "has_topic"
  | "has_subtopic"
  | "requires"
  | "alternative_to"
  | "complements"
  | "specializes";

export type RoadMapJsonRelationValue =
  | RoadMapJsonRelationAlias
  | RoadMapRelationType;

export type RoadMapJsonGraphMeta = Readonly<{
  id?: string;
  title?: string;
  subtitle?: string;
}>;

export type RoadMapJsonDefaults = Readonly<{
  category?: RoadMapCategoryId;
  demand?: RoadMapDemandLevel;
}>;

export type RoadMapJsonNode = Readonly<{
  id: string;
  label: string;
  type?: RoadMapJsonNodeType;
  kind?: RoadMapNodeKind;
  shortLabel?: string;
  description?: string;
  summary?: string;
  category?: RoadMapCategoryId;
  demand?: RoadMapDemandLevel;
  parentId?: string | null;
  tags?: readonly string[];
  aliases?: readonly string[];
  featured?: boolean;
  isHidden?: boolean;
  isDeprecated?: boolean;
  desktop?: RoadMapPosition;
  mobile?: RoadMapPosition;
  details?: RoadMapNodeDetails;
}>;

export type RoadMapJsonEdge = Readonly<{
  id?: string;
  from: string;
  to: string;
  relation: RoadMapJsonRelationValue;
  label?: string;
  strength?: 1 | 2 | 3 | 4 | 5;
  isBidirectional?: boolean;
}>;

export type RoadMapJsonCluster = Readonly<{
  id: string;
  label: string;
  description?: string;
  category?: RoadMapCategoryId;
  nodeIds: readonly string[];
}>;

export type RoadMapJsonGraphDocument = Readonly<{
  version?: number;
  graph?: RoadMapJsonGraphMeta;
  defaults?: RoadMapJsonDefaults;
  nodes: readonly RoadMapJsonNode[];
  edges?: readonly RoadMapJsonEdge[];
  clusters?: readonly RoadMapJsonCluster[];
}>;

export type RoadMapJsonRelationship = Readonly<{
  type: RoadMapJsonRelationValue;
  target: string;
  label?: string;
  strength?: 1 | 2 | 3 | 4 | 5;
  isBidirectional?: boolean;
}>;

export type RoadMapJsonRelationshipSource = Readonly<{
  entity: string;
  label?: string;
  relationships: readonly RoadMapJsonRelationship[];
}>;

export type RoadMapJsonRelationshipsDocument = Readonly<{
  version?: number;
  entities: readonly RoadMapJsonRelationshipSource[];
}>;
