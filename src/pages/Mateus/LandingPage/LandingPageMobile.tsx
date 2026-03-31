import React, {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import {
  DEFAULT_LANDING_SECTION_ID,
  getSectionIdByPath,
  isLandingPath,
  type LandingSectionId,
} from "../../../features/navigation/landingSections";
import useDocumentVisibilitySync from "../../../features/scroll/useDocumentVisibilitySync";
import useLenisEngine from "../../../features/scroll/useLenisEngine";
import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";

import LandingSectionShell from "./LandingSectionShell";
import {
  LANDING_SECTION_ORDER,
  getLandingSectionDefinitions,
} from "./landingSections.config";
import useLandingActiveSection from "./hooks/useLandingActiveSection";
import useLandingHistorySync from "./hooks/useLandingHistorySync";
import useLandingSectionMeasurements from "./hooks/useLandingSectionMeasurements";
import {
  resolveLandingNavbarFallbackOffsetPx,
  resolveLandingResponsiveSpacing,
  resolveLandingScrollMarginTop,
  resolveLandingSectionMinHeight,
  subscribeToLandingNavbarOffset,
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
  minHeight: "100%",
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
  minHeight: "100%",
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

function resolveLandingSectionRuntimeLabel(sectionId: string): string {
  switch (sectionId) {
    case "home":
      return "Landing home mobile";
    case "portfolio":
      return "Landing portfolio mobile";
    case "roadMap":
      return "Landing RoadMap mobile";
    case "pricing":
      return "Landing pricing mobile";
    case "live":
      return "Landing live mobile";
    case "contact":
      return "Landing contact mobile";
    default:
      return `Landing ${sectionId} mobile`;
  }
}

function resolveInitialMobileSectionId(pathname: string): LandingSectionId {
  if (!isLandingPath(pathname)) {
    return DEFAULT_LANDING_SECTION_ID;
  }

  return getSectionIdByPath(pathname) ?? DEFAULT_LANDING_SECTION_ID;
}

const LandingPageMobile: React.FC = () => {
  const containerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  const [navbarOffsetPx, setNavbarOffsetPx] = useState<number>(() =>
    resolveLandingNavbarFallbackOffsetPx("mobile"),
  );

  const sections = useMemo(() => {
    return getLandingSectionDefinitions("mobile");
  }, []);

  const initialSectionId = useMemo<LandingSectionId>(() => {
    return resolveInitialMobileSectionId(location.pathname);
  }, [location.pathname]);

  useLenisEngine();
  useDocumentVisibilitySync();

  useEffect(() => {
    return subscribeToLandingNavbarOffset("mobile", setNavbarOffsetPx);
  }, []);

  const { activeSectionId, refreshActiveSection } = useLandingActiveSection({
    containerRef,
    defaultSectionId: initialSectionId,
    sectionIds: LANDING_SECTION_ORDER,
    sectionSelector: ":scope > section[data-page-section='true']",
    viewportMode: "mobile",
    navbarOffsetPx,
    activationViewportRatio: 0.42,
  });

  const { routeSectionId } = useLandingHistorySync({
    committedSectionId: activeSectionId,
    defaultSectionId: initialSectionId,
    viewportMode: "mobile",
    historyMode: "replace",
  });

  const { registerSectionElement, getPlaceholderMinHeight } =
    useLandingSectionMeasurements({
      defaultPlaceholderMinHeight: resolveLandingSectionMinHeight("mobile", {
        preferDynamicViewport: false,
      }),
    });

  useEffect(() => {
    refreshActiveSection("refresh");
  }, [navbarOffsetPx, refreshActiveSection, sections]);

  const renderPolicy = useSectionRenderPolicy({
    sections,
    activeSectionId,
    nearDistance: 1,
    viewportMode: "mobile",
  });

  return (
    <main
      ref={containerRef}
      style={containerStyle}
      aria-label="Landing page mobile"
      data-active-section={activeSectionId}
      data-route-section={routeSectionId}
      data-landing-viewport="mobile"
    >
      {sections.map((section) => {
        const behavior = resolveLandingSectionBehavior(section.behavior);
        const sectionState = renderPolicy.getSectionState(section.id);

        const resolvedSectionMinHeight =
          section.expectedMinHeight ??
          section.sectionStyle?.minHeight ??
          resolveLandingSectionMinHeight("mobile", {
            preferDynamicViewport: false,
          });

        const resolvedSectionStyle: CSSProperties = {
          ...baseSectionStyle,
          ...section.sectionStyle,
          minHeight: resolvedSectionMinHeight,
          height:
            section.sectionStyle?.height ?? resolvedSectionMinHeight,
          scrollMarginTop:
            section.sectionStyle?.scrollMarginTop ??
            section.scrollMarginTop ??
            resolveLandingScrollMarginTop("mobile"),
          display: section.sectionStyle?.display ?? "flex",
          flexDirection: section.sectionStyle?.flexDirection ?? "column",
          alignItems: section.sectionStyle?.alignItems ?? "stretch",
          justifyContent:
            section.sectionStyle?.justifyContent ?? "flex-start",
        };

        const resolvedContentStyle: CSSProperties = {
          ...baseContentContainerStyle,
          ...section.contentStyle,
          minHeight: section.contentStyle?.minHeight ?? "100%",
          height: section.contentStyle?.height ?? "100%",
          display: section.contentStyle?.display ?? "flex",
          flexDirection: section.contentStyle?.flexDirection ?? "column",
          alignItems: section.contentStyle?.alignItems ?? "stretch",
          justifyContent:
            section.contentStyle?.justifyContent ?? "flex-start",
          flex: section.contentStyle?.flex ?? "1 1 auto",
        };

        const placeholderFallback =
          section.placeholderMinHeight ??
          behavior.placeholderFallbackMinHeight ??
          resolvedSectionMinHeight;

        return (
          <LandingSectionShell
            key={section.id}
            id={section.id}
            state={sectionState}
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
              <RoadMapErrorBoundary
                sectionLabel={resolveLandingSectionRuntimeLabel(section.id)}
                resetKey={`mobile:${section.id}:${sectionState}`}
                minHeight={resolvedSectionMinHeight}
                fullHeight
              >
                {section.content}
              </RoadMapErrorBoundary>
            </div>
          </LandingSectionShell>
        );
      })}
    </main>
  );
};

export default LandingPageMobile;
