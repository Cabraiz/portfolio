import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  mateusHeroTokens,
  type MateusHeroViewportMode,
} from "../layout/mateusHero.tokens";

type ViewportSize = Readonly<{
  width: number;
  height: number;
}>;

type UseMateusHeroLayoutResult = Readonly<{
  mode: MateusHeroViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  isCompactDesktop: boolean;
  isTallDesktop: boolean;
  sectionStyle: CSSProperties;
  profileColumnStyle: CSSProperties;
  profileCardStyle: CSSProperties;
  profileImageWrapperStyle: CSSProperties;
  socialRowStyle: CSSProperties;
}>;

function getInitialViewport(): ViewportSize {
  const browserWindow = globalThis.window;

  if (browserWindow === undefined) {
    return {
      width: 1440,
      height: 900,
    };
  }

  return {
    width: browserWindow.innerWidth,
    height: browserWindow.innerHeight,
  };
}

function resolveViewportMode(
  width: number,
  height: number,
): MateusHeroViewportMode {
  const {
    desktopMinWidth,
    compactHeightMax,
    tallHeightMin,
  } = mateusHeroTokens.breakpoints;

  if (width < desktopMinWidth) {
    return "compact";
  }

  if (height <= compactHeightMax) {
    return "compact";
  }

  if (height >= tallHeightMin) {
    return "tall";
  }

  return "default";
}

export function useMateusHeroLayout(): UseMateusHeroLayoutResult {
  const [viewport, setViewport] = useState<ViewportSize>(() =>
    getInitialViewport(),
  );

  useEffect(() => {
    const browserWindow = globalThis.window;

    if (browserWindow === undefined) {
      return undefined;
    }

    const visualViewport = browserWindow.visualViewport;
    let frameId = 0;

    const updateViewport = () => {
      frameId = 0;

      setViewport({
        width: browserWindow.innerWidth,
        height: browserWindow.innerHeight,
      });
    };

    const handleResize = () => {
      if (frameId !== 0) {
        globalThis.cancelAnimationFrame(frameId);
      }

      frameId = globalThis.requestAnimationFrame(updateViewport);
    };

    browserWindow.addEventListener("resize", handleResize);
    browserWindow.addEventListener("orientationchange", handleResize);
    visualViewport?.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      browserWindow.removeEventListener("resize", handleResize);
      browserWindow.removeEventListener("orientationchange", handleResize);
      visualViewport?.removeEventListener("resize", handleResize);

      if (frameId !== 0) {
        globalThis.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const mode = useMemo<MateusHeroViewportMode>(() => {
    return resolveViewportMode(viewport.width, viewport.height);
  }, [viewport.width, viewport.height]);

  const sectionStyle = useMemo<CSSProperties>(() => {
    return {
      minHeight: mateusHeroTokens.section.minHeight[mode],
      paddingTop: mateusHeroTokens.section.paddingTop[mode],
      paddingBottom: mateusHeroTokens.section.paddingBottom[mode],
      display: "flex",
      alignItems: "stretch",
      boxSizing: "border-box",
    };
  }, [mode]);

  const profileColumnStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: mateusHeroTokens.profileColumn.paddingLeft[mode],
      paddingRight: mateusHeroTokens.profileColumn.paddingRight[mode],
      boxSizing: "border-box",
    };
  }, [mode]);

  const profileCardStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundColor: mateusHeroTokens.profileCard.backgroundColor,
      marginLeft: mateusHeroTokens.profileCard.marginLeft[mode],
      padding: mateusHeroTokens.profileCard.padding[mode],
      borderRadius: mateusHeroTokens.profileCard.borderRadius[mode],
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      width: mateusHeroTokens.profileCard.width[mode],
      height: "auto",
      gap: mateusHeroTokens.profileCard.gap[mode],
      backdropFilter: mateusHeroTokens.profileCard.blur[mode],
      WebkitBackdropFilter: mateusHeroTokens.profileCard.blur[mode],
      boxSizing: "border-box",
    };
  }, [mode]);

  const profileImageWrapperStyle = useMemo<CSSProperties>(() => {
    return {
      borderRadius: mateusHeroTokens.profileImage.borderRadius[mode],
      overflow: "hidden",
      width: "100%",
      maxWidth: mateusHeroTokens.profileImage.maxWidth[mode],
      aspectRatio: mateusHeroTokens.profileImage.aspectRatio,
      position: "relative",
      boxShadow: mateusHeroTokens.profileImage.shadow,
      flexShrink: 0,
    };
  }, [mode]);

  const socialRowStyle = useMemo<CSSProperties>(() => {
    return {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: mateusHeroTokens.socialRow.gap[mode],
      width: "100%",
      flexWrap: "nowrap",
    };
  }, [mode]);

  return {
    mode,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    isCompactDesktop: mode === "compact",
    isTallDesktop: mode === "tall",
    sectionStyle,
    profileColumnStyle,
    profileCardStyle,
    profileImageWrapperStyle,
    socialRowStyle,
  };
}

export default useMateusHeroLayout;
