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
  primaryActions = [],
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

  const actionsWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      marginTop: "2px",
      display: "flex",
      flexDirection: "column",
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
          bottomSlot={
            <>
              {bottomSlot}
              {primaryActions.length ? (
                <div style={actionsWrapStyle}>
                  <HeroPrimaryActionsMobile items={primaryActions} />
                </div>
              ) : null}
            </>
          }
        />
      </div>
    </section>
  );
}

export default HeroMobileStack;
