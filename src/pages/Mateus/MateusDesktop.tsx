import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import { shouldDisableScrollFades } from "../../features/scroll/scrollMotionFlags";

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

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "visible",
      boxSizing: "border-box",
    };
  }, []);

  const containerStyle = useMemo<CSSProperties>(() => {
    return {
      ...sectionStyle,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      alignItems: "stretch",
      justifyContent:
        sectionStyle.justifyContent ?? (isCompactDesktop ? "center" : "flex-start"),
      boxSizing: "border-box",
    };
  }, [isCompactDesktop, sectionStyle]);

  const rowStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      flex: "1 1 auto",
      minHeight: "100%",
      height: "100%",
      margin: 0,
      paddingTop: 0,
      paddingBottom: 0,
      display: "flex",
      flexWrap: "nowrap",
      alignItems: "center",
      alignContent: "stretch",
      boxSizing: "border-box",
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || !lenis?.rootElement) {
      return undefined;
    }

    if (shouldDisableScrollFades()) {
      gsap.set(container, {
        opacity: 1,
        scale: 1,
        y: 0,
        clearProps: "transform,opacity,willChange",
      });

      container.style.willChange = "auto";
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(container, {
        opacity: 0,
        scale: 0.985,
        y: 24,
        willChange: "transform, opacity",
        force3D: true,
      });

      gsap.to(container, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: isCompactDesktop ? 0.85 : 1,
        ease: "power3.out",
        overwrite: "auto",
        onStart: () => {
          container.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          container.style.willChange = "auto";
        },
        onReverseComplete: () => {
          container.style.willChange = "auto";
        },
        scrollTrigger: {
          trigger: container,
          scroller: lenis.rootElement,
          start: "top 82%",
          toggleActions: "play none none reverse",
          fastScrollEnd: true,
          invalidateOnRefresh: true,
        },
      });
    }, container);

    return () => {
      ctx.revert();
      container.style.willChange = "auto";
    };
  }, [isCompactDesktop, lenis]);

  return (
    <div ref={containerRef} style={rootStyle}>
      <Container fluid style={containerStyle}>
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
