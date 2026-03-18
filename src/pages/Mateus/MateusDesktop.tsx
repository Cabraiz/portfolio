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
import WhatsAppSignalButton from "./shared/WhatsAppSignalButton/WhatsAppSignalButton";

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

const COMPACT_DESKTOP_MEDIA_QUERY =
  "(max-height: 720px) and (min-width: 961px)";

const WHATSAPP_HREF = "https://wa.me/5585998575707";
const MEET_HREF = "https://meet.google.com/SEULINK";

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

const seniorTitleStyle: CSSProperties = {
  fontSize: "4rem",
  fontWeight: 700,
  color: "#f1c40f",
  marginBottom: "1.5rem",
  lineHeight: 1,
};

const roleContainerStyle: CSSProperties = {
  backgroundImage: "linear-gradient(90deg, #f1c40f 100%, #f1c40f 100%)",
  marginBottom: "max(10px, 4vh)",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  height: "3.5rem",
};

const sealsContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "2rem",
  padding: "1.2rem 2rem",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  borderRadius: "20px",
  backdropFilter: "blur(10px)",
  marginBottom: "max(10px, 4vh)",
};

const profileCardStyle: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  marginLeft: "10vw",
  padding: "4vh max(40px, 2vw)",
  borderRadius: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-evenly",
  alignItems: "center",
  width: "fit-content",
  height: "100%",
  backdropFilter: "blur(8px)",
  gap: "4vh",
};

const profileImageWrapperStyle: CSSProperties = {
  borderRadius: "3rem",
  overflow: "hidden",
  width: "29vw",
  height: "29vw",
  position: "relative",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const socialRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "1rem",
  width: "100%",
};

const ctaRowStyle: CSSProperties = {
  alignItems: "flex-start",
};

const ctaColStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
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
          scale: 0.98,
          filter: "blur(4px)",
          y: 30,
        },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            scroller: lenis.rootElement,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [lenis]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Container fluid style={{ paddingTop: isCompactDesktop ? "9vh" : "12vh" }}>
        <Row className="custom-section-row">
          <Col
            className="col-md-5"
            style={{ paddingTop: isCompactDesktop ? "8vh" : "11vh" }}
          >
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
                        height: "40px",
                        filter: "grayscale(100%)",
                        opacity: 0.8,
                        ...seal.style,
                      }}
                    />
                  </div>
                </Tippy>
              ))}
            </div>

            <Row className="pb-2 justify-content-end g-3" style={ctaRowStyle}>
              {!isCompactDesktop && <Col md={2} />}

              <Col md={isCompactDesktop ? 7 : 5} style={ctaColStyle}>
                {isPT ? (
                  <WhatsAppSignalButton
                    href={WHATSAPP_HREF}
                    label="WhatsApp"
                    topLabel="Contato direto"
                    bottomLabel="Resposta rápida"
                    ariaLabel="Abrir conversa no WhatsApp"
                    fullWidth
                    compact={isCompactDesktop}
                    hero
                  />
                ) : (
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
                )}
              </Col>

              <Col md={5} style={ctaColStyle}>
                <CTAButton
                  label={secondaryLabel}
                  backLabel={secondaryLabel}
                  ariaLabel={secondaryLabel}
                  href="/resume"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="heroSecondary"
                  size={isCompactDesktop ? "compact" : "default"}
                  align="center"
                  fullWidth
                />
              </Col>
            </Row>
          </Col>

          <Col className="col-md-7">
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
                    filter: isImageLoaded ? "blur(0px)" : "blur(20px)",
                    transform: isImageLoaded ? "scale(1)" : "scale(1.1)",
                    transition: "filter 0.7s ease, transform 0.7s ease",
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
