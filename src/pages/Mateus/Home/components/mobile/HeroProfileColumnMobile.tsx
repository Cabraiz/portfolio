import React, { useMemo } from "react";

import HeroMarqueeMobile from "./HeroMarqueeMobile";
import SocialRowMobile, { type MobileSocialItem } from "./SocialRowMobile";

export type HeroProfileColumnMobileProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  bottomSlot?: React.ReactNode;
  className?: string;
}>;

export default function HeroProfileColumnMobile({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  imageLoaded = true,
  onImageLoad,
  bottomSlot,
  className,
}: HeroProfileColumnMobileProps) {
  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      margin: 0,
      minHeight: "clamp(560px, calc(100dvh - 108px), 860px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: "10px",
      padding: "12px 10px 14px",
      borderRadius: "24px",
      background:
        "linear-gradient(180deg, rgba(16,16,20,0.94) 0%, rgba(8,8,10,0.985) 100%)",
      border: "1px solid rgba(255, 210, 120, 0.08)",
      boxShadow:
        "0 18px 40px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
      boxSizing: "border-box",
      overflow: "hidden",
    };
  }, []);

  const marqueeWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 0,
      marginBottom: 0,
      boxSizing: "border-box",
    };
  }, []);

  const imageFrameStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      flex: "1 1 auto",
      minHeight: "clamp(340px, 56dvh, 640px)",
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
    };
  }, []);

  const actionsWrapStyle = useMemo<React.CSSProperties>(() => {
    if (!bottomSlot) {
      return {
        display: "none",
      };
    }

    return {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "stretch",
      marginTop: "2px",
      boxSizing: "border-box",
    };
  }, [bottomSlot]);

  const imageStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center top",
      display: "block",
      opacity: imageLoaded ? 1 : 0,
      transition: "opacity 260ms ease",
      userSelect: "none",
      WebkitUserDrag: "none",
    };
  }, [imageLoaded]);

  const skeletonStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
      opacity: imageLoaded ? 0 : 1,
      transition: "opacity 220ms ease",
      pointerEvents: "none",
    };
  }, [imageLoaded]);

  return (
    <div className={className} style={rootStyle}>
      <div style={marqueeWrapStyle}>
        <HeroMarqueeMobile />
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
        <div style={skeletonStyle} />
      </div>

      {bottomSlot ? <div style={actionsWrapStyle}>{bottomSlot}</div> : null}

      <SocialRowMobile items={socialItems} />
    </div>
  );
}
