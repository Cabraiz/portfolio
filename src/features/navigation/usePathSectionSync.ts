import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLenis } from "lenis/react";

import {
  DEFAULT_LANDING_SECTION_ID,
  getPathBySectionId,
  getSectionIdByPath,
  isLandingPath,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "./landingSections";

type ScrollBehaviorMode = "auto" | "instant" | "smooth";
type ScrollLogicalPositionMode = "start" | "center" | "end" | "nearest";
type NativeScrollBehavior = "auto" | "smooth";

export type PathHistoryMode = "push" | "replace";

export type ScrollToSectionOptions = Readonly<{
  containerRef?: RefObject<HTMLElement | null>;
  behavior?: ScrollBehaviorMode;
  block?: ScrollLogicalPositionMode;
  inline?: ScrollLogicalPositionMode;
  offset?: number;
  immediate?: boolean;
  updatePath?: boolean;
  historyMode?: PathHistoryMode;
}>;

export type NavigateToSectionOptions = Readonly<{
  historyMode?: PathHistoryMode;
  scroll?: boolean;
  immediate?: boolean;
  offset?: number;
}>;

export type SyncSectionFromScrollOptions = Readonly<{
  historyMode?: PathHistoryMode;
}>;

export type UsePathSectionSyncParams = Readonly<{
  containerRef?: RefObject<HTMLElement | null>;
  defaultSectionId?: LandingSectionId;
  historyMode?: PathHistoryMode;
}>;

type PendingPathScroll = Readonly<{
  sectionId: LandingSectionId;
  immediate?: boolean;
  offset?: number;
}>;

function getBrowserWindow(): Window | null {
  if (globalThis.window === undefined) {
    return null;
  }

  return globalThis.window;
}

function getBrowserDocument(): Document | null {
  if (globalThis.document === undefined) {
    return null;
  }

  return globalThis.document;
}

function resolveHistoryMode(
  explicitHistoryMode: PathHistoryMode | undefined,
  fallbackHistoryMode: PathHistoryMode,
): PathHistoryMode {
  return explicitHistoryMode ?? fallbackHistoryMode;
}

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function toNativeScrollBehavior(
  behavior: ScrollBehaviorMode,
): NativeScrollBehavior {
  if (behavior === "smooth") {
    return "smooth";
  }

  return "auto";
}

function findSectionInsideContainer(
  sectionId: LandingSectionId,
  container: HTMLElement | null,
): HTMLElement | null {
  if (!container) {
    return null;
  }

  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(
      "section[id], section[data-section], [data-section], [id]",
    ),
  );

  return (
    candidates.find((element) => {
      const elementId = normalizeLandingSectionId(element.id);
      const dataSection = normalizeLandingSectionId(
        element.dataset.section ?? null,
      );

      return elementId === sectionId || dataSection === sectionId;
    }) ?? null
  );
}

function findSectionElement(
  sectionId: LandingSectionId,
  containerRef?: RefObject<HTMLElement | null>,
): HTMLElement | null {
  const browserDocument = getBrowserDocument();

  if (!browserDocument) {
    return null;
  }

  const scopedMatch = findSectionInsideContainer(
    sectionId,
    containerRef?.current ?? null,
  );

  if (scopedMatch) {
    return scopedMatch;
  }

  const byId = browserDocument.getElementById(sectionId);
  if (byId) {
    return byId;
  }

  const dataSectionMatches = Array.from(
    browserDocument.querySelectorAll<HTMLElement>("[data-section]"),
  );

  return (
    dataSectionMatches.find((element) => {
      const dataSection = normalizeLandingSectionId(
        element.dataset.section ?? null,
      );

      return dataSection === sectionId;
    }) ?? null
  );
}

function applyNativeOffset(
  offset: number,
  behavior: NativeScrollBehavior,
): void {
  const browserWindow = getBrowserWindow();

  if (
    !browserWindow ||
    typeof browserWindow.scrollBy !== "function" ||
    offset === 0
  ) {
    return;
  }

  browserWindow.scrollBy({
    top: offset,
    behavior,
  });
}

export function usePathSectionSync({
  containerRef,
  defaultSectionId = DEFAULT_LANDING_SECTION_ID,
  historyMode = "replace",
}: UsePathSectionSyncParams = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const lenis = useLenis();

  const [currentSectionId, setCurrentSectionId] = useState<LandingSectionId>(
    () => getSectionIdByPath(location.pathname) ?? defaultSectionId,
  );

  const skipNextPathScrollRef = useRef<string | null>(null);
  const lastHandledPathRef = useRef<string | null>(null);
  const pendingPathScrollRef = useRef<PendingPathScroll | null>(null);

  const scrollToSectionInternal = useCallback(
    (sectionId: LandingSectionId, options?: ScrollToSectionOptions): void => {
      const target = findSectionElement(
        sectionId,
        options?.containerRef ?? containerRef,
      );

      if (!target) {
        return;
      }

      const nextBehavior = toNativeScrollBehavior(
        options?.immediate === true ? "auto" : (options?.behavior ?? "smooth"),
      );

      if (lenis) {
        lenis.scrollTo(target, {
          offset: options?.offset ?? 0,
          immediate: options?.immediate ?? false,
        });

        return;
      }

      target.scrollIntoView({
        behavior: nextBehavior,
        block: options?.block ?? "start",
        inline: options?.inline ?? "nearest",
      });

      if (typeof options?.offset === "number" && options.offset !== 0) {
        applyNativeOffset(options.offset, nextBehavior);
      }
    },
    [containerRef, lenis],
  );

  const scrollToSection = useCallback(
    (sectionId: LandingSectionId, options?: ScrollToSectionOptions): void => {
      const nextPath = getPathBySectionId(sectionId, defaultSectionId);
      const normalizedCurrentPath = normalizePathname(location.pathname);
      const normalizedNextPath = normalizePathname(nextPath);

      setCurrentSectionId(sectionId);

      if (
        (options?.updatePath ?? true) &&
        normalizedCurrentPath !== normalizedNextPath
      ) {
        navigate(normalizedNextPath, {
          replace:
            resolveHistoryMode(options?.historyMode, historyMode) === "replace",
        });
      }

      scrollToSectionInternal(sectionId, {
        ...options,
        updatePath: false,
      });
    },
    [
      defaultSectionId,
      historyMode,
      location.pathname,
      navigate,
      scrollToSectionInternal,
    ],
  );

  const navigateToSection = useCallback(
    (
      sectionId: LandingSectionId,
      options?: NavigateToSectionOptions,
    ): void => {
      const nextPath = getPathBySectionId(sectionId, defaultSectionId);
      const normalizedCurrentPath = normalizePathname(location.pathname);
      const normalizedNextPath = normalizePathname(nextPath);

      setCurrentSectionId(sectionId);

      if (normalizedCurrentPath === normalizedNextPath) {
        if (options?.scroll ?? true) {
          scrollToSectionInternal(sectionId, {
            immediate: options?.immediate,
            offset: options?.offset,
            updatePath: false,
          });
        }

        return;
      }

      if (options?.scroll ?? true) {
        pendingPathScrollRef.current = {
          sectionId,
          immediate: options?.immediate,
          offset: options?.offset,
        };
      } else {
        pendingPathScrollRef.current = null;
      }

      navigate(normalizedNextPath, {
        replace:
          resolveHistoryMode(options?.historyMode, historyMode) === "replace",
      });
    },
    [
      defaultSectionId,
      historyMode,
      location.pathname,
      navigate,
      scrollToSectionInternal,
    ],
  );

  const syncSectionFromScroll = useCallback(
    (
      sectionId: LandingSectionId,
      options?: SyncSectionFromScrollOptions,
    ): void => {
      const nextPath = normalizePathname(
        getPathBySectionId(sectionId, defaultSectionId),
      );
      const normalizedCurrentPath = normalizePathname(location.pathname);

      setCurrentSectionId((previousSectionId) =>
        previousSectionId === sectionId ? previousSectionId : sectionId,
      );

      if (normalizedCurrentPath === nextPath) {
        return;
      }

      skipNextPathScrollRef.current = nextPath;

      navigate(nextPath, {
        replace:
          resolveHistoryMode(options?.historyMode, "replace") === "replace",
      });
    },
    [defaultSectionId, location.pathname, navigate],
  );

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
      return;
    }

    const nextSectionId =
      getSectionIdByPath(location.pathname) ?? defaultSectionId;

    setCurrentSectionId((previousSectionId) =>
      previousSectionId === nextSectionId
        ? previousSectionId
        : nextSectionId,
    );

    if (!isLandingPath(location.pathname)) {
      return;
    }

    const normalizedPath = normalizePathname(location.pathname);

    if (skipNextPathScrollRef.current === normalizedPath) {
      skipNextPathScrollRef.current = null;
      lastHandledPathRef.current = normalizedPath;
      return;
    }

    const pendingScroll = pendingPathScrollRef.current;
    const pathChanged = lastHandledPathRef.current !== normalizedPath;
    const shouldRunPathScroll =
      pathChanged ||
      (pendingScroll !== null && pendingScroll.sectionId === nextSectionId);

    lastHandledPathRef.current = normalizedPath;

    if (!shouldRunPathScroll) {
      return;
    }

    const frame = browserWindow.requestAnimationFrame(() => {
      const latestPendingScroll = pendingPathScrollRef.current;
      const isMatchingPendingScroll =
        latestPendingScroll !== null &&
        latestPendingScroll.sectionId === nextSectionId;

      scrollToSectionInternal(nextSectionId, {
        immediate: isMatchingPendingScroll
          ? latestPendingScroll.immediate
          : false,
        offset: isMatchingPendingScroll ? latestPendingScroll.offset : 0,
        updatePath: false,
      });

      pendingPathScrollRef.current = null;
    });

    return () => {
      browserWindow.cancelAnimationFrame(frame);
    };
  }, [defaultSectionId, location.pathname, scrollToSectionInternal]);

  return useMemo(
    () => ({
      currentSectionId,
      navigateToSection,
      scrollToSection,
      syncSectionFromScroll,
    }),
    [
      currentSectionId,
      navigateToSection,
      scrollToSection,
      syncSectionFromScroll,
    ],
  );
}

export type UsePathSectionSyncReturn = ReturnType<typeof usePathSectionSync>;

export default usePathSectionSync;
