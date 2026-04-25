import React, { useMemo, type CSSProperties } from "react";

import type { HomeArcadePhase } from "./HomeArcadeCanvas";

export type HomeArcadeHudProps = Readonly<{
  portraitSrc: string;
  portraitAlt?: string;
  avatarLoaded?: boolean;
  onAvatarLoad?: () => void;
  score: number;
  lives: number;
  timeLeft: number;
  phase: HomeArcadePhase;
  onTogglePause: () => void;
  onClose: () => void;
}>;

export default function HomeArcadeHud({
  portraitSrc,
  portraitAlt = "Mateus Cabral",
  avatarLoaded = true,
  onAvatarLoad,
  score,
  lives,
  timeLeft,
  phase,
  onTogglePause,
  onClose,
}: HomeArcadeHudProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 2,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: "12px",
      padding:
        "max(12px, env(safe-area-inset-top)) 14px 12px 14px",
      boxSizing: "border-box",
      background:
        "linear-gradient(180deg, rgba(9,11,25,0.92) 0%, rgba(9,11,25,0.68) 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    };
  }, []);

  const avatarWrapStyle = useMemo<CSSProperties>(() => {
    return {
      width: "46px",
      height: "46px",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow:
        "0 12px 26px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.03) inset",
      background:
        "linear-gradient(180deg, rgba(37,39,64,0.96) 0%, rgba(13,14,28,0.98) 100%)",
      flexShrink: 0,
    };
  }, []);

  const avatarImageStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center top",
      display: "block",
      opacity: avatarLoaded ? 1 : 0,
      transition: "opacity 220ms ease",
      userSelect: "none",
      WebkitUserDrag: "none",
    };
  }, [avatarLoaded]);

  const statsWrapStyle = useMemo<CSSProperties>(() => {
    return {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "8px",
      alignItems: "center",
      minWidth: 0,
    };
  }, []);

  const statPillStyle = useMemo<CSSProperties>(() => {
    return {
      minHeight: "46px",
      padding: "8px 10px",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(180deg, rgba(39,42,88,0.72) 0%, rgba(16,17,38,0.88) 100%)",
      boxShadow:
        "0 10px 22px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "4px",
      boxSizing: "border-box",
      overflow: "hidden",
    };
  }, []);

  const statLabelStyle = useMemo<CSSProperties>(() => {
    return {
      fontSize: "0.62rem",
      lineHeight: 1,
      letterSpacing: "0.08em",
      fontWeight: 800,
      color: "rgba(182, 197, 255, 0.72)",
      whiteSpace: "nowrap",
      textTransform: "uppercase",
    };
  }, []);

  const statValueStyle = useMemo<CSSProperties>(() => {
    return {
      fontSize: "0.98rem",
      lineHeight: 1,
      fontWeight: 900,
      color: "rgba(255,255,255,0.98)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    };
  }, []);

  const hudActionsStyle = useMemo<CSSProperties>(() => {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0,
    };
  }, []);

  const hudButtonStyle = useMemo<CSSProperties>(() => {
    return {
      width: "44px",
      height: "44px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.1)",
      background:
        "linear-gradient(180deg, rgba(48,50,82,0.74) 0%, rgba(16,18,35,0.96) 100%)",
      color: "rgba(255,255,255,0.96)",
      boxShadow:
        "0 12px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
      transition:
        "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
    };
  }, []);

  return (
    <div style={rootStyle}>
      <div style={avatarWrapStyle}>
        <img
          src={portraitSrc}
          alt={portraitAlt}
          style={avatarImageStyle}
          onLoad={onAvatarLoad}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>

      <div style={statsWrapStyle}>
        <div style={statPillStyle}>
          <span style={statLabelStyle}>Score</span>
          <span style={statValueStyle}>{score.toLocaleString("pt-BR")}</span>
        </div>

        <div style={statPillStyle}>
          <span style={statLabelStyle}>Lives</span>
          <span style={statValueStyle}>{lives}</span>
        </div>

        <div style={statPillStyle}>
          <span style={statLabelStyle}>Time</span>
          <span style={statValueStyle}>{Math.ceil(timeLeft)}s</span>
        </div>
      </div>

      <div style={hudActionsStyle}>
        <button
          type="button"
          aria-label={phase === "paused" ? "Continuar" : "Pausar"}
          style={hudButtonStyle}
          onClick={onTogglePause}
        >
          {phase === "paused" ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M8 5.5l10 6.5-10 6.5V5.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor" />
            </svg>
          )}
        </button>

        <button
          type="button"
          aria-label="Fechar jogo"
          style={hudButtonStyle}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
