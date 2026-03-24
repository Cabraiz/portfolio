import React, {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
} from "react";

import usePathSectionSync from "../../../features/navigation/usePathSectionSync";
import { DEFAULT_LANDING_SECTION_ID } from "../../../features/navigation/landingSections";
import useDocumentVisibilitySync from "../../../features/scroll/useDocumentVisibilitySync";
import useLenisEngine from "../../../features/scroll/useLenisEngine";

import LandingSectionShell from "./LandingSectionShell";
import { LANDING_SECTION_ORDER, getLandingSectionDefinitions } from "./landingSections.config";
import useLandingActiveSection from "./hooks/useLandingActiveSection";
import {
  resolveLandingResponsiveSpacing,
  resolveLandingScrollMarginTop,
  resolveLandingSectionMinHeight,
} from "./landingLayout.tokens";
import { resolveLandingSectionBehavior } from "./landing.types";
import useSectionRenderPolicy from "./useSectionRenderPolicy";

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
  backgroundAttachment: "scroll",
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const mobileSpacing = resolveLandingResponsiveSpacing("mobile");

const baseSectionStyle: CSSProperties = {
  ...sectionBackground,
  width: "100%",
  minWidth: 0,
  margin: 0,
  paddingTop: mobileSpacing.sectionPaddingBlockStart,
  paddingRight: mobileSpacing.sectionPaddingInline,
  paddingBottom: mobileSpacing.sectionPaddingBlockEnd,
  paddingLeft: mobileSpacing.sectionPaddingInline,
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start",
  position: "relative",
  overflowX: "clip",
  overflowY: "visible",
  boxSizing: "border-box",
  userSelect: "none",
};

const baseContentContainerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "100%",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  userSelect: "none",
};

const LandingPageMobile: React.FC = () => {
  const containerRef = useRef<HTMLElement | null>(null);

  const sections = useMemo(() => {
    return getLandingSectionDefinitions("mobile");
  }, []);

  const { currentSectionId, syncSectionFromScroll } = usePathSectionSync({
    containerRef,
    defaultSectionId: DEFAULT_LANDING_SECTION_ID,
    historyMode: "replace",
  });

  useLenisEngine();
  useDocumentVisibilitySync();

  const {
    activeSectionId,
    refreshActiveSection,
  } = useLandingActiveSection({
    containerRef,
    defaultSectionId: currentSectionId,
    sectionIds: LANDING_SECTION_ORDER,
    sectionSelector: ":scope > section[data-page-section='true']",
    viewportMode: "mobile",
    activationViewportRatio: 0.48,
  });

  useEffect(() => {
    if (currentSectionId !== activeSectionId) {
      syncSectionFromScroll(activeSectionId, {
        historyMode: "replace",
      });
    }
  }, [activeSectionId, currentSectionId, syncSectionFromScroll]);

  useEffect(() => {
    refreshActiveSection("refresh");
  }, [refreshActiveSection, sections]);

  const renderPolicy = useSectionRenderPolicy({
    sections,
    activeSectionId,
    nearDistance: 1,
  });

  return (
    <main
      ref={containerRef}
      style={containerStyle}
      aria-label="Landing page mobile"
      data-active-section={activeSectionId}
      data-landing-viewport="mobile"
    >
      {sections.map((section) => {
        const behavior = resolveLandingSectionBehavior(section.behavior);

        const resolvedSectionStyle: CSSProperties = {
          ...baseSectionStyle,
          minHeight:
            section.sectionStyle?.minHeight ??
            resolveLandingSectionMinHeight("mobile", {
              preferDynamicViewport: false,
            }),
          scrollMarginTop:
            section.sectionStyle?.scrollMarginTop ??
            resolveLandingScrollMarginTop("mobile"),
          ...section.sectionStyle,
        };

        const resolvedContentStyle: CSSProperties = {
          ...baseContentContainerStyle,
          ...section.contentStyle,
        };

        return (
          <LandingSectionShell
            key={section.id}
            id={section.id}
            state={renderPolicy.getSectionState(section.id)}
            behavior={behavior}
            placeholderMinHeight={
              section.placeholderMinHeight ??
              behavior.placeholderFallbackMinHeight
            }
            sectionStyle={resolvedSectionStyle}
            contentStyle={resolvedContentStyle}
          >
            {section.content}
          </LandingSectionShell>
        );
      })}
    </main>
  );
};

export default LandingPageMobile;
