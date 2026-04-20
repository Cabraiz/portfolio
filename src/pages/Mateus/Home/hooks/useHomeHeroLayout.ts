import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  homeHeroTokens,
  type HomeHeroViewportMode,
} from "../layout/homeHero.tokens";
import { getHomeHeroViewportMode } from "../layout/getHomeHeroViewportMode";

type ViewportSize = Readonly<{
  width: number;
  height: number;
}>;

type UseHomeHeroLayoutResult = Readonly<{
  mode: HomeHeroViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  isCompactDesktop: boolean;
  isTallDesktop: boolean;
  isMobileViewport: boolean;
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

export function useHomeHeroLayout(): UseHomeHeroLayoutResult {
  const [viewport, setViewport] = useState<ViewportSize>(() =>
    getInitialViewport(),
  );

  useEffect(() => {
    const browserWindow = globalThis.window;

    if (browserWindow === undefined) {
      return undefined;
    }

    let frameId = 0;

    const updateViewport = () => {
      frameId = 0;

      const nextViewport = {
        width: browserWindow.innerWidth,
        height: browserWindow.innerHeight,
      };

      setViewport((currentViewport) => {
        if (
          currentViewport.width === nextViewport.width &&
          currentViewport.height === nextViewport.height
        ) {
          return currentViewport;
        }

        return nextViewport;
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

    handleResize();

    return () => {
      browserWindow.removeEventListener("resize", handleResize);
      browserWindow.removeEventListener("orientationchange", handleResize);

      if (frameId !== 0) {
        globalThis.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const mode = useMemo<HomeHeroViewportMode>(() => {
    return getHomeHeroViewportMode(viewport.width, viewport.height);
  }, [viewport.width, viewport.height]);

  const isMobileViewport = useMemo<boolean>(() => {
    return viewport.width < homeHeroTokens.breakpoints.desktopMinWidth;
  }, [viewport.width]);

  const sectionStyle = useMemo<CSSProperties>(() => {
    return {
      minHeight: homeHeroTokens.section.minHeight[mode],
      paddingTop: homeHeroTokens.section.paddingTop[mode],
      paddingBottom: homeHeroTokens.section.paddingBottom[mode],
      display: "flex",
      alignItems: "stretch",
      justifyContent: mode === "compact" ? "center" : "flex-start",
      height: "100%",
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
      paddingLeft: homeHeroTokens.profileColumn.paddingLeft[mode],
      paddingRight: homeHeroTokens.profileColumn.paddingRight[mode],
      paddingTop: "0px",
      boxSizing: "border-box",
    };
  }, [mode]);

  const profileCardStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundColor: homeHeroTokens.profileCard.backgroundColor,
      marginLeft: homeHeroTokens.profileCard.marginLeft[mode],
      padding: homeHeroTokens.profileCard.padding[mode],
      borderRadius: homeHeroTokens.profileCard.borderRadius[mode],
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      width: homeHeroTokens.profileCard.width[mode],
      height: "auto",
      gap: homeHeroTokens.profileCard.gap[mode],
      border: homeHeroTokens.profileCard.border[mode],
      boxShadow: homeHeroTokens.profileCard.shadow[mode],
      boxSizing: "border-box",
    };
  }, [mode]);

  const profileImageWrapperStyle = useMemo<CSSProperties>(() => {
    return {
      borderRadius: homeHeroTokens.profileImage.borderRadius[mode],
      overflow: "hidden",
      width: "100%",
      maxWidth: homeHeroTokens.profileImage.maxWidth[mode],
      aspectRatio: homeHeroTokens.profileImage.aspectRatio,
      position: "relative",
      boxShadow: homeHeroTokens.profileImage.shadow,
      flexShrink: 0,
    };
  }, [mode]);

  const socialRowStyle = useMemo<CSSProperties>(() => {
    if (isMobileViewport) {
      return {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        justifyItems: "center",
        alignItems: "center",
        columnGap: "12px",
        rowGap: "12px",
        width: "100%",
        maxWidth: "220px",
        margin: "0 auto",
      };
    }

    return {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: homeHeroTokens.socialRow.gap[mode],
      width: "100%",
      flexWrap: "nowrap",
    };
  }, [isMobileViewport, mode]);

  return {
    mode,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    isCompactDesktop: mode === "compact",
    isTallDesktop: mode === "tall",
    isMobileViewport,
    sectionStyle,
    profileColumnStyle,
    profileCardStyle,
    profileImageWrapperStyle,
    socialRowStyle,
  };
}

export default useHomeHeroLayout;
