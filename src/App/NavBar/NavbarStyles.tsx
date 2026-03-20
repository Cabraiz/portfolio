import { CSSProperties } from "react";

export const navbarLayoutTokens = {
  heights: {
    mobile: 72,
    desktop: 70,
    desktopTall: 78,
  },

  container: {
    maxWidth: "1360px",
    desktopPaddingX: "20px",
    mobilePaddingX: "12px",
    desktopGap: "16px",
    mobileGap: "12px",
  },

  desktop: {
    compactBreakpoint: 1240,
    tallViewportBreakpoint: 900,

    /**
     * Aumentado para o botão Google ocupar mais largura
     * tanto em 1080p (default) quanto em 720p (compact).
     */
    sideColumnWidth: {
      default: "272px",
      compact: "232px",
    },

    logoOffsetX: "10px",

    logoGap: {
      default: "12px",
      compact: "8px",
    },

    logoSize: {
      default: "60px",
      compact: "54px",
    },

    navOffsetY: "10px",
    navContainerPaddingX: "6px",
    navContainerPaddingBottom: "8px",

    navGap: {
      default: "clamp(0.75rem, 0.45rem + 0.8vw, 1.35rem)",
      compact: "clamp(0.55rem, 0.35rem + 0.4vw, 0.9rem)",
    },

    liveAnimationLeft: {
      default: "-1.9rem",
      compact: "-1rem",
    },
  },

  mobile: {
    menuTopOffset: 10,
    logoOffsetX: "0px",
    logoSize: "40px",
    brandGap: "10px",
  },

  navLink: {
    fontSize: "clamp(1rem, 0.9rem + 0.28vw, 1.28rem)",
    letterSpacing: 1.05,
    paddingBottom: 8,
  },

  underline: {
    bottom: "8px",
    height: "3px",
    borderRadius: "3px",
  },
} as const;

export const navbarStyles = {
  container: {
    backdropFilter: "blur(6px)",
    boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
    position: "fixed",
    width: "100%",
    top: 0,
    left: 0,
  } as CSSProperties,

  navLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 100,
    letterSpacing: navbarLayoutTokens.navLink.letterSpacing,
    cursor: "pointer",
    userSelect: "none",
    transition: "color 0.25s ease-in-out, transform 0.25s ease-in-out",
    position: "relative",
    fontSize: navbarLayoutTokens.navLink.fontSize,
    lineHeight: 1.05,
    whiteSpace: "nowrap",
    margin: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: navbarLayoutTokens.navLink.paddingBottom,
  } as CSSProperties,

  navLinkActive: {
    color: "rgba(255, 255, 255, 0.92)",
  } as CSSProperties,

  navLinkHover: {
    color: "rgba(255, 255, 255, 0.9)",
  } as CSSProperties,

  underline: {
    position: "absolute",
    bottom: navbarLayoutTokens.underline.bottom,
    height: navbarLayoutTokens.underline.height,
    backgroundColor: "white",
    borderRadius: navbarLayoutTokens.underline.borderRadius,
    transition: "all 300ms ease-in-out",
    zIndex: 1,
    pointerEvents: "none",
  } as CSSProperties,

  borderGradient: {
    borderStyle: "solid",
    borderImage:
      "linear-gradient(to left, #ffffff00 -20%, #ffffff33 60%, #ffffffbd 80%, #ffffffbd 86%, #ffffff33 92%, #ffffff00 100%) 100% 0 100% 0/1px 0 1px 0 stretch",
  } as CSSProperties,
};
