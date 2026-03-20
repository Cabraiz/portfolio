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

export function useLenisEngine(): void {
  const lenis = useLenis();
  const initializedRef = useRef(false);
  const processingRef = useRef(false);

  useLayoutEffect(() => {
    if (!lenis || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const onLenisScroll: LenisScrollCallback = () => {
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
    disableGsapLagSmoothing();

    return () => {
      lenis.off("scroll", onLenisScroll);
      removeGsapTicker(rafCallback);
      initializedRef.current = false;
      processingRef.current = false;
    };
  }, [lenis]);
}

export default useLenisEngine;
