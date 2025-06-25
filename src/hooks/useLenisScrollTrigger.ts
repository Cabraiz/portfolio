import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

export function useLenisScrollTrigger() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const root = lenis.rootElement;

    if (root) {
      // 🔥 Informa ao ScrollTrigger qual é o container de scroll
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

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // 🔥 muito importante
    });

    gsap.ticker.lagSmoothing(0); // 🔥 tira delay

    ScrollTrigger.refresh(); // 🔥 atualiza ScrollTrigger

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      if (root) {
        ScrollTrigger.scrollerProxy(root, null as any);
      }
    };
  }, [lenis]);
}
