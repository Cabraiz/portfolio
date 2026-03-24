export type LandingSectionId =
  | "home"
  | "portfolio"
  | "roadMap"
  | "pricing"
  | "live"
  | "contact";

export type LandingSectionDefinition = Readonly<{
  id: LandingSectionId;
  path: `/${string}`;
}>;

export const DEFAULT_LANDING_SECTION_ID: LandingSectionId = "home";

export const LANDING_SECTIONS: ReadonlyArray<LandingSectionDefinition> = [
  {
    id: "home",
    path: "/home",
  },
  {
    id: "portfolio",
    path: "/portfolio",
  },
  {
    id: "roadMap",
    path: "/roadmap",
  },
  {
    id: "pricing",
    path: "/pricing",
  },
  {
    id: "live",
    path: "/live",
  },
  {
    id: "contact",
    path: "/contact",
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
