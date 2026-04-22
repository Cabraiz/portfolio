import React, { useMemo } from "react";

import HeroPrimaryActionsMobile, {
  type HeroPrimaryActionMobile,
} from "./HeroPrimaryActionsMobile";
import HeroProfileColumnMobile from "./HeroProfileColumnMobile";
import type { MobileSocialItem } from "./SocialRowMobile";

export type HeroMobileStackProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  primaryActions?: readonly HeroPrimaryActionMobile[];
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  bottomSlot?: React.ReactNode;
  className?: string;
}>;

function HeroMobileStack({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  primaryActions = [],
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
      padding: 0,
      background: "transparent",
    };
  }, []);

  const contentStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    };
  }, []);

  const stackedBottomSlot = useMemo(() => {
    const hasPrimaryActions = primaryActions.length > 0;
    const hasBottomSlot = Boolean(bottomSlot);

    if (!hasPrimaryActions && !hasBottomSlot) {
      return null;
    }

    return (
      <>
        {hasBottomSlot ? bottomSlot : null}
        {hasPrimaryActions ? (
          <HeroPrimaryActionsMobile items={primaryActions} />
        ) : null}
      </>
    );
  }, [bottomSlot, primaryActions]);

  return (
    <section className={className} style={sectionStyle}>
      <div style={contentStyle}>
        <HeroProfileColumnMobile
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          socialItems={socialItems}
          imageLoaded={imageLoaded}
          onImageLoad={onImageLoad}
          bottomSlot={stackedBottomSlot}
        />
      </div>
    </section>
  );
}

export default HeroMobileStack;
