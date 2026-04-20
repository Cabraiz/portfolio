import React, { useMemo } from "react";

import HeroIdentityMobile from "./HeroIdentityMobile";
import SocialRowMobile, { type MobileSocialItem } from "./SocialRowMobile";

export type HeroProfileColumnMobileProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  seniorLabel?: string;
  roleLabel: string;
  bottomSlot?: React.ReactNode;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  className?: string;
}>;

export default function HeroProfileColumnMobile({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  seniorLabel,
  roleLabel,
  bottomSlot,
  imageLoaded = true,
  onImageLoad,
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
      justifyContent: "flex-start",
      gap: "14px",
      minWidth: 0,
      boxSizing: "border-box",
    };
  }, []);

  const cardStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      borderRadius: "18px",
      padding: "14px 14px 16px",
      background:
        "linear-gradient(180deg, rgba(26, 26, 28, 0.96) 0%, rgba(18,18,20,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow:
        "0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
      boxSizing: "border-box",
      overflow: "hidden",
    };
  }, []);

  const mediaFrameStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: "16px",
      overflow: "hidden",
      background:
        "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0.01) 52%, transparent 72%), linear-gradient(180deg, rgba(40,40,44,0.98) 0%, rgba(22,22,26,0.98) 100%)",
      boxSizing: "border-box",
      marginBottom: "14px",
      position: "relative",
      isolation: "isolate",
    };
  }, []);

  const imageStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover" as const,
      objectPosition: "center top" as const,
      opacity: imageLoaded ? 1 : 0.96,
      transition: "opacity 180ms ease",
    };
  }, [imageLoaded]);

  const identityOverlayStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      left: "12px",
      top: "12px",
      zIndex: 2,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      maxWidth: "calc(100% - 24px)",
      pointerEvents: "none",
    };
  }, []);

  const identityBackdropStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.14) 22%, rgba(0,0,0,0) 42%)",
      pointerEvents: "none",
    };
  }, []);

  const filteredSocialItems = useMemo(() => {
    return socialItems.slice(0, 3);
  }, [socialItems]);

  return (
    <div className={className} style={rootStyle}>
      <div style={cardStyle}>
        <div style={mediaFrameStyle}>
          <div style={identityBackdropStyle} />

          <img
            src={imageSrc}
            alt={imageAlt}
            style={imageStyle}
            onLoad={onImageLoad}
          />

          <div style={identityOverlayStyle}>
            <HeroIdentityMobile
              seniorLabel={seniorLabel}
              roleLabel={roleLabel}
              bottomSlot={bottomSlot}
            />
          </div>
        </div>

        <SocialRowMobile items={filteredSocialItems} />
      </div>
    </div>
  );
}
