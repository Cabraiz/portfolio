import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Col, Row, Image, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

import RoleTitle from "./RoleTitle";
import CTAButton from "./shared/CTAButton/CTAButton";
import ResumeDownloadButton from "./shared/ResumeDownloadButton/ResumeDownloadButton";
import WhatsAppSignalButton from "./shared/WhatsAppSignalButton/WhatsAppSignalButton";
import WhatsAppHeroSlot from "./shared/WhatsAppSignalButton/WhatsAppHeroSlot";

import perfil from "../../assets/Mateus/perfil.webp";
import IconGmail from "../../assets/Mateus/icon/IconGmail.png";
import IconInsta from "../../assets/Mateus/icon/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/icon/IconLinkedIn.png";
import IconWhatsApp from "../../assets/Mateus/icon/IconWhatsApp.png";
import IconMeet from "../../assets/Mateus/icon/IconMeet.png";

import seloBNB from "../../assets/Mateus/Selos/BNB.svg";
import seloUNIFOR from "../../assets/Mateus/Selos/UNIFOR.svg";
import seloSANA from "../../assets/Mateus/Selos/SANA.svg";
import seloSEDIH from "../../assets/Mateus/Selos/SEDIH.svg";

import cat1 from "../../assets/Mateus/cutieIcons/Cat1.png";
import cat2 from "../../assets/Mateus/cutieIcons/Cat2.png";
import cat3 from "../../assets/Mateus/cutieIcons/Cat3.png";
import cat4 from "../../assets/Mateus/cutieIcons/Cat4.png";

import "../../styles/styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(ScrollTrigger);

type SocialButtonProps = Readonly<{
  href: string;
  icon: string;
  alt: string;
  isScrollToTop?: boolean;
}>;

type SealItem = Readonly<{
  key: string;
  src: string;
  alt: string;
  cat: string;
  style?: CSSProperties;
}>;

/**
 * Antes:
 * "(max-height: 720px) and (min-width: 961px)"
 *
 * Agora:
 * 1080p também entra no modo compacto para herdar o mesmo
 * comportamento visual e custo de render mais próximo do 720p.
 */
const COMPACT_DESKTOP_MEDIA_QUERY =
  "(max-height: 1080px) and (min-width: 961px)";

const WHATSAPP_HREF = "https://wa.me/5585998575707";
const MEET_HREF = "https://meet.google.com/SEULINK";
const RESUME_HREF = "/files/mateus-cabral-resume.pdf";

const seals: readonly SealItem[] = [
  {
    key: "BNB",
    src: seloBNB,
    alt: "Banco do Nordeste",
    cat: cat1,
    style: { scale: "0.9", marginTop: "5px" },
  },
  {
    key: "UNIFOR",
    src: seloUNIFOR,
    alt: "UNIFOR",
    cat: cat2,
  },
  {
    key: "SANA",
    src: seloSANA,
    alt: "SANA",
    cat: cat3,
    style: { scale: "0.75", marginTop: "5px" },
  },
  {
    key: "SEDIH",
    src: seloSEDIH,
    alt: "SEDIH",
    cat: cat4,
  },
];

const heroTextColumnBaseStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  overflow: "visible",
};

const heroActionsWrapperStyle: CSSProperties = {
  position: "relative",
  zIndex: 6,
  width: "100%",
  overflow: "visible",
  isolation: "isolate",
};

const heroProfileColumnStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
};

const socialRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "1rem",
  width: "100%",
};

function normalizeTooltipClassName(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/\s+/g, "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function useCompactDesktop(): boolean {
  const [isCompactDesktop, setIsCompactDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COMPACT_DESKTOP_MEDIA_QUERY);

    const syncState = (event?: MediaQueryListEvent) => {
      setIsCompactDesktop(event ? event.matches : mediaQuery.matches);
    };

    syncState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncState);

      return () => {
        mediaQuery.removeEventListener("change", syncState);
      };
    }

    mediaQuery.addListener(syncState);

    return () => {
      mediaQuery.removeListener(syncState);
    };
  }, []);

  return isCompactDesktop;
}

function getWhatsAppGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bom dia!";
  }

  if (hour < 18) {
    return "Boa tarde!";
  }

  return "Boa noite!";
}

function MateusDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const lenis = useLenis();
  const isCompactDesktop = useCompactDesktop();

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const secondaryLabel = useMemo(() => {
    return t("buttons.downloadCV");
  }, [t]);

  const whatsappTopLabel = useMemo(() => {
    return getWhatsAppGreeting();
  }, []);

  const seniorTitleStyle = useMemo<CSSProperties>(() => {
    return {
      fontSize: isCompactDesktop ? "3.25rem" : "4rem",
      fontWeight: 700,
      color: "#f1c40f",
      marginBottom: isCompactDesktop ? "1rem" : "1.5rem",
      lineHeight: 1,
    };
  }, [isCompactDesktop]);

  const roleContainerStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundImage: "linear-gradient(90deg, #f1c40f 100%, #f1c40f 100%)",
      marginBottom: isCompactDesktop ? "max(8px, 2.5vh)" : "max(10px, 4vh)",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      height: isCompactDesktop ? "3rem" : "3.5rem",
    };
  }, [isCompactDesktop]);

  const sealsContainerStyle = useMemo<CSSProperties>(() => {
    return {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: isCompactDesktop ? "1.15rem" : "2rem",
      padding: isCompactDesktop ? "0.85rem 1.25rem" : "1.2rem 2rem",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: isCompactDesktop ? "16px" : "20px",
      backdropFilter: isCompactDesktop ? "blur(6px)" : "blur(10px)",
      marginBottom: "-1vh",
    };
  }, [isCompactDesktop]);

  const heroTextColumnStyle = useMemo<CSSProperties>(() => {
    return {
      ...heroTextColumnBaseStyle,
      paddingTop: isCompactDesktop ? "8vh" : "11vh",
    };
  }, [isCompactDesktop]);

  const profileCardStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginLeft: isCompactDesktop ? "6vw" : "10vw",
      padding: isCompactDesktop ? "2.75vh max(28px, 1.4vw)" : "4vh max(40px, 2vw)",
      borderRadius: isCompactDesktop ? "16px" : "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "center",
      width: "fit-content",
      height: "100%",
      backdropFilter: isCompactDesktop ? "blur(6px)" : "blur(8px)",
      gap: isCompactDesktop ? "2.5vh" : "4vh",
    };
  }, [isCompactDesktop]);

  const profileImageWrapperStyle = useMemo<CSSProperties>(() => {
    return {
      borderRadius: isCompactDesktop ? "2.25rem" : "3rem",
      overflow: "hidden",
      width: isCompactDesktop ? "23vw" : "29vw",
      height: isCompactDesktop ? "23vw" : "29vw",
      minWidth: isCompactDesktop ? "280px" : "360px",
      minHeight: isCompactDesktop ? "280px" : "360px",
      maxWidth: isCompactDesktop ? "420px" : "520px",
      maxHeight: isCompactDesktop ? "420px" : "520px",
      position: "relative",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    };
  }, [isCompactDesktop]);

  const primaryHeroAction = useMemo(() => {
    if (isPT) {
      return (
        <WhatsAppSignalButton
          href={WHATSAPP_HREF}
          label="WhatsApp"
          topLabel={whatsappTopLabel}
          bottomLabel="Vamos Nessa?"
          ariaLabel="Abrir conversa no WhatsApp"
          fullWidth
          compact={isCompactDesktop}
          hero
        />
      );
    }

    return (
      <CTAButton
        label="MEET"
        backLabel="LET'S TALK"
        ariaLabel="Open meeting link"
        href={MEET_HREF}
        target="_blank"
        rel="noopener noreferrer"
        variant="heroPrimary"
        size={isCompactDesktop ? "compact" : "default"}
        align="center"
        fullWidth
      />
    );
  }, [isCompactDesktop, isPT, whatsappTopLabel]);

  const secondaryHeroAction = useMemo(() => {
    return (
      <ResumeDownloadButton
        label={secondaryLabel}
        ariaLabel={secondaryLabel}
        href={RESUME_HREF}
        target="_blank"
        rel="noopener noreferrer"
        size={isCompactDesktop ? "compact" : "default"}
        fullWidth
      />
    );
  }, [isCompactDesktop, secondaryLabel]);

  const supportSocialButton = isPT ? (
    <SocialButton href={MEET_HREF} icon={IconMeet} alt="Meet" />
  ) : (
    <SocialButton href={WHATSAPP_HREF} icon={IconWhatsApp} alt="WhatsApp" />
  );

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          scale: 0.985,
          y: 24,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: isCompactDesktop ? 0.85 : 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            scroller: lenis.rootElement,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });

    return () => ctx.revert();
  }, [isCompactDesktop, lenis]);

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "visible" }}>
      <Container fluid style={{ paddingTop: isCompactDesktop ? "9vh" : "12vh" }}>
        <Row className="custom-section-row">
          <Col className="col-md-5" style={heroTextColumnStyle}>
            <div style={seniorTitleStyle}>Senior</div>

            <div className="font-sequel" style={roleContainerStyle}>
              <RoleTitle />
            </div>

            <div style={sealsContainerStyle}>
              {seals.map((seal) => (
                <Tippy
                  key={seal.key}
                  content={
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        maxWidth: "280px",
                        padding: "4px",
                      }}
                    >
                      <img
                        src={seal.cat}
                        alt={`${seal.alt} mascot`}
                        style={{ height: "11vh", borderRadius: "8px" }}
                      />
                      <p style={{ fontSize: "12px", margin: 0 }}>
                        {t(`selo.${seal.key}`)}
                      </p>
                    </div>
                  }
                  placement="top"
                  animation="fade"
                  arrow
                  delay={[500, 100]}
                  theme="bubble"
                  offset={[0, 20]}
                >
                  <div>
                    <img
                      src={seal.src}
                      alt={seal.alt}
                      style={{
                        height: isCompactDesktop ? "34px" : "40px",
                        filter: "grayscale(100%)",
                        opacity: 0.8,
                        ...seal.style,
                      }}
                    />
                  </div>
                </Tippy>
              ))}
            </div>

            <div style={heroActionsWrapperStyle}>
              <WhatsAppHeroSlot
                compact={isCompactDesktop}
                preserveDesktopOffset={!isCompactDesktop}
                primary={primaryHeroAction}
                secondary={secondaryHeroAction}
              />
            </div>
          </Col>

          <Col className="col-md-7" style={heroProfileColumnStyle}>
            <div style={profileCardStyle}>
              <div style={profileImageWrapperStyle}>
                <img
                  src={perfil}
                  alt="Mateus"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => setIsImageLoaded(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    filter: isImageLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isImageLoaded ? "scale(1)" : "scale(1.04)",
                    transition: "filter 0.45s ease, transform 0.45s ease",
                    display: "block",
                  }}
                />
              </div>

              <div style={socialRowStyle}>
                <SocialButton
                  href="https://www.linkedin.com/in/cabraiz/"
                  icon={IconLinkendin}
                  alt="LinkedIn"
                />
                <SocialButton
                  href="mailto:mateusccabr@gmail.com?subject=Freelance..."
                  icon={IconGmail}
                  alt="Gmail"
                />
                <SocialButton
                  href="https://www.instagram.com/cabraiz/"
                  icon={IconInsta}
                  alt="Instagram"
                />
                {supportSocialButton}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export function SocialButton({
  href,
  icon,
  alt,
  isScrollToTop,
}: SocialButtonProps) {
  const normalizedTooltipClass = normalizeTooltipClassName(alt);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="social-wrapper"
      aria-label={alt}
    >
      <div className={`social-link ${isScrollToTop ? "scrollToTopButton" : ""}`}>
        <Image className="imagesize" src={icon} alt={alt} />
      </div>
      <div className={`tooltip-custom tooltip-${normalizedTooltipClass}`}>
        {alt}
      </div>
    </a>
  );
}

export default MateusDesktop;
