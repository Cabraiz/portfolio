import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useLenis } from "lenis/react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  DEFAULT_LANDING_SECTION_ID,
  LANDING_SECTIONS,
  getPathBySectionId,
  isLandingPath,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "./landingSections";
import { getLandingUrlSyncEligibleSectionIds } from "../../pages/Mateus/LandingPage/landingSections.config";
import { resolveLandingNavbarOffsetPx } from "../../pages/Mateus/LandingPage/landingLayout.tokens";
import type { LandingActiveSectionCommitTokens } from "../../pages/Mateus/LandingPage/landingActiveSection.tokens";
import useLandingActiveSection, {
  type ActiveSectionChangeReason,
  type UseLandingActiveSectionSchedulingOptions,
} from "../../pages/Mateus/LandingPage/hooks/useLandingActiveSection";
import type { LandingSectionObservation } from "../../pages/Mateus/LandingPage/hooks/useLandingCommittedSection";
import type { LandingSectionViewportMode } from "../../pages/Mateus/LandingPage/landing.types";

type LenisLike =
  | Readonly<{
      scrollTo: (
        target: number | HTMLElement,
        options?: Readonly<{
          offset?: number;
          duration?: number;
          easing?: (value: number) => number;
        }>,
      ) => void;
    }>
  | null
  | undefined;

export type LandingSectionNavigationNavigateOptions = Readonly<{
  /**
   * Quando true, força replace na URL.
   * Para clique do navbar na própria landing, replace costuma ser o mais limpo.
   */
  replace?: boolean;

  /**
   * Mantém a URL sincronizada como efeito secundário.
   */
  syncUrl?: boolean;

  /**
   * Força tentativa de scroll local mesmo que a rota atual não pareça landing.
   */
  forceScroll?: boolean;

  /**
   * Override fino do offset do scroll.
   */
  offsetPx?: number;

  /**
   * Override fino da duração do scroll.
   */
  duration?: number;
}>;

export type UseLandingSectionNavigationParams = Readonly<{
  /**
   * Quando informado, o hook opera em modo controller:
   * observa a landing real e alimenta o store compartilhado.
   *
   * Quando omitido, o hook opera em modo consumer:
   * apenas consome o estado centralizado.
   */
  containerRef?: Readonly<{ current: HTMLElement | null }>;

  defaultSectionId?: LandingSectionId;
  sectionIds?: readonly LandingSectionId[];
  sectionSelector?: string;
  viewportMode?: LandingSectionViewportMode;
  navbarOffsetPx?: number;
  activationViewportRatio?: number;
  disabled?: boolean;
  viewportWidth?: number | null;
  tokens?: Partial<LandingActiveSectionCommitTokens>;
  scheduling?: UseLandingActiveSectionSchedulingOptions;

  /**
   * Por padrão, usa as seções elegíveis da config da landing.
   */
  urlSyncEligibleSectionIds?: readonly LandingSectionId[];

  /**
   * A URL continua secundária. Default = true.
   */
  syncUrl?: boolean;

  /**
   * Duração padrão do scroll programático.
   */
  scrollDuration?: number;
}>;

export type UseLandingSectionNavigationResult = Readonly<{
  activeSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  committedSectionId: LandingSectionId;
  routeSectionId: LandingSectionId;

  observations: readonly LandingSectionObservation<LandingSectionId>[];
  controllerReady: boolean;

  navigateToSection: (
    sectionId: LandingSectionId,
    options?: LandingSectionNavigationNavigateOptions,
  ) => void;

  replaceRouteSection: (
    sectionId: LandingSectionId,
    options?: Readonly<{
      replace?: boolean;
    }>,
  ) => void;

  resolveRoutePath: (sectionId: LandingSectionId) => string;
  isUrlSyncEligible: (sectionId: LandingSectionId) => boolean;

  refreshActiveSection: (reason?: ActiveSectionChangeReason) => void;
  resolveObservationBySectionId: (
    sectionId: LandingSectionId,
  ) => LandingSectionObservation<LandingSectionId> | null;
  getSectionElement: (sectionId: LandingSectionId) => HTMLElement | null;
  setActiveSectionId: (sectionId: LandingSectionId) => void;
}>;

type LandingSectionNavigationStoreState = Readonly<{
  activeSectionId: LandingSectionId;
  observedSectionId: LandingSectionId;
  committedSectionId: LandingSectionId;
  routeSectionId: LandingSectionId;
  observations: readonly LandingSectionObservation<LandingSectionId>[];
  controllerReady: boolean;
  getSectionElement: ((sectionId: LandingSectionId) => HTMLElement | null) | null;
  resolveObservationBySectionId:
    | ((sectionId: LandingSectionId) => LandingSectionObservation<LandingSectionId> | null)
    | null;
  refreshActiveSection: ((reason?: ActiveSectionChangeReason) => void) | null;
  setActiveSectionId: ((sectionId: LandingSectionId) => void) | null;
}>;

const DEFAULT_SECTION_IDS = LANDING_SECTIONS.map(
  (section) => section.id,
) as readonly LandingSectionId[];

const INITIAL_STORE_STATE: LandingSectionNavigationStoreState = {
  activeSectionId: DEFAULT_LANDING_SECTION_ID,
  observedSectionId: DEFAULT_LANDING_SECTION_ID,
  committedSectionId: DEFAULT_LANDING_SECTION_ID,
  routeSectionId: DEFAULT_LANDING_SECTION_ID,
  observations: [],
  controllerReady: false,
  getSectionElement: null,
  resolveObservationBySectionId: null,
  refreshActiveSection: null,
  setActiveSectionId: null,
};

let storeState: LandingSectionNavigationStoreState = INITIAL_STORE_STATE;

const storeListeners = new Set<() => void>();

function subscribeToStore(listener: () => void): () => void {
  storeListeners.add(listener);

  return () => {
    storeListeners.delete(listener);
  };
}

function getStoreSnapshot(): LandingSectionNavigationStoreState {
  return storeState;
}

function patchStoreState(
  patch:
    | Partial<LandingSectionNavigationStoreState>
    | ((
        current: LandingSectionNavigationStoreState,
      ) => Partial<LandingSectionNavigationStoreState>),
): void {
  const resolvedPatch =
    typeof patch === "function" ? patch(storeState) : patch;

  if (Object.keys(resolvedPatch).length === 0) {
    return;
  }

  const nextState: LandingSectionNavigationStoreState = {
    ...storeState,
    ...resolvedPatch,
  };

  const keys = Object.keys(nextState) as Array<
    keyof LandingSectionNavigationStoreState
  >;

  const changed = keys.some((key) => !Object.is(storeState[key], nextState[key]));

  if (!changed) {
    return;
  }

  storeState = nextState;
  storeListeners.forEach((listener) => listener());
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

function createEaseOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function normalizeSectionIds(
  sectionIds?: readonly LandingSectionId[],
): readonly LandingSectionId[] {
  const base = sectionIds?.length ? sectionIds : DEFAULT_SECTION_IDS;

  return Array.from(new Set(base));
}

function resolveEligibleFallbackSectionId(
  defaultSectionId: LandingSectionId,
  sectionIds: readonly LandingSectionId[],
): LandingSectionId {
  if (sectionIds.includes(defaultSectionId)) {
    return defaultSectionId;
  }

  return sectionIds[0] ?? DEFAULT_LANDING_SECTION_ID;
}

function resolveRouteSectionIdFromPathname(params: Readonly<{
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

  const nextSectionId =
    normalizeLandingSectionId(
      pathname
        ? pathname
            .split("?")[0]
            ?.split("#")[0]
            ?.replace(/^\/+/, "")
            ?.replace(/\/+$/, "")
        : null,
    ) ?? null;

  if (nextSectionId && eligibleSectionIds.includes(nextSectionId)) {
    return nextSectionId;
  }

  /**
   * Cai para o mapeamento canonical por path.
   * Ex.: /roadmap -> roadMap
   */
  const normalizedPath = normalizePathname(pathname);

  for (const section of LANDING_SECTIONS) {
    if (normalizePathname(section.path) === normalizedPath) {
      return eligibleSectionIds.includes(section.id)
        ? section.id
        : fallbackSectionId;
    }
  }

  return fallbackSectionId;
}

function scrollToSectionTarget(params: Readonly<{
  target: HTMLElement;
  lenis: LenisLike;
  offsetPx: number;
  duration: number;
}>): void {
  const { target, lenis, offsetPx, duration } = params;

  if (lenis) {
    lenis.scrollTo(target, {
      offset: -offsetPx,
      duration,
      easing: createEaseOutCubic,
    });
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  if (typeof globalThis.window !== "undefined") {
    globalThis.window.scrollBy({
      top: -offsetPx,
      behavior: "smooth",
    });
  }
}

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
        getLandingUrlSyncEligibleSectionIds(viewportMode === "mobile" ? "mobile" : "desktop"),
    );
  }, [urlSyncEligibleSectionIds, viewportMode]);

  const resolvedDefaultSectionId = useMemo(() => {
    return resolveEligibleFallbackSectionId(
      defaultSectionId,
      resolvedSectionIds,
    );
  }, [defaultSectionId, resolvedSectionIds]);

  const resolvedNavbarOffsetPx = useMemo(() => {
    return navbarOffsetPx ?? resolveLandingNavbarOffsetPx(viewportMode);
  }, [navbarOffsetPx, viewportMode]);

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

  useEffect(() => {
    patchStoreState({
      routeSectionId: routeSectionIdFromLocation,
    });
  }, [routeSectionIdFromLocation]);

  useEffect(() => {
    if (!controllerEnabled) {
      return;
    }

    patchStoreState({
      controllerReady: true,
      activeSectionId: activeSectionState.activeSectionId,
      observedSectionId: activeSectionState.observedSectionId,
      committedSectionId: activeSectionState.committedSectionId,
      observations: activeSectionState.observations,
      getSectionElement: activeSectionState.getSectionElement,
      resolveObservationBySectionId:
        activeSectionState.resolveObservationBySectionId,
      refreshActiveSection: activeSectionState.refreshActiveSection,
      setActiveSectionId: activeSectionState.setActiveSectionId,
    });

    return () => {
      patchStoreState({
        controllerReady: false,
        getSectionElement: null,
        resolveObservationBySectionId: null,
        refreshActiveSection: null,
        setActiveSectionId: null,
      });
    };
  }, [
    controllerEnabled,
    activeSectionState.activeSectionId,
    activeSectionState.observedSectionId,
    activeSectionState.committedSectionId,
    activeSectionState.observations,
    activeSectionState.getSectionElement,
    activeSectionState.resolveObservationBySectionId,
    activeSectionState.refreshActiveSection,
    activeSectionState.setActiveSectionId,
  ]);

  useEffect(() => {
    if (!controllerEnabled || !syncUrl) {
      return;
    }

    const nextSectionId = activeSectionState.committedSectionId;

    if (!isUrlSyncEligible(nextSectionId)) {
      return;
    }

    const nextPath = resolveRoutePath(nextSectionId);

    if (
      normalizePathname(location.pathname) === normalizePathname(nextPath)
    ) {
      return;
    }

    navigate(nextPath, { replace: true });
  }, [
    controllerEnabled,
    syncUrl,
    activeSectionState.committedSectionId,
    isUrlSyncEligible,
    resolveRoutePath,
    location.pathname,
    navigate,
  ]);

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

      patchStoreState({
        routeSectionId: normalizedSectionId,
      });

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
          offsetPx: options?.offsetPx ?? resolvedNavbarOffsetPx,
          duration: options?.duration ?? scrollDuration,
        });

        if (
          shouldSyncUrl &&
          normalizePathname(location.pathname) !== normalizePathname(nextPath)
        ) {
          navigate(nextPath, {
            replace: options?.replace ?? true,
          });
        }

        if (typeof globalThis.window !== "undefined") {
          globalThis.window.requestAnimationFrame(() => {
            getStoreSnapshot().refreshActiveSection?.("refresh");
          });
        }

        return;
      }

      navigate(nextPath, {
        replace: options?.replace ?? false,
      });
    },
    [
      getSectionElement,
      isUrlSyncEligible,
      lenis,
      location.pathname,
      navigate,
      resolveRoutePath,
      resolvedDefaultSectionId,
      resolvedNavbarOffsetPx,
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
