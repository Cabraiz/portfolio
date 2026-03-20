import React, { type CSSProperties, useCallback, useRef } from "react";

import MateusDesktop from "../MateusDesktop";
import ContactDesktop from "../Contact/ContactDesktop";
import Live from "../Live/Live";
import Portfolio from "../Portfolio/Portfolio";
import Pricing from "../Pricing/Pricing";
import RoadMap from "../RoadMap/RoadMap";

import useHashSectionSync from "../../../features/scroll/useHashSectionSync";
import useLenisEngine from "../../../features/scroll/useLenisEngine";
import useDocumentVisibilitySync from "../../../features/scroll/useDocumentVisibilitySync";
import useSectionTriggers from "../../../features/scroll/useSectionTriggers";

type LandingSection = Readonly<{
  id: string;
  content: React.ReactNode;
}>;

const containerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  overflowX: "clip",
  overflowY: "visible",
  position: "relative",
  userSelect: "none",
};

const sectionBackground: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at top left, rgba(255, 215, 0, 0.12), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255, 215, 0, 0.08), transparent 70%),
    linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 50%, #0b0b0b 100%)
  `,
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const sectionStyle: CSSProperties = {
  ...sectionBackground,
  width: "100%",
  minWidth: 0,
  minHeight: "100dvh",
  margin: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflowX: "clip",
  overflowY: "visible",
  boxSizing: "border-box",
  userSelect: "none",
  scrollMarginTop: "88px",
};

const contentContainerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  userSelect: "none",
};

const sections: ReadonlyArray<LandingSection> = [
  {
    id: "home",
    content: <MateusDesktop />,
  },
  {
    id: "portfolio",
    content: <Portfolio />,
  },
  {
    id: "roadMap",
    content: <RoadMap />,
  },
  {
    id: "pricing",
    content: <Pricing />,
  },
  {
    id: "live",
    content: <Live />,
  },
  {
    id: "contact",
    content: <ContactDesktop />,
  },
];

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * O scroller real continua sendo o root do ReactLenis em AppDesktop.
   * Esta página é apenas o conteúdo vertical observado por GSAP/ScrollTrigger.
   */
  useLenisEngine();
  useDocumentVisibilitySync();

  const { writeSectionHash } = useHashSectionSync({
    defaultSectionId: "home",
    writeDefaultHashOnMount: true,
    historyMode: "replace",
  });

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      writeSectionHash(sectionId, { historyMode: "replace" });
    },
    [writeSectionHash],
  );

  useSectionTriggers({
    containerRef,
    sectionSelector: ":scope > section[data-page-section='true']",
    activeClassName: "is-active",
    triggerStart: "top 55%",
    triggerEnd: "bottom 45%",
    refreshOnMount: false,
    onSectionChange: handleSectionChange,
  });

  return (
    <main ref={containerRef} style={containerStyle} aria-label="Landing page">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          data-section={section.id}
          data-page-section="true"
          style={sectionStyle}
        >
          <div style={contentContainerStyle}>{section.content}</div>
        </section>
      ))}
    </main>
  );
};

export default LandingPage;
