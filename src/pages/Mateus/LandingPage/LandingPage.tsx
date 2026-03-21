import React, {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

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

import LandingSectionShell from "./LandingSectionShell";
import useSectionRenderPolicy from "./useSectionRenderPolicy";

type LandingSection = Readonly<{
  id: string;
  content: ReactNode;
  placeholderMinHeight?: CSSProperties["minHeight"];
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
  alignItems: "stretch",
  justifyContent: "flex-start",
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
  minHeight: "100%",
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
    placeholderMinHeight: "100dvh",
  },
  {
    id: "portfolio",
    content: <Portfolio />,
    placeholderMinHeight: "100dvh",
  },
  {
    id: "roadMap",
    content: <RoadMap />,
    placeholderMinHeight: "100dvh",
  },
  {
    id: "pricing",
    content: <Pricing />,
    placeholderMinHeight: "100dvh",
  },
  {
    id: "live",
    content: <Live />,
    placeholderMinHeight: "100dvh",
  },
  {
    id: "contact",
    content: <ContactDesktop />,
    placeholderMinHeight: "100dvh",
  },
];

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("home");

  useLenisEngine();
  useDocumentVisibilitySync();

  const { writeSectionHash } = useHashSectionSync({
    defaultSectionId: "home",
    writeDefaultHashOnMount: true,
    historyMode: "replace",
  });

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId);
      writeSectionHash(sectionId, { historyMode: "replace" });
    },
    [writeSectionHash],
  );

  const renderPolicy = useSectionRenderPolicy({
    sections,
    activeSectionId,
    /**
     * 1 evita que a seção anterior suma cedo demais e deixe
     * um placeholder alto visível quando a próxima assume foco.
     */
    nearDistance: 1,
  });

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
        <LandingSectionShell
          key={section.id}
          id={section.id}
          state={renderPolicy.getSectionState(section.id)}
          placeholderMinHeight={section.placeholderMinHeight ?? "100dvh"}
          sectionStyle={sectionStyle}
          contentStyle={contentContainerStyle}
        >
          {section.content}
        </LandingSectionShell>
      ))}
    </main>
  );
};

export default LandingPage;
