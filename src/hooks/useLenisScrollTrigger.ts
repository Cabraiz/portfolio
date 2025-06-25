import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function useLenisScrollTrigger() {
  const lenis = useLenis();
  const initialized = useRef(false); // evita reexecução desnecessária

  useEffect(() => {
    if (!lenis || initialized.current) return;
    initialized.current = true;

    const root = lenis.rootElement;

    // ✅ Função nomeada para add/remove do ticker
    const rafCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    if (root) {
      ScrollTrigger.scrollerProxy(root, {
        scrollTop(value) {
          if (value !== undefined) {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: root.style.transform ? "transform" : "fixed",
      });

      ScrollTrigger.defaults({ scroller: root });
    }

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      // ✅ Remove listener e ticker corretamente
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(rafCallback);

      // ✅ Limpa todos os triggers ativos (sem erro de tipo)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ScrollTrigger.clearMatchMedia?.();

      if (root) {
        ScrollTrigger.scrollerProxy(root, null as any);
      }

      initialized.current = false; // opcional: permitir nova init se desmontar/montar
    };
  }, [lenis]);
}
