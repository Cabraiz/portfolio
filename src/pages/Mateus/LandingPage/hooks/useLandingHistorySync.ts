// src/pages/Mateus/LandingPage/hooks/useLandingHistorySync.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
  getPathBySectionId,
  getSectionIdByPath,
  isLandingPath,
  type LandingSectionId,
} from "../../../../features/navigation/landingSections";
import { getLandingUrlSyncEligibleSectionIds } from "../landingSections.config";
import type { LandingSectionViewportMode } from "../landing.types";

export type LandingHistorySyncReason =
  | "initial"
  | "commit"
  | "replace"
  | "push"
  | "popstate";

export type LandingHistorySyncMode = "replace" | "push";

export type LandingHistorySyncMeta = Readonly<{
  previousSectionId: LandingSectionId;
  nextSectionId: LandingSectionId;
  nextPath: string;
  reason: LandingHistorySyncReason;
}>;

export type UseLandingHistorySyncParams = Readonly<{
  committedSectionId: LandingSectionId;
  defaultSectionId?: LandingSectionId;
  disabled?: boolean;
  viewportMode?: LandingSectionViewportMode;
  urlSyncEligibleSectionIds?: readonly LandingSectionId[];
  historyMode?: LandingHistorySyncMode;
  resolveHistoryMode?: (params: Readonly<{
    previousSectionId: LandingSectionId;
    nextSectionId: LandingSectionId;
    reason: Exclude<LandingHistorySyncReason, "initial" | "popstate">;
  }>) => LandingHistorySyncMode;
  onRouteSectionChange?: (
    nextSectionId: LandingSectionId,
    meta: LandingHistorySyncMeta,
  ) => void;
}>;

export type UseLandingHistorySyncResult = Readonly<{
  routeSectionId: LandingSectionId;
  resolveRoutePath: (sectionId: LandingSectionId) => string;
  isUrlSyncEligible: (sectionId: LandingSectionId) => boolean;
  replaceRouteSection: (sectionId: LandingSectionId) => void;
  pushRouteSection: (sectionId: LandingSectionId) => void;
}>;

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

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

function normalizeLandingSectionIdSafe(
  sectionId: LandingSectionId | null | undefined,
): LandingSectionId | null {
  return sectionId ?? null;
}

function resolveSectionIdFromPathname(params: Readonly<{
  pathname: string | null | undefined;
  defaultSectionId: LandingSectionId;
  eligibleSectionIds: readonly LandingSectionId[];
}>): LandingSectionId {
  const { pathname, defaultSectionId, eligibleSectionIds } = params;

  const fallbackSectionId = resolveEligibleFallbackSectionId(
    defaultSectionId,
    eligibleSectionIds,
  );

  if (!isLandingPath(pathname)) {
    return fallbackSectionId;
  }

  const nextSectionId = normalizeLandingSectionIdSafe(
    getSectionIdByPath(pathname ?? "/"),
  );

  if (!nextSectionId || !eligibleSectionIds.includes(nextSectionId)) {
    return fallbackSectionId;
  }

  return nextSectionId;
}

export default function useLandingHistorySync({
  committedSectionId,
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  disabled = false,
  viewportMode = "desktop",
  urlSyncEligibleSectionIds,
  historyMode = "replace",
  resolveHistoryMode,
  onRouteSectionChange,
}: UseLandingHistorySyncParams): UseLandingHistorySyncResult {
  const eligibleSectionIds = useMemo(() => {
    return normalizeEligibleSectionIds(
      urlSyncEligibleSectionIds?.length
        ? urlSyncEligibleSectionIds
        : getLandingUrlSyncEligibleSectionIds(viewportMode),
    );
  }, [urlSyncEligibleSectionIds, viewportMode]);

  const resolvedDefaultSectionId = useMemo(() => {
    return resolveEligibleFallbackSectionId(defaultSectionId, eligibleSectionIds);
  }, [defaultSectionId, eligibleSectionIds]);

  const isUrlSyncEligible = useCallback(
    (sectionId: LandingSectionId): boolean => {
      return eligibleSectionIds.includes(sectionId);
    },
    [eligibleSectionIds],
  );

  const resolveRoutePath = useCallback(
    (sectionId: LandingSectionId): string => {
      const normalizedSectionId = isUrlSyncEligible(sectionId)
        ? sectionId
        : resolvedDefaultSectionId;

      return getPathBySectionId(
        normalizedSectionId,
        resolvedDefaultSectionId,
      );
    },
    [isUrlSyncEligible, resolvedDefaultSectionId],
  );

  const initialRouteSectionId = useMemo(() => {
    const browserWindow = getBrowserWindow();

    return resolveSectionIdFromPathname({
      pathname: browserWindow?.location.pathname,
      defaultSectionId: resolvedDefaultSectionId,
      eligibleSectionIds,
    });
  }, [eligibleSectionIds, resolvedDefaultSectionId]);

  const [routeSectionId, setRouteSectionId] =
    useState<LandingSectionId>(initialRouteSectionId);

  const routeSectionIdRef = useRef<LandingSectionId>(initialRouteSectionId);
  const didRunInitialSyncRef = useRef(false);

  useEffect(() => {
    routeSectionIdRef.current = routeSectionId;
  }, [routeSectionId]);

  const commitRouteSectionState = useCallback(
    (
      nextSectionId: LandingSectionId,
      reason: LandingHistorySyncReason,
      nextPath: string,
    ): void => {
      setRouteSectionId((previousSectionId: LandingSectionId) => {
        if (previousSectionId === nextSectionId) {
          return previousSectionId;
        }

        onRouteSectionChange?.(nextSectionId, {
          previousSectionId,
          nextSectionId,
          nextPath,
          reason,
        });

        return nextSectionId;
      });
    },
    [onRouteSectionChange],
  );

  const writeHistory = useCallback(
    (
      sectionId: LandingSectionId,
      reason: Exclude<LandingHistorySyncReason, "initial" | "popstate">,
      modeOverride?: LandingHistorySyncMode,
    ): void => {
      const browserWindow = getBrowserWindow();

      if (browserWindow === null || disabled) {
        return;
      }

      const normalizedSectionId = isUrlSyncEligible(sectionId)
        ? sectionId
        : resolvedDefaultSectionId;

      const nextPath = resolveRoutePath(normalizedSectionId);
      const currentPath = normalizePathname(browserWindow.location.pathname);
      const normalizedNextPath = normalizePathname(nextPath);

      commitRouteSectionState(normalizedSectionId, reason, normalizedNextPath);

      if (currentPath === normalizedNextPath) {
        return;
      }

      const resolvedMode =
        modeOverride ??
        resolveHistoryMode?.({
          previousSectionId: routeSectionIdRef.current,
          nextSectionId: normalizedSectionId,
          reason,
        }) ??
        historyMode;

      const nextState = {
        ...(browserWindow.history.state ?? {}),
        landingSectionId: normalizedSectionId,
      };

      if (resolvedMode === "push") {
        browserWindow.history.pushState(nextState, "", normalizedNextPath);
        return;
      }

      browserWindow.history.replaceState(nextState, "", normalizedNextPath);
    },
    [
      commitRouteSectionState,
      disabled,
      historyMode,
      isUrlSyncEligible,
      resolveHistoryMode,
      resolveRoutePath,
      resolvedDefaultSectionId,
    ],
  );

  const replaceRouteSection = useCallback(
    (sectionId: LandingSectionId): void => {
      writeHistory(sectionId, "replace", "replace");
    },
    [writeHistory],
  );

  const pushRouteSection = useCallback(
    (sectionId: LandingSectionId): void => {
      writeHistory(sectionId, "push", "push");
    },
    [writeHistory],
  );

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null || disabled) {
      return;
    }

    const nextSectionId = resolveSectionIdFromPathname({
      pathname: browserWindow.location.pathname,
      defaultSectionId: resolvedDefaultSectionId,
      eligibleSectionIds,
    });

    const nextPath = resolveRoutePath(nextSectionId);

    commitRouteSectionState(
      nextSectionId,
      didRunInitialSyncRef.current ? "commit" : "initial",
      nextPath,
    );

    didRunInitialSyncRef.current = true;
  }, [
    commitRouteSectionState,
    disabled,
    eligibleSectionIds,
    resolveRoutePath,
    resolvedDefaultSectionId,
  ]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    writeHistory(committedSectionId, "commit");
  }, [committedSectionId, disabled, writeHistory]);

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null || disabled) {
      return;
    }

    const handlePopState = (): void => {
      const nextSectionId = resolveSectionIdFromPathname({
        pathname: browserWindow.location.pathname,
        defaultSectionId: resolvedDefaultSectionId,
        eligibleSectionIds,
      });

      const nextPath = resolveRoutePath(nextSectionId);

      commitRouteSectionState(nextSectionId, "popstate", nextPath);
    };

    browserWindow.addEventListener("popstate", handlePopState);

    return () => {
      browserWindow.removeEventListener("popstate", handlePopState);
    };
  }, [
    commitRouteSectionState,
    disabled,
    eligibleSectionIds,
    resolveRoutePath,
    resolvedDefaultSectionId,
  ]);

  return {
    routeSectionId,
    resolveRoutePath,
    isUrlSyncEligible,
    replaceRouteSection,
    pushRouteSection,
  };
}
