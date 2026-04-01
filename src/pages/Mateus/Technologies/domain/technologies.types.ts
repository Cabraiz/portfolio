// src/pages/Mateus/Technologies/domain/technologies.types.ts

export type TechnologyCategoryId =
  | "cloud"
  | "frontend"
  | "backend-jvm"
  | "backend-js"
  | "python"
  | "data"
  | "qa"
  | "observability";

export type TechnologyCategoryFilter = TechnologyCategoryId | "all";

export type TechnologySortMode =
  | "featured"
  | "years-desc"
  | "years-asc"
  | "name-asc";

export type TechnologyProficiencyTone =
  | "flagship"
  | "advanced"
  | "strong"
  | "solid"
  | "growing";

export type TechnologyShapeVariant =
  | "hex"
  | "rounded-hex"
  | "pill"
  | "panel";

export type TechnologyAssetKind =
  | "logo"
  | "icon"
  | "badge"
  | "screenshot"
  | "illustration";

export type TechnologyMediaAsset = Readonly<{
  id: string;
  kind: TechnologyAssetKind;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}>;

export type TechnologyCategory = Readonly<{
  id: TechnologyCategoryId;
  label: string;
  shortLabel?: string;
  description: string;
  order: number;
}>;

export type TechnologyItem = Readonly<{
  id: string;
  name: string;
  label?: string;
  shortName?: string;
  years: number | null;
  categoryId: TechnologyCategoryId;
  description?: string;
  summary?: string;
  aliases?: readonly string[];
  tags?: readonly string[];
  relatedIds?: readonly string[];
  featured?: boolean;
  hidden?: boolean;
  deprecated?: boolean;
  priority?: number;
  logoSrc?: string;
  accentCategoryId?: TechnologyCategoryId;
  shapeVariant?: TechnologyShapeVariant;
  heroAsset?: TechnologyMediaAsset | null;
  gallery?: readonly TechnologyMediaAsset[];
}>;

export type TechnologiesFiltersState = Readonly<{
  query: string;
  activeCategoryId: TechnologyCategoryFilter;
  minimumYears: number;
  featuredOnly: boolean;
  sortMode: TechnologySortMode;
}>;

export type TechnologyMetricCard = Readonly<{
  id: string;
  label: string;
  value: string;
  helperText: string;
}>;

export type TechnologyCategoryMetric = Readonly<{
  categoryId: TechnologyCategoryId;
  count: number;
  totalYears: number;
  averageYears: number;
  highlightedCount: number;
}>;

export type TechnologyExperienceBand = Readonly<{
  id: "0-2" | "3-4" | "5-7" | "8+";
  label: string;
  minYears: number;
  maxYears: number | null;
}>;

export type TechnologySpotlightState = Readonly<{
  activeTechnologyId: string | null;
  hoveredTechnologyId: string | null;
}>;
