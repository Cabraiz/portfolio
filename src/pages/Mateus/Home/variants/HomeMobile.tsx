import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../styles/styles.css";

import gsap from "gsap";

import HeroMobileStack from "../components/mobile/HeroMobileStack";
import { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

import fotoMateus from "../../assets/Mateus/perfil.webp";
import iconLinkedin from "../../assets/Mateus/Icon/IconLinkedIn.png";
import iconMail from "../../assets/Mateus/Icon/IconGmail.png";
import iconInstagram from "../../assets/Mateus/Icon/IconInsta.png";

import bnbLogo from "../../assets/Mateus/logos/bnb.svg";
import uniforLogo from "../../assets/Mateus/logos/unifor.svg";
import sanofiLogo from "../../assets/Mateus/logos/sanofi.svg";
import sedihLogo from "../../assets/Mateus/logos/sedih.svg";

const MOBILE_HERO_BACKGROUND = `
  radial-gradient(
    circle at 12% 28%,
    rgba(255, 196, 0, 0.16) 0%,
    rgba(255, 196, 0, 0.10) 18%,
    rgba(255, 196, 0, 0.04) 34%,
    rgba(255, 196, 0, 0.00) 56%
  ),
  linear-gradient(
    180deg,
    #09090b 0%,
    #08080a 52%,
    #060608 100%
  )
`;

function HomeMobile() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const { sectionStyle } = useHomeHeroLayout();

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const roleLabel = useMemo(() => {
    return isPT ? "Engenheiro de Software" : "Software Engineer";
  }, [isPT]);

  const secondaryLabel = useMemo(() => {
    return t("buttons.downloadCV");
  }, [t, currentLanguage]);

  const whatsappTopLabel = useMemo(() => {
    return getWhatsAppGreeting();
  }, []);

  const socialItems = useMemo(() => {
    return [
      {
        key: "linkedin",
        href: "https://www.linkedin.com/in/mateuscabrals/",
        icon: iconLinkedin,
        alt: "LinkedIn",
      },
      {
        key: "email",
        href: "mailto:mateuscabrals@gmail.com",
        icon: iconMail,
        alt: "Email",
        target: "_self" as const,
        rel: "noopener noreferrer",
      },
      {
        key: "instagram",
        href: "https://www.instagram.com/mtscrl/",
        icon: iconInstagram,
        alt: "Instagram",
      },
    ] as const;
  }, []);

  const logoItems = useMemo(() => {
    return [
      { key: "bnb", src: bnbLogo, alt: "Banco do Nordeste" },
      { key: "unifor", src: uniforLogo, alt: "Unifor" },
      { key: "sanofi", src: sanofiLogo, alt: "Sanofi" },
      { key: "sedih", src: sedihLogo, alt: "SEDIH" },
    ] as const;
  }, []);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      overflowX: "clip",
      overflowY: "visible",
      backgroundColor: "#08080a",
      backgroundImage: MOBILE_HERO_BACKGROUND,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "left top",
      boxSizing: "border-box",
    };
  }, []);

  const containerStyle = useMemo<CSSProperties>(() => {
    return {
      ...sectionStyle,
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      paddingTop: "clamp(20px, 6vw, 28px)",
      paddingBottom: "clamp(32px, 8vw, 44px)",
      paddingInline: "clamp(16px, 5vw, 24px)",
      background: "transparent",
      backgroundColor: "transparent",
      boxSizing: "border-box",
    };
  }, [sectionStyle]);

  const stackWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      maxWidth: "420px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
      <Container fluid style={containerStyle}>
        <div style={stackWrapStyle}>
          <HeroMobileStack
            imageSrc={fotoMateus}
            imageAlt="Mateus Cabral"
            roleLabel={roleLabel}
            seniorLabel={undefined}
            secondaryLabel={secondaryLabel}
            whatsappTopLabel={whatsappTopLabel}
            socialItems={socialItems}
            logoItems={logoItems}
            imageLoaded={isImageLoaded}
            onImageLoad={() => setIsImageLoaded(true)}
          />
        </div>
      </Container>
    </div>
  );
}

export default HomeMobile;
