export type LandingSectionId =
  | "home"
  | "portfolio"
  | "roadMap"
  | "technologies"
  | "live"
  | "contact";

export type LandingSectionDefinition = Readonly<{
  id: LandingSectionId;
  label: string;
  path: `/${string}`;
  anchor?: `#${string}`;
  order: number;
  urlSyncEligible: boolean;
}>;

export const DEFAULT_LANDING_SECTION_ID: LandingSectionId = "home";

export const LANDING_SECTIONS: readonly LandingSectionDefinition[] = [
  {
    id: "home",
    label: "Início",
    path: "/home",
    anchor: "#home",
    order: 1,
    urlSyncEligible: true,
  },
  {
    id: "portfolio",
    label: "Portfólio",
    path: "/portfolio",
    anchor: "#portfolio",
    order: 2,
    urlSyncEligible: true,
  },
  {
    id: "roadMap",
    label: "RoadMap",
    path: "/roadmap",
    anchor: "#roadmap",
    order: 3,
    urlSyncEligible: true,
  },
  {
    id: "technologies",
    label: "Tecnologias",
    path: "/technologies",
    anchor: "#technologies",
    order: 4,
    urlSyncEligible: true,
  },
  {
    id: "live",
    label: "Ao Vivo",
    path: "/live",
    anchor: "#live",
    order: 5,
    urlSyncEligible: true,
  },
  {
    id: "contact",
    label: "Contato",
    path: "/contact",
    anchor: "#contact",
    order: 6,
    urlSyncEligible: true,
  },
] as const;

const LANDING_SECTION_IDS = new Set<LandingSectionId>(
  LANDING_SECTIONS.map((section) => section.id),
);

const LANDING_PATH_TO_SECTION_ID = new Map<string, LandingSectionId>(
  LANDING_SECTIONS.map((section) => [section.path, section.id]),
);

const LANDING_SECTION_ID_TO_PATH = new Map<LandingSectionId, string>(
  LANDING_SECTIONS.map((section) => [section.id, section.path]),
);

const LANDING_SECTION_ID_TO_DEFINITION = new Map<
  LandingSectionId,
  LandingSectionDefinition
>(LANDING_SECTIONS.map((section) => [section.id, section]));

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) {
    return "/";
  }

  const withoutHash = pathname.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  const trimmed = withoutQuery.trim();

  if (!trimmed) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsedSlashes !== "/" && collapsedSlashes.endsWith("/")) {
    return collapsedSlashes.slice(0, -1);
  }

  return collapsedSlashes;
}

export function normalizeLandingSectionId(
  value: string | null | undefined,
): LandingSectionId | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (LANDING_SECTION_IDS.has(trimmedValue as LandingSectionId)) {
    return trimmedValue as LandingSectionId;
  }

  return null;
}

export function getLandingSectionDefinition(
  sectionId: LandingSectionId,
): LandingSectionDefinition {
  return (
    LANDING_SECTION_ID_TO_DEFINITION.get(sectionId) ??
    LANDING_SECTION_ID_TO_DEFINITION.get(DEFAULT_LANDING_SECTION_ID)!
  );
}

export function getLandingSectionLabel(sectionId: LandingSectionId): string {
  return getLandingSectionDefinition(sectionId).label;
}

export function getLandingOrderedSections(): readonly LandingSectionDefinition[] {
  return [...LANDING_SECTIONS].sort((left, right) => left.order - right.order);
}

export function getLandingOrderedSectionIds(): readonly LandingSectionId[] {
  return getLandingOrderedSections().map((section) => section.id);
}

export function getLandingSectionsByIds(
  sectionIds: readonly LandingSectionId[],
): readonly LandingSectionDefinition[] {
  const allowedIds = new Set(sectionIds);

  return getLandingOrderedSections().filter((section) =>
    allowedIds.has(section.id),
  );
}

export function getLandingUrlSyncEligibleSectionIds(): readonly LandingSectionId[] {
  return getLandingOrderedSections()
    .filter((section) => section.urlSyncEligible)
    .map((section) => section.id);
}

export function getPathBySectionId(
  sectionId: LandingSectionId,
  fallbackSectionId: LandingSectionId = DEFAULT_LANDING_SECTION_ID,
): string {
  return (
    LANDING_SECTION_ID_TO_PATH.get(sectionId) ??
    LANDING_SECTION_ID_TO_PATH.get(fallbackSectionId) ??
    "/home"
  );
}

export function getSectionIdByPath(
  pathname: string | null | undefined,
): LandingSectionId | null {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    return DEFAULT_LANDING_SECTION_ID;
  }

  return LANDING_PATH_TO_SECTION_ID.get(normalizedPathname) ?? null;
}

export function isLandingPath(pathname: string | null | undefined): boolean {
  return getSectionIdByPath(pathname) !== null;
}
