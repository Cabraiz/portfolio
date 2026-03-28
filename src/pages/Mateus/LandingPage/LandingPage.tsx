import React, {
  type CSSProperties,
  useMemo,
  useRef,
} from "react";

import {
  DEFAULT_LANDING_SECTION_ID,
} from "../../../features/navigation/landingSections";
import useLandingSectionNavigation from "../../../features/navigation/useLandingSectionNavigation";
import useDocumentVisibilitySync from "../../../features/scroll/useDocumentVisibilitySync";
import useLenisEngine from "../../../features/scroll/useLenisEngine";
import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";

import LandingSectionShell from "./LandingSectionShell";
import { resolveLandingDesktopScrollPolicy } from "./landingDesktopScrollPolicy";
import useLandingSectionMeasurements from "./hooks/useLandingSectionMeasurements";
import { getLandingSectionDefinitions } from "./landingSections.config";
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
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  minHeight: 0,
  userSelect: "none",
};

const contentMeasurementWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  minHeight: 0,
  userSelect: "none",
};

function resolveLandingSectionRuntimeLabel(sectionId: string): string {
  switch (sectionId) {
    case "home":
      return "Landing home";
    case "portfolio":
      return "Landing portfolio";
    case "roadMap":
      return "Landing RoadMap";
    case "pricing":
      return "Landing pricing";
    case "live":
      return "Landing live";
    case "contact":
      return "Landing contact";
    default:
      return `Landing ${sectionId}`;
  }
}

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLElement | null>(null);

  const sections = useMemo(() => {
    return getLandingSectionDefinitions("desktop");
  }, []);

  const desktopScrollPolicy = useMemo(() => {
    return resolveLandingDesktopScrollPolicy({
      defaultSectionId: DEFAULT_LANDING_SECTION_ID,
    });
  }, []);

  useLenisEngine();
  useDocumentVisibilitySync();

  const {
    observedSectionId,
    committedSectionId,
    routeSectionId,
  } = useLandingSectionNavigation({
    containerRef,
    defaultSectionId: desktopScrollPolicy.defaultSectionId,
    sectionIds: desktopScrollPolicy.sectionIds,
    sectionSelector: desktopScrollPolicy.sectionSelector,
    viewportMode: desktopScrollPolicy.viewportMode,
    navbarOffsetPx: desktopScrollPolicy.observed.navbarOffsetPx,
    activationViewportRatio:
      desktopScrollPolicy.observed.activationViewportRatio,
    tokens: desktopScrollPolicy.tokens,
    scheduling: desktopScrollPolicy.scheduling,
    urlSyncEligibleSectionIds: desktopScrollPolicy.url.eligibleSectionIds,
    syncUrl: true,
  });

  const renderAnchorSectionId = observedSectionId || committedSectionId;

  const { registerSectionElement, getPlaceholderMinHeight } =
    useLandingSectionMeasurements({
      defaultPlaceholderMinHeight: resolveLandingSectionMinHeight("desktop", {
        preferDynamicViewport: true,
      }),
    });

  const renderPolicy = useSectionRenderPolicy({
    sections,
    activeSectionId: renderAnchorSectionId,
    nearDistance: desktopScrollPolicy.render.nearDistance,
    stableNearDistance: desktopScrollPolicy.render.stableNearDistance,
    disableFar: desktopScrollPolicy.render.disableFar,
    viewportMode: desktopScrollPolicy.viewportMode,
  });

  return (
    <main
      ref={containerRef}
      style={containerStyle}
      aria-label="Landing page"
      data-active-section={committedSectionId}
      data-observed-section={observedSectionId}
      data-render-anchor-section={renderAnchorSectionId}
      data-route-section={routeSectionId}
      data-landing-viewport="desktop"
      data-landing-history-mode={desktopScrollPolicy.url.historyMode}
    >
      {sections.map((section) => {
        const behavior = resolveLandingSectionBehavior(section.behavior);
        const sectionState = renderPolicy.getSectionState(section.id);

        const resolvedSectionMinHeight =
          section.sectionStyle?.minHeight ??
          resolveLandingSectionMinHeight("desktop", {
            preferDynamicViewport: true,
          });

        const resolvedSectionStyle: CSSProperties = {
          ...baseSectionStyle,
          ...section.sectionStyle,
          minHeight: resolvedSectionMinHeight,
          height: section.sectionStyle?.height,
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
          height: section.contentStyle?.height ?? "auto",
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
                resetKey={section.id}
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

export default LandingPage;
