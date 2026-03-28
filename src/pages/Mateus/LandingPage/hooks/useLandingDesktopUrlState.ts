import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
  getPathBySectionId,
  getSectionIdByPath,
  isLandingPath,
  type LandingSectionId,
} from "../../../../features/navigation/landingSections";
import { getLandingUrlSyncEligibleSectionIds } from "../landingSections.config";

export type LandingDesktopUrlChangeReason =
  | "initial"
  | "popstate"
  | "replace";

export type LandingDesktopUrlChangeMeta = Readonly<{
  previousSectionId: LandingSectionId;
  nextPath: string;
  reason: LandingDesktopUrlChangeReason;
}>;

export type UseLandingDesktopUrlStateParams = Readonly<{
  defaultSectionId?: LandingSectionId;
  urlSyncEligibleSectionIds?: readonly LandingSectionId[];
  onRouteSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingDesktopUrlChangeMeta,
  ) => void;
}>;

export type UseLandingDesktopUrlStateResult = Readonly<{
  routeSectionId: LandingSectionId;
  replaceRouteSection: (
    sectionId: LandingSectionId,
    options?: Readonly<{
      reason?: Exclude<LandingDesktopUrlChangeReason, "initial" | "popstate">;
    }>,
  ) => void;
  resolveRoutePath: (sectionId: LandingSectionId) => string;
  isUrlSyncEligible: (sectionId: LandingSectionId) => boolean;
}>;

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

function normalizeEligibleSectionIds(
  sectionIds: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  return Array.from(new Set(sectionIds));
}

function resolveEligibleFallbackSectionId(
  defaultSectionId: LandingSectionId,
  eligibleSectionIds: readonly LandingSectionId[],
): LandingSectionId {
  if (eligibleSectionIds.includes(defaultSectionId)) {
    return defaultSectionId;
  }

  return eligibleSectionIds[0] ?? DEFAULT_LANDING_SECTION_ID;
}

function resolveSectionIdFromPathname(params: Readonly<{
  pathname: string | null | undefined;
  defaultSectionId: LandingSectionId;
  eligibleSectionIds: readonly LandingSectionId[];
}>): LandingSectionId {
  const {
    pathname,
    defaultSectionId,
    eligibleSectionIds,
  } = params;

  const eligibleFallbackSectionId = resolveEligibleFallbackSectionId(
    defaultSectionId,
    eligibleSectionIds,
  );

  if (!isLandingPath(pathname)) {
    return eligibleFallbackSectionId;
  }

  const nextSectionId = getSectionIdByPath(pathname) ?? eligibleFallbackSectionId;

  if (!eligibleSectionIds.includes(nextSectionId)) {
    return eligibleFallbackSectionId;
  }

  return nextSectionId;
}

export default function useLandingDesktopUrlState({
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  urlSyncEligibleSectionIds,
  onRouteSectionChange,
}: UseLandingDesktopUrlStateParams = {}): UseLandingDesktopUrlStateResult {
  const resolvedUrlSyncEligibleSectionIds = useMemo(() => {
    return normalizeEligibleSectionIds(
      urlSyncEligibleSectionIds ?? getLandingUrlSyncEligibleSectionIds("desktop"),
    );
  }, [urlSyncEligibleSectionIds]);

  const resolvedDefaultSectionId = useMemo(() => {
    return resolveEligibleFallbackSectionId(
      defaultSectionId,
      resolvedUrlSyncEligibleSectionIds,
    );
  }, [defaultSectionId, resolvedUrlSyncEligibleSectionIds]);

  const isUrlSyncEligible = useCallback(
    (sectionId: LandingSectionId): boolean => {
      return resolvedUrlSyncEligibleSectionIds.includes(sectionId);
    },
    [resolvedUrlSyncEligibleSectionIds],
  );

  const resolveRoutePath = useCallback(
    (sectionId: LandingSectionId): string => {
      const normalizedSectionId = isUrlSyncEligible(sectionId)
        ? sectionId
        : resolvedDefaultSectionId;

      return getPathBySectionId(normalizedSectionId, resolvedDefaultSectionId);
    },
    [isUrlSyncEligible, resolvedDefaultSectionId],
  );

  const [routeSectionId, setRouteSectionId] = useState<LandingSectionId>(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return resolvedDefaultSectionId;
    }

    return resolveSectionIdFromPathname({
      pathname: browserWindow.location.pathname,
      defaultSectionId: resolvedDefaultSectionId,
      eligibleSectionIds: resolvedUrlSyncEligibleSectionIds,
    });
  });

  const routeSectionIdRef = useRef<LandingSectionId>(routeSectionId);
  const lastKnownPathRef = useRef<string | null>(null);

  useEffect(() => {
    routeSectionIdRef.current = routeSectionId;
  }, [routeSectionId]);

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const nextSectionId = resolveSectionIdFromPathname({
      pathname: browserWindow.location.pathname,
      defaultSectionId: resolvedDefaultSectionId,
      eligibleSectionIds: resolvedUrlSyncEligibleSectionIds,
    });

    const nextPath = resolveRoutePath(nextSectionId);

    lastKnownPathRef.current = nextPath;

    setRouteSectionId((previousSectionId) =>
      previousSectionId === nextSectionId ? previousSectionId : nextSectionId,
    );
  }, [
    resolveRoutePath,
    resolvedDefaultSectionId,
    resolvedUrlSyncEligibleSectionIds,
  ]);

  const replaceRouteSection = useCallback(
    (
      sectionId: LandingSectionId,
      options?: Readonly<{
        reason?: Exclude<LandingDesktopUrlChangeReason, "initial" | "popstate">;
      }>,
    ): void => {
      const browserWindow = getBrowserWindow();

      if (browserWindow === null) {
        return;
      }

      const nextSectionId = isUrlSyncEligible(sectionId)
        ? sectionId
        : resolvedDefaultSectionId;

      const nextPath = resolveRoutePath(nextSectionId);
      const currentPath = browserWindow.location.pathname;
      const previousSectionId = routeSectionIdRef.current;

      if (
        currentPath !== nextPath &&
        lastKnownPathRef.current !== nextPath
      ) {
        browserWindow.history.replaceState(
          browserWindow.history.state,
          "",
          nextPath,
        );
      }

      lastKnownPathRef.current = nextPath;

      setRouteSectionId((currentSectionId) =>
        currentSectionId === nextSectionId
          ? currentSectionId
          : nextSectionId,
      );

      if (previousSectionId !== nextSectionId) {
        onRouteSectionChange?.(nextSectionId, {
          previousSectionId,
          nextPath,
          reason: options?.reason ?? "replace",
        });
      }
    },
    [
      isUrlSyncEligible,
      onRouteSectionChange,
      resolveRoutePath,
      resolvedDefaultSectionId,
    ],
  );

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const handlePopState = (): void => {
      const nextSectionId = resolveSectionIdFromPathname({
        pathname: browserWindow.location.pathname,
        defaultSectionId: resolvedDefaultSectionId,
        eligibleSectionIds: resolvedUrlSyncEligibleSectionIds,
      });

      const nextPath = resolveRoutePath(nextSectionId);

      lastKnownPathRef.current = nextPath;

      setRouteSectionId((previousSectionId) => {
        if (previousSectionId === nextSectionId) {
          return previousSectionId;
        }

        onRouteSectionChange?.(nextSectionId, {
          previousSectionId,
          nextPath,
          reason: "popstate",
        });

        return nextSectionId;
      });
    };

    browserWindow.addEventListener("popstate", handlePopState);

    return () => {
      browserWindow.removeEventListener("popstate", handlePopState);
    };
  }, [
    onRouteSectionChange,
    resolveRoutePath,
    resolvedDefaultSectionId,
    resolvedUrlSyncEligibleSectionIds,
  ]);

  return {
    routeSectionId,
    replaceRouteSection,
    resolveRoutePath,
    isUrlSyncEligible,
  };
}
