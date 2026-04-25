export type HomeHeroViewportMode = "compact" | "default" | "tall";

export const homeHeroTokens = {
  breakpoints: {
    desktopMinWidth: 961,
    compactHeightMax: 760,
    tallHeightMin: 981,
  },

  section: {
    minHeight: {
      compact: "100%",
      default: "100%",
      tall: "100%",
    },

    paddingTop: {
      compact: "8px",
      default: "10px",
      tall: "12px",
    },

    paddingBottom: {
      compact: "6px",
      default: "10px",
      tall: "12px",
    },
  },

  profileColumn: {
    paddingLeft: {
      compact: "6px",
      default: "10px",
      tall: "12px",
    },
    paddingRight: {
      compact: "8px",
      default: "12px",
      tall: "14px",
    },
  },

  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",

    marginLeft: {
      compact: "0px",
      default: "0px",
      tall: "0px",
    },

    padding: {
      compact: "14px 14px 16px",
      default: "22px 22px 26px",
      tall: "24px 24px 28px",
    },

    borderRadius: {
      compact: "16px",
      default: "20px",
      tall: "22px",
    },

    width: {
      compact: "min(100%, 350px)",
      default: "min(100%, 480px)",
      tall: "min(100%, 530px)",
    },

    gap: {
      compact: "12px",
      default: "18px",
      tall: "20px",
    },

    blur: {
      compact: "none",
      default: "none",
      tall: "none",
    },

    border: {
      compact: "1px solid rgba(255, 255, 255, 0.07)",
      default: "1px solid rgba(255, 255, 255, 0.07)",
      tall: "1px solid rgba(255, 255, 255, 0.08)",
    },

    shadow: {
      compact: "0 10px 24px rgba(0, 0, 0, 0.16)",
      default: "0 12px 28px rgba(0, 0, 0, 0.18)",
      tall: "0 14px 32px rgba(0, 0, 0, 0.2)",
    },
  },

  profileImage: {
    maxWidth: {
      compact: "100%",
      default: "410px",
      tall: "445px",
    },

    borderRadius: {
      compact: "1.25rem",
      default: "2rem",
      tall: "2.25rem",
    },

    aspectRatio: "1 / 1",
    shadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
  },

  socialRow: {
    gap: {
      compact: "10px",
      default: "10px",
      tall: "12px",
    },

    showLabelsByDefault: false,

    dock: {
      minHeight: "58px",
      paddingWithLabel: "12px 12px",
      paddingIconOnly: "12px 10px",
      borderRadius: "18px",
      border: "1px solid rgba(255, 215, 140, 0.14)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      shadow:
        "0 12px 24px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
      color: "rgba(255, 247, 230, 0.96)",
      iconSize: "18px",
      labelFontSize: "0.78rem",
      labelColor: "rgba(255, 243, 220, 0.92)",
    },
  },

  primaryActions: {
    gap: {
      compact: "10px",
      default: "10px",
      tall: "12px",
    },
    height: "54px",
    padding: "12px 14px",
    borderRadius: "18px",
    fontSize: "0.86rem",
    iconSize: "18px",

    primary: {
      border: "1px solid rgba(255, 210, 120, 0.22)",
      background:
        "linear-gradient(180deg, rgba(255, 205, 110, 0.16) 0%, rgba(255, 205, 110, 0.07) 100%)",
      shadow:
        "0 14px 28px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
      color: "rgba(255, 247, 230, 0.98)",
    },

    secondary: {
      border: "1px solid rgba(255, 210, 120, 0.10)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
      shadow:
        "0 12px 24px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255,255,255,0.05)",
      color: "rgba(255, 243, 220, 0.92)",
    },
  },

  mobileAttractMode: {
    cardMaxWidth: "468px",
    cardMinHeight: "clamp(540px, 78dvh, 820px)",
    cardRadius: "24px",
    imageMinHeight: "clamp(320px, 50dvh, 560px)",
    launcherWidth: "min(100%, 224px)",
    launcherMinHeight: "54px",
  },

  mobileGame: {
    overlayBlur: "18px",
    overlayBackdrop:
      "radial-gradient(circle at 50% 50%, rgba(255, 190, 95, 0.08) 0%, rgba(12, 12, 16, 0.78) 42%, rgba(4, 4, 7, 0.94) 100%)",
    cardScaleWhenOpen: 0.995,
    imageScaleWhenOpen: 0.988,
    socialOpacityWhenOpen: 0.72,
    marqueeOpacityWhenOpen: 0.78,
  },

  mobileArcade: {
    overlayMaxWidth: "480px",
    overlayInset: "12px",
    overlayRadius: "30px",
    controlsGap: "10px",
    hudGap: "12px",
    arenaHeight: "386px",
    groundHeight: "76px",
    progressHeight: "10px",
  },
} as const;
