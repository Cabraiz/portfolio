export type MateusHeroViewportMode = "compact" | "default" | "tall";

export const mateusHeroTokens = {
  breakpoints: {
    desktopMinWidth: 961,
    compactHeightMax: 760,
    tallHeightMin: 981,
  },

  section: {
    minHeight: {
      compact: "calc(100vh - 78px)",
      default: "calc(100vh - 78px)",
      tall: "calc(100vh - 78px)",
    },
    paddingTop: {
      compact: "16px",
      default: "20px",
      tall: "24px",
    },
    paddingBottom: {
      compact: "16px",
      default: "20px",
      tall: "24px",
    },
  },

  profileColumn: {
    paddingLeft: {
      compact: "10px",
      default: "12px",
      tall: "14px",
    },
    paddingRight: {
      compact: "10px",
      default: "12px",
      tall: "14px",
    },
  },

  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginLeft: {
      compact: "0px",
      default: "0px",
      tall: "0px",
    },
    padding: {
      compact: "20px 20px 24px",
      default: "28px 28px 32px",
      tall: "30px 30px 34px",
    },
    borderRadius: {
      compact: "18px",
      default: "20px",
      tall: "24px",
    },
    width: {
      compact: "min(100%, 430px)",
      default: "min(100%, 590px)",
      tall: "min(100%, 650px)",
    },
    gap: {
      compact: "18px",
      default: "24px",
      tall: "28px",
    },
    blur: {
      compact: "blur(6px)",
      default: "blur(7px)",
      tall: "blur(8px)",
    },
  },

  profileImage: {
    maxWidth: {
      compact: "350px",
      default: "495px",
      tall: "545px",
    },
    borderRadius: {
      compact: "1.85rem",
      default: "2.25rem",
      tall: "2.75rem",
    },
    aspectRatio: "1 / 1",
    shadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
  },

  socialRow: {
    gap: {
      compact: "12px",
      default: "16px",
      tall: "18px",
    },
  },
} as const;
