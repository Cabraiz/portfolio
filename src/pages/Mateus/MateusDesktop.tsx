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

import HeroTextColumn from "./components/desktop/HeroTextColumn";
import HeroProfileColumn from "./components/desktop/HeroProfileColumn";
import { useMateusHeroLayout } from "./hooks/useMateusHeroLayout";
import { getWhatsAppGreeting } from "./mateusDesktop.utils";
import { shouldDisableScrollFades } from "../../features/scroll/scrollMotionFlags";

function MateusDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const { sectionStyle, isCompactDesktop } = useMateusHeroLayout();

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const secondaryLabel = useMemo(() => {
    return t("buttons.downloadCV");
  }, [t, currentLanguage]);

  const whatsappTopLabel = useMemo(() => {
    return getWhatsAppGreeting();
  }, []);

  /**
   * A altura da seção passa a ser responsabilidade do shell/landing.
   * Aqui o hero só ocupa integralmente o espaço que recebeu do pai.
   */
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      minHeight: "100%",
      height: "100%",
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
      minWidth: 0,
      minHeight: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      alignItems: "stretch",
      justifyContent:
        sectionStyle.justifyContent ??
        (isCompactDesktop ? "center" : "flex-start"),
      overflow: "visible",
      boxSizing: "border-box",

      /**
       * Importante:
       * não deixamos o hero recalcular viewport aqui.
       * O pai já fez isso.
       */
      minBlockSize: "100%",
    };
  }, [isCompactDesktop, sectionStyle]);

  const rowStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      minWidth: 0,
      flex: "1 1 auto",
      minHeight: 0,
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

    if (!container) {
      return undefined;
    }

    const disableHeroIntro = shouldDisableScrollFades();

    if (disableHeroIntro) {
      gsap.set(container, {
        opacity: 1,
        y: 0,
        clearProps: "transform,opacity,willChange",
      });

      container.style.willChange = "auto";
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(container, {
        opacity: 0,
        y: isCompactDesktop ? 12 : 16,
        willChange: "transform, opacity",
      });

      gsap.to(container, {
        opacity: 1,
        y: 0,
        duration: isCompactDesktop ? 0.42 : 0.52,
        ease: "power2.out",
        overwrite: "auto",
        onStart: () => {
          container.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          gsap.set(container, {
            clearProps: "transform,opacity",
          });
          container.style.willChange = "auto";
        },
      });
    }, container);

    return () => {
      ctx.revert();
      container.style.willChange = "auto";
    };
  }, [isCompactDesktop]);

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
