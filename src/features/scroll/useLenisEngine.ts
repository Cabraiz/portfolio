import { useLayoutEffect, useRef } from "react";
import { useLenis } from "lenis/react";

import {
  ScrollTrigger,
  addGsapTicker,
  disableGsapLagSmoothing,
  removeGsapTicker,
} from "./gsapRuntime";

type LenisScrollCallback = () => void;
type GsapTickerCallback = (time: number) => void;

declare global {
  interface Window {
    __CABRAIZ_LENIS_DEBUG__?: boolean;
    __CABRAIZ_DISABLE_LENIS_GSAP_BRIDGE__?: boolean;
  }
}

function isLenisDebugEnabled(): boolean {
  return (
    typeof window !== "undefined" && window.__CABRAIZ_LENIS_DEBUG__ === true
  );
}

function isGsapBridgeDisabled(): boolean {
  return (
    typeof window !== "undefined" &&
    window.__CABRAIZ_DISABLE_LENIS_GSAP_BRIDGE__ === true
  );
}

function debugLog(message: string, payload?: unknown): void {
  if (!isLenisDebugEnabled()) {
    return;
  }

  if (typeof payload === "undefined") {
    console.debug(`[useLenisEngine] ${message}`);
    return;
  }

  console.debug(`[useLenisEngine] ${message}`, payload);
}

export function useLenisEngine(): void {
  const lenis = useLenis();

  /**
   * Guarda qual instância do Lenis já foi conectada ao bridge.
   * Isso evita dupla inicialização quando o hook re-renderiza
   * sem troca real da instância.
   */
  const boundLenisRef = useRef<unknown>(null);

  /**
   * Evita reentrada do callback do ticker em cenários extremos.
   * O objetivo não é calibrar scroll aqui, apenas proteger o runtime.
   */
  const processingRef = useRef(false);

  useLayoutEffect(() => {
    if (!lenis) {
      debugLog("Lenis ainda não disponível; bridge não inicializado.");
      return;
    }

    /**
     * Guardrail:
     * se a mesma instância já foi conectada, não repetimos bindings.
     */
    if (boundLenisRef.current === lenis) {
      debugLog("Instância do Lenis já conectada; ignorando reinicialização.");
      return;
    }

    /**
     * Flag opcional para testes:
     * desliga a integração Lenis <-> GSAP sem mexer na calibração
     * dos profiles de smoothWheel.
     */
    if (isGsapBridgeDisabled()) {
      boundLenisRef.current = lenis;
      debugLog("Bridge Lenis + GSAP desabilitado por flag de runtime.");

      return () => {
        debugLog("Cleanup sem bridge GSAP; liberando referência do Lenis.");
        boundLenisRef.current = null;
        processingRef.current = false;
      };
    }

    boundLenisRef.current = lenis;

    const onLenisScroll: LenisScrollCallback = () => {
      /**
       * Sempre que o Lenis processa scroll, sincronizamos o ScrollTrigger
       * para manter triggers, pinning e medições coerentes.
       */
      ScrollTrigger.update();
    };

    const rafCallback: GsapTickerCallback = (time) => {
      if (processingRef.current) {
        return;
      }

      processingRef.current = true;

      try {
        /**
         * gsap.ticker entrega tempo em segundos.
         * Lenis espera milissegundos.
         */
        lenis.raf(time * 1000);
      } finally {
        processingRef.current = false;
      }
    };

    lenis.on("scroll", onLenisScroll);
    addGsapTicker(rafCallback);

    /**
     * Mantém GSAP sem lag smoothing artificial, para que o ticker
     * reflita melhor o tempo real consumido pelo Lenis.
     */
    disableGsapLagSmoothing();

    debugLog("Bridge Lenis + GSAP inicializado com sucesso.", {
      hasLenis: Boolean(lenis),
    });

    return () => {
      lenis.off("scroll", onLenisScroll);
      removeGsapTicker(rafCallback);

      boundLenisRef.current = null;
      processingRef.current = false;

      debugLog("Bridge Lenis + GSAP finalizado.");
    };
  }, [lenis]);
}

export default useLenisEngine;
