import React, { useMemo } from "react";

import HeroMarqueeMobile from "./HeroMarqueeMobile";
import SocialRowMobile, { type MobileSocialItem } from "./SocialRowMobile";
import { homeHeroTokens } from "../../layout/homeHero.tokens";

export type HeroProfileColumnMobileProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  bottomSlot?: React.ReactNode;
  className?: string;
  isGameOpen?: boolean;
}>;

export default function HeroProfileColumnMobile({
  imageSrc,
  imageAlt = "Foto de Mateus Cardoso Cabral, empresário de inteligência artificial, investidor e desenvolvedor de software",
  socialItems,
  imageLoaded = true,
  onImageLoad,
  bottomSlot,
  className,
  isGameOpen = false,
}: HeroProfileColumnMobileProps) {
  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      maxWidth: homeHeroTokens.mobileAttractMode.cardMaxWidth,
      margin: "0 auto",
      minHeight: homeHeroTokens.mobileAttractMode.cardMinHeight,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: "12px",
      padding: "14px 12px 16px",
      borderRadius: homeHeroTokens.mobileAttractMode.cardRadius,
      background:
        "linear-gradient(180deg, rgba(16,16,20,0.94) 0%, rgba(8,8,10,0.985) 100%)",
      border: "1px solid rgba(255, 210, 120, 0.08)",
      boxShadow:
        "0 18px 40px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
      boxSizing: "border-box",
      overflow: "hidden",
      isolation: "isolate",
      transform: isGameOpen
        ? `scale(${homeHeroTokens.mobileGame.cardScaleWhenOpen})`
        : "scale(1)",
      transition:
        "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, opacity 220ms ease",
    };
  }, [isGameOpen]);

  const rootGlowStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(circle at 50% 0%, rgba(255, 204, 112, 0.08) 0%, rgba(255, 204, 112, 0.035) 18%, rgba(255,255,255,0) 48%)",
      opacity: isGameOpen ? 0.42 : 0.82,
      transition: "opacity 220ms ease",
    };
  }, [isGameOpen]);

  const marqueeWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 2,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
    };
  }, []);

  const imageFrameStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 2,
      width: "100%",
      minWidth: 0,
      flex: "1 1 auto",
      minHeight: homeHeroTokens.mobileAttractMode.imageMinHeight,
      borderRadius: "20px",
      overflow: "hidden",
      background:
        "linear-gradient(180deg, rgba(34,34,38,0.94) 0%, rgba(16,16,20,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      transform: isGameOpen
        ? `scale(${homeHeroTokens.mobileGame.imageScaleWhenOpen})`
        : "scale(1)",
      transition:
        "transform 220ms ease, filter 220ms ease, opacity 220ms ease",
    };
  }, [isGameOpen]);

  const imageOverlayStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 18%, rgba(0,0,0,0.00) 52%, rgba(0,0,0,0.16) 100%)",
      zIndex: 2,
    };
  }, []);

  const imageScanStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.00) 0%, rgba(255,210,120,0.075) 48%, rgba(255,255,255,0.00) 100%)",
      opacity: isGameOpen ? 0.22 : 0.48,
      transform: isGameOpen ? "translateY(16%)" : "translateY(0)",
      transition: "opacity 220ms ease, transform 220ms ease",
      zIndex: 2,
    };
  }, [isGameOpen]);

  const actionsWrapStyle = useMemo<React.CSSProperties>(() => {
    if (!bottomSlot) {
      return {
        display: "none",
      };
    }

    return {
      position: "relative",
      zIndex: 2,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "stretch",
      marginTop: "2px",
      boxSizing: "border-box",
    };
  }, [bottomSlot]);

  const socialWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 2,
      width: "100%",
      opacity: isGameOpen
        ? homeHeroTokens.mobileGame.socialOpacityWhenOpen
        : 1,
      transform: isGameOpen ? "translateY(2px)" : "translateY(0)",
      transition: "opacity 220ms ease, transform 220ms ease",
    };
  }, [isGameOpen]);

  const imageStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center top",
      display: "block",
      opacity: imageLoaded ? (isGameOpen ? 0.82 : 1) : 0,
      transition: "opacity 260ms ease, transform 260ms ease, filter 260ms ease",
      userSelect: "none",
      WebkitUserDrag: "none",
      filter: isGameOpen ? "saturate(0.94) contrast(0.98)" : "none",
      transform: isGameOpen ? "scale(1.012)" : "scale(1)",
      position: "relative",
      zIndex: 1,
    };
  }, [imageLoaded, isGameOpen]);

  const skeletonStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
      opacity: imageLoaded ? 0 : 1,
      transition: "opacity 220ms ease",
      pointerEvents: "none",
      zIndex: 3,
    };
  }, [imageLoaded]);

  return (
    <div className={className} style={rootStyle}>
      <div style={rootGlowStyle} />

      <div style={marqueeWrapStyle}>
        <HeroMarqueeMobile isGameOpen={isGameOpen} />
      </div>

      <div style={imageFrameStyle}>
        <img
          src={imageSrc}
          alt={imageAlt}
          style={imageStyle}
          onLoad={onImageLoad}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div style={imageOverlayStyle} />
        <div style={imageScanStyle} />
        <div style={skeletonStyle} />
      </div>

      {bottomSlot ? <div style={actionsWrapStyle}>{bottomSlot}</div> : null}

      <div style={socialWrapStyle}>
        <SocialRowMobile items={socialItems} />
      </div>
    </div>
  );
}


