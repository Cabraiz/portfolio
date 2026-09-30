import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

import { refreshScrollRuntime, updateScrollRuntime } from "./gsapRuntime";
import { captureLandingScrollAnchor, resolveLandingScrollAnchor, type LandingScrollAnchor } from './landingScrollAnchor';
import {
  clearPendingLandingScrollTarget,
  readPendingLandingScrollTarget,
} from "./landingScrollTarget";

type AnimationFrameId = number | null;

export function useDocumentVisibilitySync(): void {
  const lenis = useLenis();
  const refreshFrameRef = useRef<AnimationFrameId>(null);
  const preservedPositionRef = useRef<LandingScrollAnchor | null>(null);
  const pendingLandingTargetRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<LandingScrollAnchor | null>(null);

  useEffect(() => {
    if (!lenis || !("document" in globalThis)) {
      return;
    }

    const currentDocument = globalThis.document;
    let visiblePosition = captureLandingScrollAnchor();
    let positionFrame: number | null = null;

    const rememberVisiblePosition = () => {
      if (positionFrame !== null || preservedPositionRef.current || refreshFrameRef.current !== null) return;
      positionFrame = requestAnimationFrame(() => {
        positionFrame = null;
        if (!preservedPositionRef.current && refreshFrameRef.current === null) visiblePosition = captureLandingScrollAnchor();
      });
    };

    const cancelPendingRefresh = () => {
      if (
        refreshFrameRef.current !== null &&
        "cancelAnimationFrame" in globalThis
      ) {
        globalThis.cancelAnimationFrame(refreshFrameRef.current);
      }

      refreshFrameRef.current = null;
    };

    const preserveScrollPosition = () => {
      if (preservedPositionRef.current === null) {
        preservedPositionRef.current = captureLandingScrollAnchor();
      }
      const pendingTarget = readPendingLandingScrollTarget();
      if (pendingTarget !== null) {
        pendingLandingTargetRef.current = pendingTarget;
        pendingPositionRef.current = captureLandingScrollAnchor(pendingTarget);
      }

      cancelPendingRefresh();
      lenis.stop();
    };

    const restoreScrollPosition = () => {
      lenis.start();
      // visibilitychange and focus can both fire on return. Consume the same
      // snapshot once, after layout/GSAP has refreshed, and write scroll last.
      if (refreshFrameRef.current !== null) return;
      refreshFrameRef.current = globalThis.requestAnimationFrame(() => {
        refreshFrameRef.current = null;
        refreshScrollRuntime();
        lenis.resize();
        const position = pendingPositionRef.current ?? preservedPositionRef.current;
        const pendingTarget = pendingLandingTargetRef.current;
        preservedPositionRef.current = null;
        pendingPositionRef.current = null;
        pendingLandingTargetRef.current = null;
        if (position) {
          const restoredScrollY = resolveLandingScrollAnchor(position);
          lenis.scrollTo(restoredScrollY, {immediate: true, force: true});
          globalThis.window.scrollTo({top: restoredScrollY, behavior: 'auto'});
          updateScrollRuntime();
        }
        visiblePosition = captureLandingScrollAnchor();
        if (pendingTarget !== null) clearPendingLandingScrollTarget(pendingTarget);
      });
    };

    const handleVisibilityChange = () => {
      if (currentDocument.hidden) {
        preserveScrollPosition();
        return;
      }

      restoreScrollPosition();
    };

    const handleViewportResize = () => {
      if (!document.querySelector("main[data-landing-viewport='mobile']")) return;
      if (currentDocument.hidden || preservedPositionRef.current) return;
      // CSS has already resized by this event. Keep the snapshot from before
      // resize, including a user's partial progress rather than snapping to top.
      preservedPositionRef.current = visiblePosition;
      restoreScrollPosition();
    };

    /**
     * Não força refresh na montagem.
     * Só ajusta o estado caso o hook monte enquanto a aba já está oculta.
     */
    if (currentDocument.hidden) {
      preserveScrollPosition();
    }

    currentDocument.addEventListener("visibilitychange", handleVisibilityChange);
    globalThis.window.addEventListener("blur", preserveScrollPosition);
    globalThis.window.addEventListener("focus", restoreScrollPosition);
    globalThis.window.addEventListener('scroll', rememberVisiblePosition, {passive: true});
    globalThis.window.addEventListener('resize', handleViewportResize);

    return () => {
      currentDocument.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      globalThis.window.removeEventListener("blur", preserveScrollPosition);
      globalThis.window.removeEventListener("focus", restoreScrollPosition);
      globalThis.window.removeEventListener('scroll', rememberVisiblePosition);
      globalThis.window.removeEventListener('resize', handleViewportResize);
      if (positionFrame !== null) cancelAnimationFrame(positionFrame);
      cancelPendingRefresh();
      preservedPositionRef.current = null;
      pendingPositionRef.current = null;
      pendingLandingTargetRef.current = null;

      /**
       * Ao desmontar, garantimos que o Lenis não fique preso em stop
       * caso este hook saia de cena durante uma transição de tela.
       */
      lenis.start();
    };
  }, [lenis]);
}

export default useDocumentVisibilitySync;
