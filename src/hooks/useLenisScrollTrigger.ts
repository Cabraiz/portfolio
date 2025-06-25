import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(ScrollTrigger);

export function useLenisScrollTrigger() {
  const lenis = useLenis();
  const initialized = useRef(false);
  const processing = useRef(false); // 🔒 trava para evitar sobreposição de raf

  useLayoutEffect(() => {
    if (!lenis || initialized.current) return;
    initialized.current = true;

    const root = lenis.rootElement;

    const rafCallback = (time: number) => {
      if (processing.current) return;
      processing.current = true;

      try {
        // ✅ converte segundos do ticker para milissegundos
        lenis.raf(time * 1000);
      } finally {
        // ✅ libera a próxima chamada
        processing.current = false;
      }
    };

    if (root) {
      ScrollTrigger.scrollerProxy(root, {
        scrollTop(value) {
          if (value !== undefined) {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect: () => ({
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }),
        pinType: root.style.transform ? "transform" : "fixed",
      });

      ScrollTrigger.defaults({ scroller: root });
    }

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0); // ✅ impede suavização que poderia acumular eventos
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(rafCallback);

      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ScrollTrigger.clearMatchMedia?.();

      if (root) {
        ScrollTrigger.scrollerProxy(root, null as any);
      }

      initialized.current = false;
    };
  }, [lenis]);
}
