import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../../../styles/styles.css";

import gsap from "gsap";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi2";

import HeroMobileStack from "../components/mobile/HeroMobileStack";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

import fotoMateus from "../../../../assets/Mateus/perfil.webp";
import iconLinkedin from "../../../../assets/Mateus/Icon/IconLinkedIn.png";
import iconMail from "../../../../assets/Mateus/Icon/IconGmail.png";
import iconInstagram from "../../../../assets/Mateus/Icon/IconInsta.png";

const MOBILE_HERO_BACKGROUND = `
  radial-gradient(
    circle at 18% 16%,
    rgba(168, 120, 28, 0.14) 0%,
    rgba(168, 120, 28, 0.08) 18%,
    rgba(168, 120, 28, 0.03) 34%,
    rgba(168, 120, 28, 0.00) 54%
  ),
  radial-gradient(
    circle at 82% 10%,
    rgba(76, 88, 112, 0.12) 0%,
    rgba(76, 88, 112, 0.06) 24%,
    rgba(76, 88, 112, 0.00) 52%
  ),
  linear-gradient(
    180deg,
    #0b0d11 0%,
    #090b0f 38%,
    #07080b 72%,
    #050608 100%
  )
`;

function HomeMobile() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const resumeLabel = useMemo(() => {
    return t("buttons.downloadCV");
  }, [t, currentLanguage]);

  const whatsAppLabel = useMemo(() => {
    return "WhatsApp";
  }, []);

  const whatsAppGreeting = useMemo(() => {
    return getWhatsAppGreeting();
  }, []);

  const socialIconImageStyle = useMemo<CSSProperties>(() => {
    return {
      width: "18px",
      height: "18px",
      display: "block",
      objectFit: "contain",
      userSelect: "none",
      pointerEvents: "none",
    };
  }, []);

  const primaryIconStyle = useMemo<CSSProperties>(() => {
    return {
      width: "18px",
      height: "18px",
      display: "block",
      flexShrink: 0,
    };
  }, []);

  const primaryActions = useMemo(() => {
    return [
      {
        id: "resume",
        label: resumeLabel,
        ariaLabel: isPT ? "Abrir currículo" : "Open resume",
        href: "/files/mateus-cabral-resume.pdf",
        target: "_blank" as const,
        rel: "noreferrer noopener",
        variant: "primary" as const,
        icon: (
          <HiOutlineDocumentText
            aria-hidden="true"
            style={primaryIconStyle}
          />
        ),
      },
      {
        id: "whatsapp",
        label: whatsAppLabel,
        ariaLabel: "Abrir WhatsApp",
        href: `https://wa.me/5585998575707?text=${encodeURIComponent(
          whatsAppGreeting
        )}`,
        target: "_blank" as const,
        rel: "noreferrer noopener",
        variant: "secondary" as const,
        icon: <FaWhatsapp aria-hidden="true" style={primaryIconStyle} />,
      },
    ] as const;
  }, [resumeLabel, whatsAppGreeting, whatsAppLabel, isPT, primaryIconStyle]);

  const socialItems = useMemo(() => {
    return [
      {
        id: "linkedin",
        label: "LinkedIn",
        ariaLabel: "Abrir LinkedIn",
        href: "https://www.linkedin.com/in/cabraiz/",
        icon: (
          <img
            src={iconLinkedin}
            alt=""
            aria-hidden="true"
            style={socialIconImageStyle}
            draggable={false}
          />
        ),
      },
      {
        id: "email",
        label: "Email",
        ariaLabel: "Enviar email",
        href: "mailto:mateuscabrals@gmail.com",
        target: "_self" as const,
        rel: "noopener noreferrer",
        icon: (
          <img
            src={iconMail}
            alt=""
            aria-hidden="true"
            style={socialIconImageStyle}
            draggable={false}
          />
        ),
      },
      {
        id: "instagram",
        label: "Instagram",
        ariaLabel: "Abrir Instagram",
        href: "https://www.instagram.com/cabraiz/",
        icon: (
          <img
            src={iconInstagram}
            alt=""
            aria-hidden="true"
            style={socialIconImageStyle}
            draggable={false}
          />
        ),
      },
    ] as const;
  }, [socialIconImageStyle]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
      overflowY: "visible",
      backgroundColor: "#07080b",
      backgroundImage: MOBILE_HERO_BACKGROUND,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center top",
      boxSizing: "border-box",
    };
  }, []);

  const containerStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      minWidth: 0,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: "clamp(58px, 10vw, 74px)",
      paddingBottom: "clamp(18px, 4vw, 28px)",
      paddingInline: "clamp(12px, 4vw, 20px)",
      boxSizing: "border-box",
    };
  }, []);

  const stackWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "min(100%, 468px)",
      minWidth: 0,
      maxWidth: "468px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "center",
      boxSizing: "border-box",
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (shouldDisableScrollFades()) {
      gsap.set(container, {
        opacity: 1,
        y: 0,
        clearProps: "transform,opacity,willChange",
      });
      container.style.willChange = "auto";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(container, {
        opacity: 0,
        y: 12,
        willChange: "transform, opacity",
      });

      gsap.to(container, {
        opacity: 1,
        y: 0,
        duration: 0.42,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          gsap.set(container, {
            clearProps: "transform,opacity,willChange",
          });
          container.style.willChange = "auto";
        },
      });
    }, container);

    return () => {
      ctx.revert();
      container.style.willChange = "auto";
    };
  }, []);

  return (
    <div ref={containerRef} style={rootStyle}>
      <div style={containerStyle}>
        <div style={stackWrapStyle}>
          <HeroMobileStack
            imageSrc={fotoMateus}
            imageAlt="Mateus Cabral"
            primaryActions={primaryActions}
            socialItems={socialItems}
            imageLoaded={isImageLoaded}
            onImageLoad={() => setIsImageLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeMobile;
