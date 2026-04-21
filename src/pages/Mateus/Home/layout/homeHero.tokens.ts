export type HomeHeroViewportMode = "compact" | "default" | "tall";

export const homeHeroTokens = {
  breakpoints: {
    desktopMinWidth: 961,
    compactHeightMax: 760,
    tallHeightMin: 981,
  },

  section: {
    /**
     * A LandingSectionShell continua dona da altura da seção.
     * O hero só ocupa o bloco disponível, sem compensar navbar aqui.
     */
    minHeight: {
      compact: "100%",
      default: "100%",
      tall: "100%",
    },

    /**
     * 720p continua mais contido.
     * 1080p ganha um pouco mais de respiro, mas já compensado
     * com base equivalente para o conjunto ficar mais centrado.
     */
    paddingTop: {
      compact: "8px",
      default: "10px",
      tall: "12px",
    },

    /**
     * Equilibra com o topo para o hero parecer mais centralizado
     * dentro da área útil em 1080p.
     */
    paddingBottom: {
      compact: "6px",
      default: "10px",
      tall: "12px",
    },
  },

  profileColumn: {
    /**
     * A coluna direita continua respirando,
     * mas agora sem “roubar” tanto espaço da esquerda.
     */
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

    /**
     * Em 1080p o card continua com presença,
     * mas ligeiramente mais contido para a esquerda expandir.
     */
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

    /**
     * Redução controlada do card da direita.
     * Isso ajuda a abrir mais área útil para a coluna esquerda.
     */
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
    /**
     * A imagem segue grande, mas um pouco mais controlada
     * para a coluna direita não dominar a composição.
     */
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
      default: "14px",
      tall: "16px",
    },
  },
} as const;
