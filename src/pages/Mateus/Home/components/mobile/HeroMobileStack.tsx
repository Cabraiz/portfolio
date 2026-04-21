import React, { useMemo } from "react";

import HeroProfileColumnMobile from "./HeroProfileColumnMobile";
import type { MobileSocialItem } from "./SocialRowMobile";

export type HeroMobileStackProps = Readonly<{
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

function HeroMobileStack({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  roleLabel,
  secondaryLabel,
  imageLoaded = true,
  onImageLoad,
  bottomSlot,
  className,
}: HeroMobileStackProps) {
  const sectionStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px 28px",
      background:
        "radial-gradient(circle at top, rgba(196, 148, 62, 0.16), rgba(196, 148, 62, 0) 34%), linear-gradient(180deg, #070708 0%, #0c0c0f 42%, #09090b 100%)",
    };
  }, []);

  const contentStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
    };
  }, []);

  return (
    <section className={className} style={sectionStyle}>
      <div style={contentStyle}>
        <HeroProfileColumnMobile
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          socialItems={socialItems}
          roleLabel={roleLabel}
          secondaryLabel={secondaryLabel}
          imageLoaded={imageLoaded}
          onImageLoad={onImageLoad}
          bottomSlot={bottomSlot}
        />
      </div>
    </section>
  );
}

export default HeroMobileStack;
