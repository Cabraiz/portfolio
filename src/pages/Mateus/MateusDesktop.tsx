import React, { FC, useLayoutEffect, useRef, useState } from "react";
import { Col, Row, Image, Button, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

import RoleTitle from "./RoleTitle";

import IconWhatsAppVector from "../../assets/Mateus/icon/IconWhatsAppVector.svg";
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

interface SocialButtonProps {
  href: string;
  icon: string;
  alt: string;
  isScrollToTop?: boolean;
}

const selos = [
  { key: "BNB", src: seloBNB, alt: "Banco do Nordeste", cat: cat1, style: { scale: "0.9", marginTop: "5px" } },
  { key: "UNIFOR", src: seloUNIFOR, alt: "UNIFOR", cat: cat2, style: {} },
  { key: "SANA", src: seloSANA, alt: "SANA", cat: cat3, style: { scale: "0.75", marginTop: "5px" } },
  { key: "SEDIH", src: seloSEDIH, alt: "SEDIH", cat: cat4, style: {} },
];

const MateusDesktop: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const isPT = i18n.language === "pt" || i18n.language.startsWith("pt");
  const lenis = useLenis();

  const [isLoading, setIsLoading] = useState(false);
  const [forceHover, setForceHover] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const openResumeTab = () => window.open("/resume", "_blank");

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) return;

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
            scroller: lenis.rootElement, // ✅ ESSENCIAL para Lenis
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
      <Container fluid style={{ paddingTop: "12vh" }}>
        <Row className="custom-section-row">
          <Col className="col-md-5" style={{ paddingTop: "11vh" }}>
            <div style={{ fontSize: "4rem", fontWeight: 700, color: "#f1c40f", marginBottom: "1.5rem" }}>
              Senior
            </div>

            <div
              className="font-sequel"
              style={{
                backgroundImage: "linear-gradient(90deg,#f1c40f 100%, #f1c40f 100%)",
                marginBottom: "max(10px, 4vh)",
                display: "flex",
                alignItems: "center",
                justifyContent: "start",
                height: "3.5rem",
              }}
            >
              <RoleTitle />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "2rem",
                padding: "1.2rem 2rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "20px",
                backdropFilter: "blur(10px)",
                marginBottom: "max(10px, 4vh)",
              }}
            >
              {selos.map((selo) => (
                <Tippy
                  key={selo.key}
                  content={
                    <div style={{ display: "flex", gap: "1rem", maxWidth: "280px", padding: "4px" }}>
                      <img src={selo.cat} alt="Cat" style={{ height: "11vh", borderRadius: "8px" }} />
                      <p style={{ fontSize: "12px", margin: 0 }}>{t(`selo.${selo.key}`)}</p>
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
                      src={selo.src}
                      alt={selo.alt}
                      style={{
                        height: "40px",
                        filter: "grayscale(100%)",
                        opacity: 0.8,
                        ...selo.style,
                      }}
                    />
                  </div>
                </Tippy>
              ))}
            </div>

            <Row className="pb-2 justify-content-end">
              <Col md={2} />
              <Col md={5}>
                <button
                  className={`lux-button ${forceHover ? "lux-hover" : ""} ${isLoading ? "lux-loading" : ""}`}
                  onClick={() => {
                    setIsLoading(true);
                    setForceHover(true);
                    setTimeout(() => {
                      window.open(
                        isPT ? "https://wa.me/5585998575707" : "https://meet.google.com/SEULINK",
                        "_blank"
                      );
                      setIsLoading(false);
                      setForceHover(false);
                    }, 1000);
                  }}
                >
                  <div>
                    <span>
                      {isPT && (
                        <img
                          src={IconWhatsAppVector}
                          alt="WhatsApp"
                          style={{ height: "22px", width: "22px", marginRight: "0.4rem" }}
                        />
                      )}
                      {!isLoading && <p>{isPT ? "WHATSAPP" : "MEET"}</p>}
                    </span>
                  </div>
                  <div>
                    <span>
                      {isPT && (
                        <img
                          src={IconWhatsAppVector}
                          alt="WhatsApp"
                          style={{ height: "22px", width: "22px" }}
                        />
                      )}
                      {!isLoading ? (
                        <p>{isPT ? "VAMOS CONVERSAR" : "LET'S TALK"}</p>
                      ) : (
                        <div className="lux-loading-bar" />
                      )}
                    </span>
                  </div>
                </button>
              </Col>
              <Col md={5}>
                <Button
                  className="btn-trasn-w-border py-3 btn-tran-effect btn-press-effect w-100"
                  onClick={openResumeTab}
                >
                  {t("buttons.downloadCV")}
                </Button>
              </Col>
            </Row>
          </Col>

          <Col className="col-md-7">
            <div
              style={{
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
              }}
            >
              <div
                style={{
                  borderRadius: "3rem",
                  overflow: "hidden",
                  width: "29vw",
                  height: "29vw",
                  position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                }}
              >
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  width: "100%",
                }}
              >
                <SocialButton href="https://www.linkedin.com/in/cabraiz/" icon={IconLinkendin} alt="LinkedIn" />
                <SocialButton href="mailto:mateusccabr@gmail.com?subject=Freelance..." icon={IconGmail} alt="Gmail" />
                <SocialButton href="https://www.instagram.com/cabraiz/" icon={IconInsta} alt="Insta" />
                {isPT ? (
                  <SocialButton href="https://meet.google.com/SEULINK" icon={IconMeet} alt="Meet" />
                ) : (
                  <SocialButton href="https://wa.me/5585998575707" icon={IconWhatsApp} alt="WhatsApp" />
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export function SocialButton({ href, icon, alt, isScrollToTop }: SocialButtonProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="social-wrapper">
      <div className={`social-link ${isScrollToTop ? "scrollToTopButton" : ""}`}>
        <Image className="imagesize" src={icon} alt={alt} />
      </div>
      <div
        className={`tooltip-custom tooltip-${alt
          .toLowerCase()
          .replace(/\s+/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")}`}
      >
        {alt}
      </div>
    </a>
  );
}

export default MateusDesktop;
