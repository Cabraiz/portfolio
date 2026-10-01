import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import React, { useRef } from "react";
import { Image } from "react-bootstrap";
import type { LandingSectionId } from '../../../features/navigation/landingSections';
import symbolMask from '../../../assets/icones/brand-textures/symbol-mask-v2.svg';
import { getBrandMaterial } from '../brandTheme';
import useBrandSectionContact from '../hooks/useBrandSectionContact';

export type BrandButtonProps = Readonly<{
  onClick: () => void;
  logoSrc: string;
  logoAlt?: string;
  mobile?: boolean;
  sectionId?: LandingSectionId | '';
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
  sectionId = '',
  compactDesktop = false,
  mobileLogoSize = 44,
  desktopLogoSize = 52,
  compactDesktopLogoSize = 46,
}) => {
  useLabelLanguage();
  const symbolRef = useRef<HTMLSpanElement | null>(null);
  const contactSectionId = useBrandSectionContact(symbolRef, sectionId);
  const material = getBrandMaterial(contactSectionId, mobile);
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
      aria-label={localizeLabel("Ir para o início")}
      data-mobile-brand-pusher={mobile ? "true" : undefined}
      style={{
        all: "unset",
        display: "inline-flex",
        position: mobile ? "relative" : undefined,
        left: mobile ? 6 : undefined,
        top: mobile ? 4 : undefined,
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flex: "0 0 auto",
      }}
    >
      <span
        ref={symbolRef}
        data-brand-symbol="true"
        data-brand-section={contactSectionId}
        data-brand-material={material.name}
        style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto' }}
      >
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundColor: material.color,
          backgroundImage: `url("${material.texture}")`,
          backgroundSize: '180% 180%',
          backgroundPosition: 'center',
          filter: `brightness(${material.brightness})`,
          maskImage: `url("${symbolMask}")`, WebkitMaskImage: `url("${symbolMask}")`,
          maskSize: 'contain', WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center', WebkitMaskPosition: 'center',
        }} />
        <Image
        src={logoSrc}
        alt={localizeLabel(logoAlt)}
        style={{
          borderRadius: "18px",
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          objectFit: "cover",
          flex: "0 0 auto",
          display: "block",
          opacity: 0,
        }}
      />
      </span>
    </button>
  );
};

export default BrandButton;
