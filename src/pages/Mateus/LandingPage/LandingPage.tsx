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
import {
  LANDING_SECTION_ORDER,
  getLandingSectionDefinitions,
} from "./landingSections.config";
import useLandingActiveSection from "./hooks/useLandingActiveSection";
import useLandingSectionMeasurements from "./hooks/useLandingSectionMeasurements";
import {
  resolveLandingResponsiveSpacing,
  resolveLandingSectionMinHeight,
  resolveLandingScrollMarginTop,
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
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const desktopSpacing = resolveLandingResponsiveSpacing("desktop");

const baseSectionStyle: CSSProperties = {
  ...sectionBackground,
  width: "100%",
  minWidth: 0,
  margin: 0,
  paddingTop: desktopSpacing.sectionPaddingBlockStart,
  paddingRight: desktopSpacing.sectionPaddingInline,
  paddingBottom: desktopSpacing.sectionPaddingBlockEnd,
  paddingLeft: desktopSpacing.sectionPaddingInline,
  display: "flex",
  flexDirection: "column",
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
  height: "100%",
  minHeight: 0,
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  userSelect: "none",
};

const contentMeasurementWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "100%",
  minHeight: 0,
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  userSelect: "none",
};

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLElement | null>(null);

  const sections = useMemo(() => {
    return getLandingSectionDefinitions("desktop");
  }, []);

  const { currentSectionId, syncSectionFromScroll } = usePathSectionSync({
    containerRef,
    defaultSectionId: DEFAULT_LANDING_SECTION_ID,
    historyMode: "replace",
  });

  useLenisEngine();
  useDocumentVisibilitySync();

  const { activeSectionId, refreshActiveSection } = useLandingActiveSection({
    containerRef,
    defaultSectionId: currentSectionId,
    sectionIds: LANDING_SECTION_ORDER,
    sectionSelector: ":scope > section[data-page-section='true']",
    viewportMode: "desktop",
    activationViewportRatio: 0.42,
  });

  const { registerSectionElement, getPlaceholderMinHeight } =
    useLandingSectionMeasurements({
      defaultPlaceholderMinHeight: resolveLandingSectionMinHeight("desktop", {
        preferDynamicViewport: true,
      }),
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
      aria-label="Landing page"
      data-active-section={activeSectionId}
      data-landing-viewport="desktop"
    >
      {sections.map((section) => {
        const behavior = resolveLandingSectionBehavior(section.behavior);

        const resolvedSectionMinHeight =
          section.sectionStyle?.minHeight ??
          resolveLandingSectionMinHeight("desktop", {
            preferDynamicViewport: true,
          });

        const resolvedSectionHeight =
          section.sectionStyle?.height ?? resolvedSectionMinHeight;

        const resolvedSectionStyle: CSSProperties = {
          ...baseSectionStyle,
          ...section.sectionStyle,
          minHeight: resolvedSectionMinHeight,
          height: resolvedSectionHeight,
          scrollMarginTop:
            section.sectionStyle?.scrollMarginTop ??
            resolveLandingScrollMarginTop("desktop"),
          display: section.sectionStyle?.display ?? "flex",
          flexDirection: section.sectionStyle?.flexDirection ?? "column",
          alignItems: section.sectionStyle?.alignItems ?? "stretch",
          justifyContent:
            section.sectionStyle?.justifyContent ?? "flex-start",
        };

        const resolvedContentStyle: CSSProperties = {
          ...baseContentContainerStyle,
          ...section.contentStyle,
          height: section.contentStyle?.height ?? "100%",
          minHeight: section.contentStyle?.minHeight ?? 0,
          display: section.contentStyle?.display ?? "flex",
          flexDirection: section.contentStyle?.flexDirection ?? "column",
          alignItems: section.contentStyle?.alignItems ?? "stretch",
          justifyContent:
            section.contentStyle?.justifyContent ?? "flex-start",
          flex: section.contentStyle?.flex ?? "1 1 auto",
        };

        const placeholderFallback =
          section.placeholderMinHeight ??
          behavior.placeholderFallbackMinHeight;

        return (
          <LandingSectionShell
            key={section.id}
            id={section.id}
            state={renderPolicy.getSectionState(section.id)}
            behavior={behavior}
            placeholderMinHeight={getPlaceholderMinHeight(
              section.id,
              placeholderFallback,
            )}
            sectionStyle={resolvedSectionStyle}
            contentStyle={resolvedContentStyle}
          >
            <div
              ref={(element) => {
                registerSectionElement(section.id, element);
              }}
              style={contentMeasurementWrapperStyle}
              data-landing-section-content={section.id}
            >
              {section.content}
            </div>
          </LandingSectionShell>
        );
      })}
    </main>
  );
};

export default LandingPage;
