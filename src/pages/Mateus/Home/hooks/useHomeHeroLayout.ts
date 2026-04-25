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
  isCompactMobile: boolean;
  isTallMobile: boolean;
  sectionStyle: CSSProperties;
  profileColumnStyle: CSSProperties;
  profileCardStyle: CSSProperties;
  profileImageWrapperStyle: CSSProperties;
  socialRowStyle: CSSProperties;
  mobileAttractCardStyle: CSSProperties;
  mobileAttractImageFrameStyle: CSSProperties;
  mobileLauncherStyle: CSSProperties;
  mobileGameMutedStateStyle: CSSProperties;
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

  const isCompactMobile = useMemo<boolean>(() => {
    return (
      isMobileViewport &&
      viewport.height <= homeHeroTokens.breakpoints.compactHeightMax
    );
  }, [isMobileViewport, viewport.height]);

  const isTallMobile = useMemo<boolean>(() => {
    return (
      isMobileViewport &&
      viewport.height >= homeHeroTokens.breakpoints.tallHeightMin
    );
  }, [isMobileViewport, viewport.height]);

  const sectionStyle = useMemo<CSSProperties>(() => {
    return {
      minHeight: homeHeroTokens.section.minHeight[mode],
      paddingTop: homeHeroTokens.section.paddingTop[mode],
      paddingBottom: homeHeroTokens.section.paddingBottom[mode],
      display: "flex",
      alignItems: "stretch",
      justifyContent: isMobileViewport
        ? "center"
        : mode === "compact"
          ? "center"
          : "flex-start",
      height: "100%",
      width: "100%",
      boxSizing: "border-box",
    };
  }, [isMobileViewport, mode]);

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
      width: "100%",
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
      backdropFilter: homeHeroTokens.profileCard.blur[mode],
      WebkitBackdropFilter: homeHeroTokens.profileCard.blur[mode],
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
        justifyItems: "stretch",
        alignItems: "stretch",
        columnGap: homeHeroTokens.socialRow.gap.default,
        rowGap: homeHeroTokens.socialRow.gap.default,
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      };
    }

    return {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: homeHeroTokens.socialRow.gap[mode],
      width: "100%",
      flexWrap: "nowrap",
      boxSizing: "border-box",
    };
  }, [isMobileViewport, mode]);

  const mobileAttractCardStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      maxWidth: homeHeroTokens.mobileAttractMode.cardMaxWidth,
      minHeight: homeHeroTokens.mobileAttractMode.cardMinHeight,
      borderRadius: homeHeroTokens.mobileAttractMode.cardRadius,
      boxSizing: "border-box",
    };
  }, []);

  const mobileAttractImageFrameStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      minHeight: homeHeroTokens.mobileAttractMode.imageMinHeight,
      borderRadius: "20px",
      boxSizing: "border-box",
    };
  }, []);

  const mobileLauncherStyle = useMemo<CSSProperties>(() => {
    return {
      width: homeHeroTokens.mobileAttractMode.launcherWidth,
      minHeight: homeHeroTokens.mobileAttractMode.launcherMinHeight,
      boxSizing: "border-box",
    };
  }, []);

  const mobileGameMutedStateStyle = useMemo<CSSProperties>(() => {
    return {
      opacity: homeHeroTokens.mobileGame.socialOpacityWhenOpen,
      transform: `scale(${homeHeroTokens.mobileGame.cardScaleWhenOpen})`,
      transition: "opacity 220ms ease, transform 220ms ease",
      boxSizing: "border-box",
    };
  }, []);

  return {
    mode,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    isCompactDesktop: mode === "compact",
    isTallDesktop: mode === "tall",
    isMobileViewport,
    isCompactMobile,
    isTallMobile,
    sectionStyle,
    profileColumnStyle,
    profileCardStyle,
    profileImageWrapperStyle,
    socialRowStyle,
    mobileAttractCardStyle,
    mobileAttractImageFrameStyle,
    mobileLauncherStyle,
    mobileGameMutedStateStyle,
  };
}

export default useHomeHeroLayout;
