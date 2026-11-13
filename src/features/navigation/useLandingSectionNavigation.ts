import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useLenis } from "lenis/react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  DEFAULT_LANDING_SECTION_ID,
  getPathBySectionId,
  isLandingPath,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "./landingSections";
import { getLandingUrlSyncEligibleSectionIds } from "../../pages/Mateus/LandingPage/landingSections.config";
import { resolveLandingNavbarOffsetPx } from "../../pages/Mateus/LandingPage/landingLayout.tokens";
import useLandingActiveSection, {
  type ActiveSectionChangeReason,
} from "../../pages/Mateus/LandingPage/hooks/useLandingActiveSection";
import type { LandingSectionObservation } from "../../pages/Mateus/LandingPage/hooks/useLandingCommittedSection";
import {
  getStoreSnapshot,
  patchStoreState,
  subscribeToStore,
  useLandingSectionNavigationStoreSync,
} from "./useLandingSectionNavigation.store";
import {
  normalizePathname,
  normalizeSectionIds,
  resolveEligibleFallbackSectionId,
  resolveRouteSectionIdFromPathname,
  scrollToSectionTarget,
  writeRoutePathToBrowserHistory,
} from "./useLandingSectionNavigation.route";
import type {
  LandingSectionNavigationNavigateOptions,
  LenisLike,
  UseLandingSectionNavigationParams,
  UseLandingSectionNavigationResult,
} from "./useLandingSectionNavigation.types";

export type {
  LandingSectionNavigationNavigateOptions,
  UseLandingSectionNavigationParams,
  UseLandingSectionNavigationResult,
} from "./useLandingSectionNavigation.types";

export default function useLandingSectionNavigation(
  params: UseLandingSectionNavigationParams = {},
): UseLandingSectionNavigationResult {
  const {
    containerRef,
    defaultSectionId = DEFAULT_LANDING_SECTION_ID,
    sectionIds,
    sectionSelector,
    viewportMode = "desktop",
    navbarOffsetPx,
    activationViewportRatio,
    disabled = false,
    viewportWidth,
    tokens,
    scheduling,
    urlSyncEligibleSectionIds,
    syncUrl = true,
    scrollDuration = 1.05,
  } = params;

  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis() as LenisLike;

  const storeSnapshot = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getStoreSnapshot,
  );

  const resolvedSectionIds = useMemo(() => {
    return normalizeSectionIds(sectionIds);
  }, [sectionIds]);

  const resolvedUrlSyncEligibleSectionIds = useMemo(() => {
    return normalizeSectionIds(
      urlSyncEligibleSectionIds ??
        getLandingUrlSyncEligibleSectionIds(
          viewportMode === "mobile" ? "mobile" : "desktop",
        ),
    );
  }, [urlSyncEligibleSectionIds, viewportMode]);

  const resolvedDefaultSectionId = useMemo(() => {
    return resolveEligibleFallbackSectionId(
      defaultSectionId,
      resolvedSectionIds,
    );
  }, [defaultSectionId, resolvedSectionIds]);

  const getResolvedNavbarOffsetPx = useCallback((): number => {
    if (typeof navbarOffsetPx === "number" && Number.isFinite(navbarOffsetPx)) {
      return navbarOffsetPx;
    }

    return resolveLandingNavbarOffsetPx(viewportMode);
  }, [navbarOffsetPx, viewportMode]);

  const resolvedNavbarOffsetPx = getResolvedNavbarOffsetPx();

  const routeSectionIdFromLocation = useMemo(() => {
    return resolveRouteSectionIdFromPathname({
      pathname: location.pathname,
      defaultSectionId: resolvedDefaultSectionId,
      eligibleSectionIds: resolvedUrlSyncEligibleSectionIds,
    });
  }, [
    location.pathname,
    resolvedDefaultSectionId,
    resolvedUrlSyncEligibleSectionIds,
  ]);

  const initialRouteSectionIdRef = useRef<LandingSectionId>(
    routeSectionIdFromLocation,
  );

  const fallbackContainerRef = useRef<HTMLElement | null>(null);
  const resolvedContainerRef = containerRef ?? fallbackContainerRef;
  const controllerEnabled = Boolean(containerRef) && !disabled;

  const activeSectionState = useLandingActiveSection({
    containerRef: resolvedContainerRef,
    defaultSectionId: initialRouteSectionIdRef.current,
    sectionIds: resolvedSectionIds,
    sectionSelector,
    viewportMode,
    navbarOffsetPx: resolvedNavbarOffsetPx,
    activationViewportRatio,
    disabled: !controllerEnabled,
    viewportWidth,
    tokens,
    scheduling,
  });

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

      return getPathBySectionId(
        normalizedSectionId,
        resolvedDefaultSectionId,
      );
    },
    [isUrlSyncEligible, resolvedDefaultSectionId],
  );

  useLandingSectionNavigationStoreSync(
    routeSectionIdFromLocation,
    controllerEnabled,
    activeSectionState,
  );

  const replaceRouteSection = useCallback(
    (
      sectionId: LandingSectionId,
      options?: Readonly<{
        replace?: boolean;
      }>,
    ): void => {
      const normalizedSectionId = isUrlSyncEligible(sectionId)
        ? sectionId
        : resolvedDefaultSectionId;

      const nextPath = resolveRoutePath(normalizedSectionId);
      const currentPathIsLanding = isLandingPath(location.pathname);

      patchStoreState({
        routeSectionId: normalizedSectionId,
      });

      if (currentPathIsLanding) {
        writeRoutePathToBrowserHistory({
          nextPath,
          sectionId: normalizedSectionId,
          replace: options?.replace ?? true,
        });
        return;
      }

      if (
        normalizePathname(location.pathname) === normalizePathname(nextPath)
      ) {
        return;
      }

      navigate(nextPath, {
        replace: options?.replace ?? true,
      });
    },
    [
      isUrlSyncEligible,
      location.pathname,
      navigate,
      resolveRoutePath,
      resolvedDefaultSectionId,
    ],
  );

  const getSectionElement = useCallback(
    (sectionId: LandingSectionId): HTMLElement | null => {
      if (controllerEnabled) {
        return activeSectionState.getSectionElement(sectionId);
      }

      return getStoreSnapshot().getSectionElement?.(sectionId) ?? null;
    },
    [controllerEnabled, activeSectionState.getSectionElement],
  );

  const resolveObservationBySectionId = useCallback(
    (
      sectionId: LandingSectionId,
    ): LandingSectionObservation<LandingSectionId> | null => {
      if (controllerEnabled) {
        return activeSectionState.resolveObservationBySectionId(sectionId);
      }

      return (
        getStoreSnapshot().resolveObservationBySectionId?.(sectionId) ?? null
      );
    },
    [controllerEnabled, activeSectionState.resolveObservationBySectionId],
  );

  const refreshActiveSection = useCallback(
    (reason: ActiveSectionChangeReason = "refresh"): void => {
      if (controllerEnabled) {
        activeSectionState.refreshActiveSection(reason);
        return;
      }

      getStoreSnapshot().refreshActiveSection?.(reason);
    },
    [controllerEnabled, activeSectionState.refreshActiveSection],
  );

  const setActiveSectionId = useCallback(
    (sectionId: LandingSectionId): void => {
      const normalizedSectionId = normalizeLandingSectionId(sectionId);

      if (!normalizedSectionId) {
        return;
      }

      patchStoreState({
        activeSectionId: normalizedSectionId,
        observedSectionId: normalizedSectionId,
        committedSectionId: normalizedSectionId,
      });

      if (controllerEnabled) {
        activeSectionState.setActiveSectionId(normalizedSectionId);
        return;
      }

      getStoreSnapshot().setActiveSectionId?.(normalizedSectionId);
    },
    [controllerEnabled, activeSectionState.setActiveSectionId],
  );

  const navigateToSection = useCallback(
    (
      sectionId: LandingSectionId,
      options?: LandingSectionNavigationNavigateOptions,
    ): void => {
      const normalizedSectionId = normalizeLandingSectionId(sectionId);

      if (!normalizedSectionId) {
        return;
      }

      const nextSectionId = isUrlSyncEligible(normalizedSectionId)
        ? normalizedSectionId
        : resolvedDefaultSectionId;

      const nextPath = resolveRoutePath(nextSectionId);
      const shouldSyncUrl = options?.syncUrl ?? syncUrl;
      const currentPathIsLanding = isLandingPath(location.pathname);

      patchStoreState({
        activeSectionId: nextSectionId,
        observedSectionId: nextSectionId,
        committedSectionId: nextSectionId,
        routeSectionId: nextSectionId,
      });

      setActiveSectionId(nextSectionId);

      const targetElement = getSectionElement(nextSectionId);
      const shouldScrollLocally =
        Boolean(targetElement) &&
        (currentPathIsLanding || options?.forceScroll === true);

      if (targetElement && shouldScrollLocally) {
        scrollToSectionTarget({
          target: targetElement,
          lenis,
          offsetPx: options?.offsetPx ?? (
            nextSectionId === "portfolio" && targetElement.closest("main[data-landing-viewport='mobile']")
              ? 0 : getResolvedNavbarOffsetPx()
          ),
          duration: options?.duration ?? scrollDuration,
        });

        if (shouldSyncUrl) {
          writeRoutePathToBrowserHistory({
            nextPath,
            sectionId: nextSectionId,
            replace: options?.replace ?? true,
          });
        }

        if (typeof globalThis.window !== "undefined") {
          globalThis.window.requestAnimationFrame(() => {
            getStoreSnapshot().refreshActiveSection?.("refresh");
          });

          globalThis.window.setTimeout(() => {
            getStoreSnapshot().refreshActiveSection?.("refresh");
          }, 180);
        }

        return;
      }

      navigate(nextPath, {
        replace: options?.replace ?? false,
      });
    },
    [
      getResolvedNavbarOffsetPx,
      getSectionElement,
      isUrlSyncEligible,
      lenis,
      location.pathname,
      navigate,
      resolveRoutePath,
      resolvedDefaultSectionId,
      scrollDuration,
      setActiveSectionId,
      syncUrl,
    ],
  );

  return {
    activeSectionId: controllerEnabled
      ? activeSectionState.activeSectionId
      : storeSnapshot.activeSectionId,
    observedSectionId: controllerEnabled
      ? activeSectionState.observedSectionId
      : storeSnapshot.observedSectionId,
    committedSectionId: controllerEnabled
      ? activeSectionState.committedSectionId
      : storeSnapshot.committedSectionId,
    routeSectionId: storeSnapshot.routeSectionId,
    observations: controllerEnabled
      ? activeSectionState.observations
      : storeSnapshot.observations,
    controllerReady: controllerEnabled
      ? true
      : storeSnapshot.controllerReady,
    navigateToSection,
    replaceRouteSection,
    resolveRoutePath,
    isUrlSyncEligible,
    refreshActiveSection,
    resolveObservationBySectionId,
    getSectionElement,
    setActiveSectionId,
  };
}
