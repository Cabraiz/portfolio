import { useLenisEngine } from "@/features/scroll/useLenisEngine";

/**
 * Façade de compatibilidade para a engine central de scroll.
 *
 * Mantido temporariamente para evitar quebrar imports legados.
 * Toda a integração Lenis + GSAP + ScrollTrigger já vive em
 * features/scroll/useLenisEngine.
 */
export function useLenisScrollTrigger(): void {
  useLenisEngine();
}

export default useLenisScrollTrigger;
