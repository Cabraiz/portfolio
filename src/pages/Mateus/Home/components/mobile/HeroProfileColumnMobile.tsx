import { useMemo, type CSSProperties } from "react";

import HeroIdentityMobile from "./HeroIdentityMobile";
import SocialRowMobile, { type MobileSocialItem } from "./SocialRowMobile";

export type HeroProfileColumnMobileProps = Readonly<{
  imageSrc: string;
  imageAlt?: string;
  socialItems: readonly MobileSocialItem[];
  seniorLabel?: string;
  roleLabel: string;
  whatsappTopLabel: string;
  secondaryLabel: string;
  imageLoaded?: boolean;
  onImageLoad?: () => void;
  className?: string;
}>;

function buildWhatsappHref(topLabel: string) {
  const text = encodeURIComponent(topLabel);
  return `https://wa.me/5585981882900?text=${text}`;
}

export default function HeroProfileColumnMobile({
  imageSrc,
  imageAlt = "Mateus Cabral",
  socialItems,
  seniorLabel,
  roleLabel,
  whatsappTopLabel,
  secondaryLabel,
  imageLoaded = true,
  onImageLoad,
  className,
}: HeroProfileColumnMobileProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "clamp(16px, 4.6vw, 22px)",
      boxSizing: "border-box",
    };
  }, []);

  const mediaCardStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      borderRadius: "clamp(24px, 6vw, 30px)",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      boxShadow:
        "0 18px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
      boxSizing: "border-box",
    };
  }, []);

  const imageShellStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      aspectRatio: "0.92 / 1",
      minHeight: "320px",
      background: `
        radial-gradient(circle at 78% 14%, rgba(255,255,255,0.10), transparent 20%),
        radial-gradient(circle at 20% 20%, rgba(255,196,0,0.10), transparent 28%),
        linear-gradient(180deg, #1a1a1d 0%, #111114 100%)
      `,
      overflow: "hidden",
    };
  }, []);

  const imageStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover",
      objectPosition: "center top",
      opacity: imageLoaded ? 1 : 0,
      transition: "opacity 220ms ease",
    };
  }, [imageLoaded]);

  const chromeOverlayStyle = useMemo<CSSProperties>(() => {
    return {
      pointerEvents: "none",
      position: "absolute",
      inset: 0,
      background: `
        linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.08) 100%),
        radial-gradient(circle at 80% 12%, rgba(255,255,255,0.10), transparent 18%)
      `,
    };
  }, []);

  const identityWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      boxSizing: "border-box",
    };
  }, []);

  const logosPanelStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "clamp(12px, 3.6vw, 18px)",
      padding: "clamp(12px, 3.6vw, 16px) clamp(14px, 4vw, 18px)",
      borderRadius: "18px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      boxSizing: "border-box",
      overflowX: "auto",
      overflowY: "hidden",
      scrollbarWidth: "none",
    };
  }, []);

  const ctaStackStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxSizing: "border-box",
    };
  }, []);

  const primaryButtonStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      minHeight: "58px",
      border: "none",
      borderRadius: "18px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "0 18px",
      background:
        "linear-gradient(180deg, #49f07d 0%, #31d867 100%)",
      color: "#07110a",
      fontSize: "0.95rem",
      fontWeight: 900,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      textDecoration: "none",
      boxShadow:
        "0 10px 24px rgba(45, 216, 103, 0.22), inset 0 1px 0 rgba(255,255,255,0.28)",
      boxSizing: "border-box",
    };
  }, []);

  const secondaryButtonStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      minHeight: "56px",
      borderRadius: "18px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "0 18px",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
      color: "rgba(255,255,255,0.92)",
      fontSize: "0.92rem",
      fontWeight: 900,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      textDecoration: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      boxSizing: "border-box",
    };
  }, []);

  const socialWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      paddingTop: "2px",
      boxSizing: "border-box",
    };
  }, []);

  const whatsappHref = useMemo(() => {
    return buildWhatsappHref(whatsappTopLabel);
  }, [whatsappTopLabel]);

  const resumeHref = "/files/mateus-cabral-resume.pdf";

  return (
    <section
      className={className}
      style={rootStyle}
      aria-label="Apresentação mobile"
    >
      <div style={mediaCardStyle}>
        <div style={imageShellStyle}>
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={onImageLoad}
            style={imageStyle}
          />
          <div style={chromeOverlayStyle} />
        </div>
      </div>

      <div style={identityWrapStyle}>
        <HeroIdentityMobile
          seniorLabel={seniorLabel}
          roleLabel={roleLabel}
        />
      </div>

      <div style={logosPanelStyle} aria-label="Empresas e instituições">
        <img
          src="/logos/bnb.svg"
          alt="Banco do Nordeste"
          style={{ height: "18px", width: "auto", flex: "0 0 auto", opacity: 0.84 }}
        />
        <img
          src="/logos/unifor.svg"
          alt="Unifor"
          style={{ height: "18px", width: "auto", flex: "0 0 auto", opacity: 0.84 }}
        />
        <img
          src="/logos/sanofi.svg"
          alt="Sanofi"
          style={{ height: "18px", width: "auto", flex: "0 0 auto", opacity: 0.84 }}
        />
        <img
          src="/logos/sedih.svg"
          alt="SEDIH"
          style={{ height: "18px", width: "auto", flex: "0 0 auto", opacity: 0.84 }}
        />
      </div>

      <div style={ctaStackStyle}>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={primaryButtonStyle}
          aria-label="Abrir WhatsApp"
        >
          <span aria-hidden="true">◔</span>
          <span>WhatsApp</span>
        </a>

        <a
          href={resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          style={secondaryButtonStyle}
          aria-label={secondaryLabel}
        >
          <span aria-hidden="true">↓</span>
          <span>{secondaryLabel}</span>
        </a>
      </div>

      <div style={socialWrapStyle}>
        <SocialRowMobile items={socialItems} />
      </div>
    </section>
  );
}
