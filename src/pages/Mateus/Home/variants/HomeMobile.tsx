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

import "../../../../styles/styles.css";

import gsap from "gsap";

import HeroMobileStack from "../components/mobile/HeroMobileStack";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

import fotoMateus from "../../../../assets/Mateus/perfil.webp";
import iconLinkedin from "../../../../assets/Mateus/Icon/IconLinkedIn.png";
import iconMail from "../../../../assets/Mateus/Icon/IconGmail.png";
import iconInstagram from "../../../../assets/Mateus/Icon/IconInsta.png";

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

  const socialItems = useMemo(() => {
    return [
      {
        id: "linkedin",
        label: "LinkedIn",
        ariaLabel: "Abrir LinkedIn",
        href: "https://www.linkedin.com/in/mateuscabrals/",
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
        href: "https://www.instagram.com/mtscrl/",
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
      minHeight: "100%",
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
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      paddingTop: "clamp(78px, 15vw, 98px)",
      paddingBottom: "clamp(32px, 8vw, 44px)",
      paddingInline: "clamp(16px, 5vw, 24px)",
      background: "transparent",
      backgroundColor: "transparent",
      boxSizing: "border-box",
    };
  }, []);

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
      <Container fluid style={containerStyle}>
        <div style={stackWrapStyle}>
          <HeroMobileStack
            imageSrc={fotoMateus}
            imageAlt="Mateus Cabral"
            roleLabel={roleLabel}
            secondaryLabel={secondaryLabel}
            socialItems={socialItems}
            imageLoaded={isImageLoaded}
            onImageLoad={() => setIsImageLoaded(true)}
          />
        </div>
      </Container>
    </div>
  );
}

export default HomeMobile;
