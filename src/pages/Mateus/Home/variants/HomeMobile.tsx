import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../../../styles/styles.css";

import gsap from "gsap";

import HeroMobileStack from "../components/mobile/HeroMobileStack";
import type { MobileSocialItem } from "../components/mobile/SocialRowMobile";
import HomeDriveGame from "../components/mobile/game/driving/HomeDriveGame";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";
import {
  HOME_MOBILE_SOCIAL_LINKS,
  PROFILE_IMAGE,
  SOCIAL_ICONS,
} from "../data/home.data";
import { homeHeroTokens } from "../layout/homeHero.tokens";

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

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const playLabel = useMemo(() => {
    return isPT ? "Dirigir" : "Drive";
  }, [isPT]);

  const playAriaLabel = useMemo(() => {
    return isPT ? "Abrir driving game" : "Open driving game";
  }, [isPT]);

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

  const socialItems = useMemo<readonly MobileSocialItem[]>(() => {
    return HOME_MOBILE_SOCIAL_LINKS.map((item) => {
      const iconSrc = SOCIAL_ICONS[item.iconKey];

      return {
        id: item.id,
        label: item.label,
        ariaLabel: item.ariaLabel,
        href: item.href,
        target: item.target,
        rel: item.rel,
        icon: (
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            style={socialIconImageStyle}
            draggable={false}
          />
        ),
      };
    });
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
      overflowY: isGameOpen ? "hidden" : "visible",
      backgroundColor: "#07080b",
      backgroundImage: MOBILE_HERO_BACKGROUND,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center top",
      boxSizing: "border-box",
    };
  }, [isGameOpen]);

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
      width: `min(100%, ${homeHeroTokens.mobileAttractMode.cardMaxWidth})`,
      minWidth: 0,
      maxWidth: homeHeroTokens.mobileAttractMode.cardMaxWidth,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "center",
      boxSizing: "border-box",
    };
  }, []);

  const playWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
    };
  }, []);

  const playButtonStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: homeHeroTokens.mobileAttractMode.launcherWidth,
      minHeight: homeHeroTokens.mobileAttractMode.launcherMinHeight,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "0 18px",
      borderRadius: "16px",
      border: "1px solid rgba(255, 210, 132, 0.18)",
      background:
        "linear-gradient(180deg, rgba(36,36,44,0.92) 0%, rgba(12,12,16,0.98) 100%)",
      color: "rgba(255, 244, 226, 0.96)",
      fontSize: "0.98rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      boxShadow:
        "0 16px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.02) inset",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
      transition:
        "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease",
      overflow: "hidden",
      boxSizing: "border-box",
    };
  }, []);

  const playPulseStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(90deg, rgba(255,210,120,0.00) 0%, rgba(255,210,120,0.07) 18%, rgba(255,210,120,0.14) 50%, rgba(255,210,120,0.07) 82%, rgba(255,210,120,0.00) 100%)",
      opacity: 0.92,
    };
  }, []);

  const playIconStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      background:
        "radial-gradient(circle, rgba(255,228,178,1) 0%, rgba(255,195,90,0.98) 54%, rgba(255,175,66,0.92) 100%)",
      boxShadow:
        "0 0 14px rgba(255, 194, 90, 0.3), 0 0 0 1px rgba(255,255,255,0.05) inset",
      flexShrink: 0,
    };
  }, []);

  const playLabelStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    };
  }, []);

  const driveOverlayStyle = useMemo<CSSProperties>(() => {
    return {
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100dvh",
      zIndex: 999,
      background: "#040507",
      overflow: "hidden",
    };
  }, []);

  const handleOpenDrive = useCallback(() => {
    setIsGameOpen(true);
  }, []);

  const handleCloseDrive = useCallback(() => {
    setIsGameOpen(false);
  }, []);

  const playLauncher = useMemo(() => {
    return (
      <div style={playWrapStyle}>
        <button
          type="button"
          aria-label={playAriaLabel}
          style={playButtonStyle}
          onClick={handleOpenDrive}
        >
          <span style={playPulseStyle} />
          <span style={playIconStyle} />
          <span style={playLabelStyle}>{playLabel}</span>
        </button>
      </div>
    );
  }, [
    handleOpenDrive,
    playAriaLabel,
    playButtonStyle,
    playIconStyle,
    playLabel,
    playLabelStyle,
    playPulseStyle,
    playWrapStyle,
  ]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    if (isGameOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
    };
  }, [isGameOpen]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || isGameOpen) {
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
  }, [isGameOpen]);

  return (
    <div ref={containerRef} style={rootStyle}>
      {!isGameOpen ? (
        <div style={containerStyle}>
          <div style={stackWrapStyle}>
            <HeroMobileStack
              imageSrc={PROFILE_IMAGE}
              imageAlt="Mateus Cabral"
              socialItems={socialItems}
              imageLoaded={isImageLoaded}
              onImageLoad={() => setIsImageLoaded(true)}
              bottomSlot={playLauncher}
              isGameOpen={isGameOpen}
            />
          </div>
        </div>
      ) : null}

      {isGameOpen ? (
        <div style={driveOverlayStyle}>
          <HomeDriveGame onClose={handleCloseDrive} />
        </div>
      ) : null}
    </div>
  );
}

export default HomeMobile;
