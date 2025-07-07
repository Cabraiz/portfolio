import React, { CSSProperties, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import Portfolio from "../Portfolio/Portfolio";
import RoadMap from "../RoadMap/RoadMap";
import Pricing from "../Pricing/Pricing";
import Live from "../Live/Live";

import { useLenisScrollTrigger } from "../../../hooks/useLenisScrollTrigger";
import MateusMobile from "../MateusMobile";
import ContactMobile from "../Contact/ContactMobile";
import RoadMapMobile from "../RoadMap/RoadMapMobile";

gsap.registerPlugin(ScrollTrigger);

const containerStyle: CSSProperties = {
  overflowX: "hidden",
  width: "100%",
  userSelect: "none",
};

const sectionBackground: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at top left, rgba(255, 215, 0, 0.12), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255, 215, 0, 0.08), transparent 70%),
    linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 50%, #0b0b0b 100%)
  `,
  backgroundAttachment: "scroll",
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const sectionStyle: CSSProperties = {
  ...sectionBackground,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  boxSizing: "border-box",
  userSelect: "none",
};

const contentContainerStyle: CSSProperties = {
  width: "100%",
  padding: "0",
  boxSizing: "border-box",
  userSelect: "none",
};

const LandingPageMobile: React.FC = () => {
  const lenis = useLenis();
  useLenisScrollTrigger();

  // ✅ Agora não usamos mais activeSection!
  useLayoutEffect(() => {
  if (!lenis) return;

  const sections = gsap.utils.toArray<HTMLElement>("section");

  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      toggleClass: { targets: section, className: "is-active" },
      scroller: lenis.rootElement, // ESSENCIAL para Lenis
    });
  });

  // ESSENCIAL para recalcular tudo depois que criou os triggers
  ScrollTrigger.refresh();

  return () => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };
}, [lenis]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenis?.stop?.();
      } else {
        lenis?.start?.();
        ScrollTrigger.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [lenis]);

  return (
    <div style={containerStyle}>
      
      <section id="home" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <MateusMobile />
        </div>
      </section>

      <section id="portfolio" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Portfolio />
        </div>
      </section>

      <section id="pricing" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Pricing />
        </div>
      </section>

      <section id="live" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Live />
        </div>
      </section>

      <section id="roadmap" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <RoadMapMobile />
        </div>
      </section>

      <section id="contact" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <ContactMobile />
        </div>
      </section>
    </div>
  );
};

export default LandingPageMobile;
