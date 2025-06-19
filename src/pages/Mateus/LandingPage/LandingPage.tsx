import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useLenis } from "../../../pages/Mateus/Context/LenisContext";

import Portfolio from "../Portfolio/Portfolio";
import RoadMap from "../RoadMap/RoadMap";
import Pricing from "../Pricing/Pricing";
import Live from "../Live/Live";
import Contact from "../Contact/Contact";
import Mateus from "../Mateus";

gsap.registerPlugin(ScrollTrigger);

const containerStyle: React.CSSProperties = {
  overflowX: "hidden",
  width: "100%",
  userSelect: "none",
};

const sectionBackground = {
  backgroundImage: `
    radial-gradient(circle at top left, rgba(255, 215, 0, 0.12), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255, 215, 0, 0.08), transparent 70%),
    linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 50%, #0b0b0b 100%)
  `,
  backgroundAttachment: "fixed",
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const sectionStyle: React.CSSProperties = {
  ...sectionBackground,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  boxSizing: "border-box",
  userSelect: "none",
};

const contentContainerStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  userSelect: "none",
};

const LandingPage: React.FC = () => {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash) as HTMLElement;
      if (target) {
        setTimeout(() => {
          lenis.scrollTo(target, { offset: -100, duration: 1.3 });
        }, 300);
      }
    }

    const sections = gsap.utils.toArray<HTMLElement>("section");
    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          window.history.replaceState(null, "", `#${section.id}`);
        },
        onEnterBack: () => {
          window.history.replaceState(null, "", `#${section.id}`);
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [lenis]);

  return (
    <div style={containerStyle}>
      <section id="home" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Mateus />
        </div>
      </section>

      <section id="portfolio" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Portfolio />
        </div>
      </section>

      <section id="roadmap" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <RoadMap />
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

      <section id="contact" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Contact />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
