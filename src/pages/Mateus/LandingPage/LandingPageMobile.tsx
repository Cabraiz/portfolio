import React, { type CSSProperties, useRef } from "react";

import ContactMobile from "../Contact/ContactMobile";
import Live from "../Live/Live";
import MateusMobile from "../MateusMobile/MateusMobile";
import Portfolio from "../Portfolio/Portfolio";
import Pricing from "../Pricing/Pricing";
import RoadMapMobile from "../RoadMap/RoadMapMobile";

import useDocumentVisibilitySync from "../../../features/scroll/useDocumentVisibilitySync";
import useHashSectionSync from "../../../features/scroll/useHashSectionSync";
import useLenisEngine from "../../../features/scroll/useLenisEngine";
import useSectionTriggers from "../../../features/scroll/useSectionTriggers";

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLenisEngine();
  useDocumentVisibilitySync();

  const { writeSectionHash } = useHashSectionSync({
    defaultSectionId: "home",
    writeDefaultHashOnMount: true,
    historyMode: "replace",
  });

  useSectionTriggers({
    containerRef,
    activeClassName: "is-active",
    triggerStart: "top center",
    triggerEnd: "bottom center",
    refreshOnMount: true,
    onSectionChange: (sectionId) => {
      writeSectionHash(sectionId, { historyMode: "replace" });
    },
  });

  return (
    <div ref={containerRef} style={containerStyle}>
      <section id="home" data-section="home" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <MateusMobile />
        </div>
      </section>

      <section id="portfolio" data-section="portfolio" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Portfolio />
        </div>
      </section>

      <section id="pricing" data-section="pricing" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Pricing />
        </div>
      </section>

      <section id="live" data-section="live" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <Live />
        </div>
      </section>

      <section id="roadmap" data-section="roadmap" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <RoadMapMobile />
        </div>
      </section>

      <section id="contact" data-section="contact" style={sectionStyle}>
        <div style={contentContainerStyle}>
          <ContactMobile />
        </div>
      </section>
    </div>
  );
};

export default LandingPageMobile;
