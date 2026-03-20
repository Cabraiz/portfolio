import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import { useLenis } from "lenis/react";

type HashHistoryMode = "replace" | "push";
type NativeScrollBehavior = "auto" | "instant" | "smooth";
type NativeScrollLogicalPosition = "start" | "center" | "end" | "nearest";

type HashWriteOptions = Readonly<{
  historyMode?: HashHistoryMode;
}>;

type ScrollToSectionOptions = Readonly<{
  updateHash?: boolean;
  historyMode?: HashHistoryMode;
  behavior?: NativeScrollBehavior;
  block?: NativeScrollLogicalPosition;
  inline?: NativeScrollLogicalPosition;
  immediate?: boolean;
  offset?: number;
  containerRef?: RefObject<HTMLElement | null>;
}>;

type SectionChangeArgs = [sectionId: string];
type WriteSectionHashArgs = [sectionId: string, options?: HashWriteOptions];
type ClearSectionHashArgs = [options?: HashWriteOptions];
type ScrollToSectionArgs = [
  sectionId: string,
  options?: ScrollToSectionOptions,
];

type SectionChangeHandler = (..._args: SectionChangeArgs) => void;
type WriteSectionHashHandler = (..._args: WriteSectionHashArgs) => void;
type ClearSectionHashHandler = (..._args: ClearSectionHashArgs) => void;
type ScrollToSectionHandler = (..._args: ScrollToSectionArgs) => void;

type UseHashSectionSyncParams = Readonly<{
  defaultSectionId?: string;
  writeDefaultHashOnMount?: boolean;
  historyMode?: HashHistoryMode;
  onSectionChange?: SectionChangeHandler;
}>;

type UseHashSectionSyncReturn = Readonly<{
  currentSectionId: string;
  readSectionHash: () => string;
  writeSectionHash: WriteSectionHashHandler;
  clearSectionHash: ClearSectionHashHandler;
  scrollToSection: ScrollToSectionHandler;
}>;

function isBrowserEnvironment(): boolean {
  return (
    typeof document !== "undefined" &&
    globalThis.location !== undefined &&
    globalThis.history !== undefined
  );
}

function normalizeSectionId(sectionId: string): string {
  return decodeURIComponent(sectionId).replace(/^#/, "").trim();
}

function getCurrentPathWithSearch(): string {
  if (!isBrowserEnvironment()) {
    return "";
  }

  return `${globalThis.location.pathname}${globalThis.location.search}`;
}

function readSectionHashFromLocation(): string {
  if (!isBrowserEnvironment()) {
    return "";
  }

  return normalizeSectionId(globalThis.location.hash);
}

function writeSectionHashToLocation(
  sectionId: string,
  options?: HashWriteOptions
): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  const normalizedSectionId = normalizeSectionId(sectionId);
  const nextHistoryMode = options?.historyMode ?? "replace";
  const nextUrl = normalizedSectionId
    ? `${getCurrentPathWithSearch()}#${encodeURIComponent(normalizedSectionId)}`
    : getCurrentPathWithSearch();

  const currentUrl = `${getCurrentPathWithSearch()}${globalThis.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  if (nextHistoryMode === "push") {
    globalThis.history.pushState(globalThis.history.state, "", nextUrl);
    return;
  }

  globalThis.history.replaceState(globalThis.history.state, "", nextUrl);
}

function findSectionInsideContainer(
  sectionId: string,
  container: HTMLElement | null
): HTMLElement | null {
  if (!container) {
    return null;
  }

  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) {
    return null;
  }

  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(
      "section[id], section[data-section], [data-section], [id]"
    )
  );

  return (
    candidates.find((element) => {
      const elementId = normalizeSectionId(element.id ?? "");
      const dataSection = normalizeSectionId(element.dataset.section ?? "");

      return (
        elementId === normalizedSectionId ||
        dataSection === normalizedSectionId
      );
    }) ?? null
  );
}

function findSectionElement(
  sectionId: string,
  containerRef?: RefObject<HTMLElement | null>
): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) {
    return null;
  }

  const scopedMatch = findSectionInsideContainer(
    normalizedSectionId,
    containerRef?.current ?? null
  );

  if (scopedMatch) {
    return scopedMatch;
  }

  const byId = document.getElementById(normalizedSectionId);
  if (byId) {
    return byId;
  }

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("[data-section]")
  );

  return (
    candidates.find((element) => {
      const dataSection = normalizeSectionId(element.dataset.section ?? "");
      return dataSection === normalizedSectionId;
    }) ?? null
  );
}

export function useHashSectionSync({
  defaultSectionId = "",
  writeDefaultHashOnMount = false,
  historyMode = "replace",
  onSectionChange,
}: UseHashSectionSyncParams = {}): UseHashSectionSyncReturn {
  const lenis = useLenis();

  const [currentSectionId, setCurrentSectionId] = useState<string>(() => {
    const currentHashSection = readSectionHashFromLocation();
    return currentHashSection || normalizeSectionId(defaultSectionId);
  });

  const emitSectionChange = useCallback(
    (nextSectionId: string) => {
      if (!nextSectionId || !onSectionChange) {
        return;
      }

      onSectionChange(nextSectionId);
    },
    [onSectionChange]
  );

  const readSectionHash = useCallback((): string => {
    return readSectionHashFromLocation();
  }, []);

  const writeSectionHash = useCallback<WriteSectionHashHandler>(
    (sectionId, options) => {
      const normalizedSectionId = normalizeSectionId(sectionId);

      writeSectionHashToLocation(normalizedSectionId, {
        historyMode: options?.historyMode ?? historyMode,
      });

      setCurrentSectionId(normalizedSectionId);
      emitSectionChange(normalizedSectionId);
    },
    [emitSectionChange, historyMode]
  );

  const clearSectionHash = useCallback<ClearSectionHashHandler>(
    (options) => {
      writeSectionHashToLocation("", {
        historyMode: options?.historyMode ?? historyMode,
      });

      const fallbackSectionId = normalizeSectionId(defaultSectionId);
      setCurrentSectionId(fallbackSectionId);
      emitSectionChange(fallbackSectionId);
    },
    [defaultSectionId, emitSectionChange, historyMode]
  );

  const scrollToSection = useCallback<ScrollToSectionHandler>(
    (sectionId, options) => {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) {
        return;
      }

      const target = findSectionElement(
        normalizedSectionId,
        options?.containerRef
      );

      if (target) {
        if (lenis) {
          lenis.scrollTo(target, {
            offset: options?.offset ?? 0,
            immediate: options?.immediate ?? false,
          });
        } else {
          target.scrollIntoView({
            behavior: options?.behavior ?? "smooth",
            block: options?.block ?? "start",
            inline: options?.inline ?? "nearest",
          });

          if (
            typeof options?.offset === "number" &&
            options.offset !== 0 &&
            globalThis.scrollBy !== undefined
          ) {
            globalThis.scrollBy({
              top: options.offset,
              behavior: options?.behavior ?? "smooth",
            });
          }
        }
      }

      if (options?.updateHash ?? true) {
        writeSectionHash(normalizedSectionId, {
          historyMode: options?.historyMode ?? historyMode,
        });
      }
    },
    [historyMode, lenis, writeSectionHash]
  );

  useEffect(() => {
    if (!isBrowserEnvironment()) {
      return;
    }

    const syncFromLocationHash = () => {
      const nextSectionId =
        readSectionHashFromLocation() || normalizeSectionId(defaultSectionId);

      setCurrentSectionId((previousSectionId) => {
        if (previousSectionId === nextSectionId) {
          return previousSectionId;
        }

        return nextSectionId;
      });

      emitSectionChange(nextSectionId);
    };

    const currentHashSection = readSectionHashFromLocation();

    if (!currentHashSection && defaultSectionId && writeDefaultHashOnMount) {
      writeSectionHashToLocation(defaultSectionId, { historyMode });
    }

    syncFromLocationHash();

    globalThis.addEventListener("hashchange", syncFromLocationHash);

    return () => {
      globalThis.removeEventListener("hashchange", syncFromLocationHash);
    };
  }, [
    defaultSectionId,
    emitSectionChange,
    historyMode,
    writeDefaultHashOnMount,
  ]);

  return useMemo(
    () => ({
      currentSectionId,
      readSectionHash,
      writeSectionHash,
      clearSectionHash,
      scrollToSection,
    }),
    [
      clearSectionHash,
      currentSectionId,
      readSectionHash,
      scrollToSection,
      writeSectionHash,
    ]
  );
}

export default useHashSectionSync;
