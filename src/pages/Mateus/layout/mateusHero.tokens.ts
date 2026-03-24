export type MateusHeroViewportMode = "compact" | "default" | "tall";

export const mateusHeroTokens = {
  breakpoints: {
    desktopMinWidth: 961,
    compactHeightMax: 760,
    tallHeightMin: 981,
  },

  section: {
    /**
     * A LandingSectionShell já é a dona da altura da seção.
     * O hero não recalcula viewport nem desconta navbar aqui;
     * ele apenas ocupa 100% do bloco recebido do pai.
     */
    minHeight: {
      compact: "100%",
      default: "100%",
      tall: "100%",
    },

    /**
     * Respiro superior pequeno e controlado.
     * Sem exagero para não empurrar o conteúdo para baixo.
     */
    paddingTop: {
      compact: "16px",
      default: "12px",
      tall: "16px",
    },

    /**
     * Respiro inferior reduzido.
     * O excesso anterior, somado ao padding da row,
     * era parte da causa da faixa da próxima seção aparecer.
     */
    paddingBottom: {
      compact: "8px",
      default: "8px",
      tall: "10px",
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
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
