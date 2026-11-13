import { useEffect, type RefObject } from "react";

import type {
  ActiveSectionChangeReason,
  UseLandingActiveSectionSchedulingOptions,
} from "./useLandingActiveSection.types";
import {
  getBrowserWindow,
  querySectionElements,
} from "./useLandingActiveSection.observations";
import {
  resolveShouldAttachContainerScroll,
  resolveShouldAttachWindowScroll,
} from "./useLandingActiveSection.resolvers";

// Liga rolagem, resize e ResizeObserver ao recálculo agendado da seção.
export function useLandingActiveSectionListeners({
  containerRef,
  disabled,
  resolvedScheduling,
  scheduleRefresh,
  sectionSelector,
  animationFrameRef,
  debounceTimerRef,
  pendingReasonRef,
}: Readonly<{
  containerRef: { current: HTMLElement | null };
  disabled: boolean;
  resolvedScheduling: Required<UseLandingActiveSectionSchedulingOptions>;
  scheduleRefresh: (reason: ActiveSectionChangeReason) => void;
  sectionSelector: string;
  animationFrameRef: RefObject<number | null>;
  debounceTimerRef: RefObject<ReturnType<typeof setTimeout> | null>;
  pendingReasonRef: RefObject<ActiveSectionChangeReason | null>;
}>): void {
  useEffect(() => {
    if (disabled) {
      return;
    }

    const browserWindow = getBrowserWindow();
    const container = containerRef.current;

    if (browserWindow === null || container === null) {
      return;
    }

    const handleScroll = (): void => {
      scheduleRefresh("scroll");
    };

    const handleResize = (): void => {
      scheduleRefresh("resize");
    };

    const shouldAttachWindowScroll = resolveShouldAttachWindowScroll(
      resolvedScheduling,
    );

    if (shouldAttachWindowScroll) {
      browserWindow.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    if (resolvedScheduling.listenResize) {
      browserWindow.addEventListener("resize", handleResize);
    }

    if (resolvedScheduling.listenOrientationChange) {
      browserWindow.addEventListener("orientationchange", handleResize);
    }

    const shouldAttachContainerScroll = resolveShouldAttachContainerScroll(
      container,
      resolvedScheduling,
    );

    if (shouldAttachContainerScroll) {
      container.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    let resizeObserverInstance: ResizeObserver | null = null;

    if (
      resolvedScheduling.attachResizeObserver &&
      typeof globalThis.ResizeObserver === "function"
    ) {
      resizeObserverInstance = new globalThis.ResizeObserver(() => {
        scheduleRefresh("resize");
      });

      resizeObserverInstance.observe(container);

      querySectionElements(container, sectionSelector).forEach((element) => {
        resizeObserverInstance?.observe(element);
      });
    }

    return () => {
      if (shouldAttachWindowScroll) {
        browserWindow.removeEventListener("scroll", handleScroll);
      }

      if (resolvedScheduling.listenResize) {
        browserWindow.removeEventListener("resize", handleResize);
      }

      if (resolvedScheduling.listenOrientationChange) {
        browserWindow.removeEventListener("orientationchange", handleResize);
      }

      if (shouldAttachContainerScroll) {
        container.removeEventListener("scroll", handleScroll);
      }

      if (resizeObserverInstance !== null) {
        resizeObserverInstance.disconnect();
      }

      if (debounceTimerRef.current !== null) {
        globalThis.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        browserWindow.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      pendingReasonRef.current = null;
    };
  }, [
    containerRef,
    disabled,
    resolvedScheduling,
    scheduleRefresh,
    sectionSelector,
  ]);
}
