import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../styles/styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import HeroTextColumn from "./components/desktop/HeroTextColumn";
import HeroProfileColumn from "./components/desktop/HeroProfileColumn";
import { useMateusHeroLayout } from "./hooks/useMateusHeroLayout";
import { getWhatsAppGreeting } from "./mateusDesktop.utils";

gsap.registerPlugin(ScrollTrigger);

function MateusDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const lenis = useLenis();

  const { sectionStyle, isCompactDesktop } = useMateusHeroLayout();

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

const rowStyle = useMemo<CSSProperties>(() => {
  return {
    width: "100%",
    flex: 1,
    minHeight: 0,
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    display: "flex",
    alignItems: "center",
  };
}, []);

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
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "visible",
      }}
    >
      <Container fluid style={sectionStyle}>
        <Row className="custom-section-row" style={rowStyle}>
          <HeroTextColumn
            isCompactDesktop={isCompactDesktop}
            isPT={isPT}
            whatsappTopLabel={whatsappTopLabel}
            secondaryLabel={secondaryLabel}
          />

          <HeroProfileColumn
            isCompactDesktop={isCompactDesktop}
            isPT={isPT}
            isImageLoaded={isImageLoaded}
            onImageLoad={() => setIsImageLoaded(true)}
          />
        </Row>
      </Container>
    </div>
  );
}

export default MateusDesktop;
