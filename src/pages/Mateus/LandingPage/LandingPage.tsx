import React, { CSSProperties, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import Portfolio from "../Portfolio/Portfolio";
import RoadMap from "../RoadMap/RoadMap";
import Pricing from "../Pricing/Pricing";
import Live from "../Live/Live";
import ContactDesktop from "../Contact/ContactDesktop";
import MateusDesktop from "../MateusDesktop";

import { useLenisScrollTrigger } from "../../../hooks/useLenisScrollTrigger";

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
  backgroundAttachment: "fixed",
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

const LandingPage: React.FC = () => {
  const lenis = useLenis();
  useLenisScrollTrigger();

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
          <MateusDesktop />
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
          <ContactDesktop />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
