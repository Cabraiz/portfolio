import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { shouldDisableScrollFades } from "../../../features/scroll/scrollMotionFlags";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  return (
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const Pricing: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (prefersReducedMotion() || shouldDisableScrollFades()) {
      gsap.set(container, {
        autoAlpha: 1,
        y: 0,
        clearProps: "transform,opacity,willChange",
      });

      container.style.willChange = "auto";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(container, {
        autoAlpha: 0,
        y: 36,
        willChange: "transform, opacity",
        force3D: true,
      });

      gsap.to(container, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
        onStart: () => {
          container.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          container.style.willChange = "auto";
        },
        onReverseComplete: () => {
          container.style.willChange = "auto";
        },
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
          end: "bottom 28%",
          toggleActions: "play none none reverse",
          fastScrollEnd: true,
          invalidateOnRefresh: true,
        },
      });
    }, container);

    return () => {
      ctx.revert();
      container.style.willChange = "auto";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h1 style={{ fontSize: "4vw" }}>Pricing</h1>
      <p style={{ opacity: 0.6, fontSize: "1.2vw" }}>
        Detalhes dos planos, preços e o que cada pacote oferece.
      </p>
    </div>
  );
};

export default Pricing;
