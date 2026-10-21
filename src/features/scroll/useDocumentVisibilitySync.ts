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
    let desktopResizeAnchor: LandingScrollAnchor | null = null;
    let desktopResizeFrame: number | null = null;
    let desktopResizeSettleTimer: number | null = null;

    const rememberVisiblePosition = () => {
      if (positionFrame !== null || preservedPositionRef.current || refreshFrameRef.current !== null || desktopResizeAnchor) return;
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

    const cancelDesktopResizeRestore = () => {
      if (desktopResizeFrame !== null) cancelAnimationFrame(desktopResizeFrame);
      if (desktopResizeSettleTimer !== null) globalThis.clearTimeout(desktopResizeSettleTimer);
      desktopResizeFrame = null;
      desktopResizeSettleTimer = null;
      desktopResizeAnchor = null;
    };

    const restoreDesktopResizeAnchor = () => {
      if (!desktopResizeAnchor) return;
      // A navigation started after the resize owns the scroll position now.
      if (readPendingLandingScrollTarget() !== null) {
        cancelDesktopResizeRestore();
        return;
      }
      lenis.resize();
      const restoredScrollY = resolveLandingScrollAnchor(desktopResizeAnchor);
      lenis.scrollTo(restoredScrollY, {immediate: true, force: true});
      globalThis.window.scrollTo({top: restoredScrollY, behavior: 'auto'});
      updateScrollRuntime();
    };

    // Desktop sections are exactly one viewport tall, so a resize moves every
    // section boundary. Keep the scene position from before the resize (a
    // pending navigation target wins) and reapply it until layout settles.
    const handleDesktopViewportResize = () => {
      if (currentDocument.hidden || preservedPositionRef.current) return;
      if (!desktopResizeAnchor) {
        const pendingTarget = readPendingLandingScrollTarget();
        desktopResizeAnchor = pendingTarget === null ? visiblePosition : captureLandingScrollAnchor(pendingTarget);
        if (pendingTarget !== null) clearPendingLandingScrollTarget(pendingTarget);
      }
      if (desktopResizeFrame !== null) cancelAnimationFrame(desktopResizeFrame);
      desktopResizeFrame = requestAnimationFrame(() => {
        desktopResizeFrame = null;
        restoreDesktopResizeAnchor();
      });
      if (desktopResizeSettleTimer !== null) globalThis.clearTimeout(desktopResizeSettleTimer);
      desktopResizeSettleTimer = globalThis.window.setTimeout(() => {
        desktopResizeSettleTimer = null;
        refreshScrollRuntime();
        restoreDesktopResizeAnchor();
        desktopResizeAnchor = null;
        visiblePosition = captureLandingScrollAnchor();
      }, 220);
    };

    const handleViewportResize = () => {
      if (document.querySelector("main[data-landing-viewport='desktop']")) {
        handleDesktopViewportResize();
        return;
      }
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
    // A user gesture during a resize wins over the preserved position.
    globalThis.window.addEventListener('wheel', cancelDesktopResizeRestore, {passive: true});
    globalThis.window.addEventListener('touchstart', cancelDesktopResizeRestore, {passive: true});
    globalThis.window.addEventListener('keydown', cancelDesktopResizeRestore);
    globalThis.window.addEventListener('pointerdown', cancelDesktopResizeRestore, {passive: true});

    return () => {
      currentDocument.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      globalThis.window.removeEventListener("blur", preserveScrollPosition);
      globalThis.window.removeEventListener("focus", restoreScrollPosition);
      globalThis.window.removeEventListener('scroll', rememberVisiblePosition);
      globalThis.window.removeEventListener('resize', handleViewportResize);
      globalThis.window.removeEventListener('wheel', cancelDesktopResizeRestore);
      globalThis.window.removeEventListener('touchstart', cancelDesktopResizeRestore);
      globalThis.window.removeEventListener('keydown', cancelDesktopResizeRestore);
      globalThis.window.removeEventListener('pointerdown', cancelDesktopResizeRestore);
      if (positionFrame !== null) cancelAnimationFrame(positionFrame);
      cancelDesktopResizeRestore();
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
