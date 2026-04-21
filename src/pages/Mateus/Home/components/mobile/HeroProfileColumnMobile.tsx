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
      gap: "16px",
      padding: "14px 12px 18px",
      borderRadius: "28px",
      background:
        "linear-gradient(180deg, rgba(16,16,20,0.94) 0%, rgba(8,8,10,0.98) 100%)",
      border: "1px solid rgba(255, 210, 120, 0.08)",
      boxShadow:
        "0 18px 40px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
      boxSizing: "border-box",
      overflow: "hidden",
    };
  }, []);

  const imageFrameStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      aspectRatio: "0.88 / 1",
      borderRadius: "22px",
      overflow: "hidden",
      background:
        "linear-gradient(180deg, rgba(34,34,38,0.94) 0%, rgba(16,16,20,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.22)",
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

      <HeroIdentityMobile
        roleLabel={roleLabel}
        secondaryLabel={secondaryLabel}
        bottomSlot={bottomSlot}
      />

      <SocialRowMobile items={socialItems} />
    </div>
  );
}
