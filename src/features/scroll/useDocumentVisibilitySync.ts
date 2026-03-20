import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

import { refreshScrollRuntime } from "./gsapRuntime";

type AnimationFrameId = number | null;

export function useDocumentVisibilitySync(): void {
  const lenis = useLenis();
  const refreshFrameRef = useRef<AnimationFrameId>(null);

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

    const handleVisibilityChange = () => {
      if (currentDocument.hidden) {
        cancelPendingRefresh();
        lenis.stop();
        return;
      }

      lenis.start();
      scheduleRefresh();
    };

    /**
     * Não força refresh na montagem.
     * Só ajusta o estado caso o hook monte enquanto a aba já está oculta.
     */
    if (currentDocument.hidden) {
      lenis.stop();
    }

    currentDocument.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      currentDocument.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      cancelPendingRefresh();

      /**
       * Ao desmontar, garantimos que o Lenis não fique preso em stop
       * caso este hook saia de cena durante uma transição de tela.
       */
      lenis.start();
    };
  }, [lenis]);
}

export default useDocumentVisibilitySync;
