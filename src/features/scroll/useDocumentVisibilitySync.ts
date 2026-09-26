import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

import { refreshScrollRuntime } from "./gsapRuntime";
import {
  clearPendingLandingScrollTarget,
  readPendingLandingScrollTarget,
} from "./landingScrollTarget";

type AnimationFrameId = number | null;

export function useDocumentVisibilitySync(): void {
  const lenis = useLenis();
  const refreshFrameRef = useRef<AnimationFrameId>(null);
  const preservedScrollYRef = useRef<number | null>(null);
  const pendingLandingTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lenis || !("document" in globalThis)) {
      return;
    }

    const currentDocument = globalThis.document;

    const cancelPendingRefresh = () => {
      if (
        refreshFrameRef.current !== null &&
        "cancelAnimationFrame" in globalThis
      ) {
        globalThis.cancelAnimationFrame(refreshFrameRef.current);
      }

      refreshFrameRef.current = null;
    };

    const scheduleRefresh = () => {
      cancelPendingRefresh();

      if ("requestAnimationFrame" in globalThis) {
        refreshFrameRef.current = globalThis.requestAnimationFrame(() => {
          refreshFrameRef.current = null;
          refreshScrollRuntime();
        });

        return;
      }

      refreshScrollRuntime();
    };

    const preserveScrollPosition = () => {
      if (preservedScrollYRef.current === null) {
        preservedScrollYRef.current = globalThis.window.scrollY;
      }

      pendingLandingTargetRef.current = readPendingLandingScrollTarget();

      cancelPendingRefresh();
      lenis.stop();
    };

    const restoreScrollPosition = () => {
      const preservedScrollY = preservedScrollYRef.current;
      const pendingLandingTarget = pendingLandingTargetRef.current;
      preservedScrollYRef.current = null;
      pendingLandingTargetRef.current = null;

      lenis.start();

      const restoredScrollY = pendingLandingTarget ?? preservedScrollY;

      if (restoredScrollY !== null) {
        lenis.scrollTo(restoredScrollY, {
          immediate: true,
          force: true,
        });
        globalThis.window.scrollTo({
          top: restoredScrollY,
          behavior: "auto",
        });
      }

      if (pendingLandingTarget !== null) {
        clearPendingLandingScrollTarget(pendingLandingTarget);
      }

      scheduleRefresh();
    };

    const handleVisibilityChange = () => {
      if (currentDocument.hidden) {
        preserveScrollPosition();
        return;
      }

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

    return () => {
      currentDocument.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      globalThis.window.removeEventListener("blur", preserveScrollPosition);
      globalThis.window.removeEventListener("focus", restoreScrollPosition);
      cancelPendingRefresh();
      preservedScrollYRef.current = null;
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
