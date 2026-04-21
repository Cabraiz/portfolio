import React, { useMemo } from "react";

import HeroIdentityMobile from "./HeroIdentityMobile";
import SocialRowMobile, { type MobileSocialItem } from "./SocialRowMobile";

export type HeroProfileColumnMobileProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  roleLabel?: string;
  secondaryLabel?: string;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  bottomSlot?: React.ReactNode;
  className?: string;
}>;

export default function HeroProfileColumnMobile({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  roleLabel,
  secondaryLabel,
  imageLoaded = true,
  onImageLoad,
  bottomSlot,
  className,
}: HeroProfileColumnMobileProps) {
  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      maxWidth: "420px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "18px",
    };
  }, []);

  const portraitShellStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      padding: "18px 18px 14px",
      borderRadius: "28px",
      background:
        "radial-gradient(circle at top, rgba(255, 210, 120, 0.10), rgba(255, 210, 120, 0) 46%), linear-gradient(180deg, rgba(20,20,22,0.94) 0%, rgba(10,10,12,0.98) 100%)",
      border: "1px solid rgba(255, 215, 150, 0.12)",
      boxShadow:
        "0 18px 40px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
      overflow: "hidden",
    };
  }, []);

  const portraitAuraStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: "auto 50% 18px 50%",
      width: "74%",
      height: "22%",
      transform: "translateX(-50%)",
      borderRadius: "999px",
      background:
        "radial-gradient(circle, rgba(255, 196, 92, 0.26) 0%, rgba(255, 196, 92, 0.12) 38%, rgba(255, 196, 92, 0) 72%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    };
  }, []);

  const imageFrameStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      aspectRatio: "0.88 / 1",
      borderRadius: "24px",
      overflow: "hidden",
      background:
        "linear-gradient(180deg, rgba(40,40,46,0.94) 0%, rgba(18,18,22,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 28px rgba(0,0,0,0.28)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
  }, []);

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
      inset: "0",
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)",
      opacity: imageLoaded ? 0 : 1,
      transition: "opacity 220ms ease",
      pointerEvents: "none",
    };
  }, [imageLoaded]);

  return (
    <div className={className} style={rootStyle}>
      <div style={portraitShellStyle}>
        <div style={portraitAuraStyle} />

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
      </div>

      <HeroIdentityMobile
        roleLabel={roleLabel}
        secondaryLabel={secondaryLabel}
        bottomSlot={bottomSlot}
      />

      <SocialRowMobile items={socialItems} />
    </div>
  );
}
