import React from "react";
import { Image } from "react-bootstrap";

export type BrandButtonProps = Readonly<{
  onClick: () => void;
  logoSrc: string;
  logoAlt?: string;
  mobile?: boolean;
  invertMobileLogo?: boolean;
  compactDesktop?: boolean;
  mobileLogoSize?: number;
  desktopLogoSize?: number;
  compactDesktopLogoSize?: number;
}>;

function resolveLogoSize({
  mobile,
  compactDesktop,
  mobileLogoSize,
  desktopLogoSize,
  compactDesktopLogoSize,
}: Pick<
  BrandButtonProps,
  | "mobile"
  | "compactDesktop"
  | "mobileLogoSize"
  | "desktopLogoSize"
  | "compactDesktopLogoSize"
>): number {
  if (mobile) {
    return mobileLogoSize ?? 44;
  }

  if (compactDesktop) {
    return compactDesktopLogoSize ?? 46;
  }

  return desktopLogoSize ?? 52;
}

const BrandButton: React.FC<BrandButtonProps> = ({
  onClick,
  logoSrc,
  logoAlt = "Logo",
  mobile = false,
  invertMobileLogo = false,
  compactDesktop = false,
  mobileLogoSize = 44,
  desktopLogoSize = 52,
  compactDesktopLogoSize = 46,
}) => {
  const logoSize = resolveLogoSize({
    mobile,
    compactDesktop,
    mobileLogoSize,
    desktopLogoSize,
    compactDesktopLogoSize,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir para o início"
      data-mobile-brand-pusher={mobile ? "true" : undefined}
      style={{
        all: "unset",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flex: "0 0 auto",
      }}
    >
      <Image
        src={logoSrc}
        alt={logoAlt}
        style={{
          borderRadius: "18px",
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          objectFit: "cover",
          flex: "0 0 auto",
          display: "block",
          filter: mobile && invertMobileLogo ? "invert(1)" : undefined,
        }}
      />
    </button>
  );
};

export default BrandButton;
