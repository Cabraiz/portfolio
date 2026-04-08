// src/pages/Mateus/Live/ui/chrome/LiveSectionHeader.tsx

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_INTERACTION_LABELS,
} from "../../domain/live.constants";
import type {
  LiveInteractionMode,
  LiveProjectAggregate,
  LiveSceneDensity,
} from "../../domain/live.types";

export type LiveSectionHeaderProps = Readonly<{
  className?: string;

  eyebrow?: string;
  title?: string;
  description?: string;
  caption?: string;

  elapsedMs?: number;
  isRunning?: boolean;
  summary?: LiveProjectAggregate | null;

  density?: LiveSceneDensity;
  interactionMode?: LiveInteractionMode;
  spotlightTitle?: string | null;

  rightSlot?: ReactNode;
  footerSlot?: ReactNode;

  accentColor?: string;
  accentGlowColor?: string;
}>;

type HeaderCssVariables = CSSProperties & {
  "--live-header-accent"?: string;
  "--live-header-accent-glow"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function formatElapsedMs(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function getDensityLabel(density: LiveSceneDensity): string {
  switch (density) {
    case "calm":
      return "Calmo";
    case "dense":
      return "Denso";
    case "balanced":
    default:
      return "Balanceado";
  }
}

function renderStatPill(
  label: string,
  value: string | number,
  accentColor?: string,
): ReactNode {
  return (
    <div
      key={label}
      style={{
        display: "grid",
        gap: "4px",
        minWidth: "136px",
        padding: "12px 14px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012)), rgba(9,13,18,0.74)",
        boxShadow:
          accentColor != null
            ? `0 10px 24px rgba(0,0,0,0.18), inset 0 0 0 1px ${accentColor}18`
            : "0 10px 24px rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span
        style={{
          fontSize: "0.64rem",
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: "0.94rem",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default function LiveSectionHeader({
  className,
  eyebrow = "Ao vivo",
  title = "Operação em tempo real",
  description = "Um radar editorial para visualizar entregas, projetos ativos, monitoramento contínuo e sinais de evolução da minha atuação.",
  caption,
  elapsedMs,
  isRunning,
  summary,
  density = LIVE_DEFAULT_SCENE_CONFIG.density,
  interactionMode = LIVE_DEFAULT_SCENE_CONFIG.interactionMode,
  spotlightTitle,
  rightSlot,
  footerSlot,
  accentColor = "rgba(96, 165, 250, 0.88)",
  accentGlowColor = "rgba(96, 165, 250, 0.22)",
}: LiveSectionHeaderProps) {
  const metrics = useLiveMetrics();

  const resolvedElapsedMs = elapsedMs ?? metrics.elapsedMs;
  const resolvedIsRunning = isRunning ?? metrics.isRunning;
  const resolvedSummary = summary ?? metrics.summary;

  const style = useMemo<HeaderCssVariables>(() => {
    return {
      "--live-header-accent": accentColor,
      "--live-header-accent-glow": accentGlowColor,
      position: "relative",
      display: "grid",
      gap: "clamp(18px, 2vw, 24px)",
      width: "100%",
      padding: "clamp(18px, 2vw, 28px)",
      borderRadius: "28px",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.012)), linear-gradient(180deg, rgba(9,13,18,0.9), rgba(6,8,12,0.96))",
      boxShadow: `0 22px 54px rgba(0,0,0,0.24), 0 0 0 1px ${accentGlowColor}`,
      overflow: "hidden",
      isolation: "isolate",
    };
  }, [accentColor, accentGlowColor]);

  const headerPills = [
    renderStatPill("uptime", formatElapsedMs(resolvedElapsedMs), accentColor),
    renderStatPill(
      "estado",
      resolvedIsRunning ? "Simulação ativa" : "Pausado",
      accentColor,
    ),
    renderStatPill("densidade", getDensityLabel(density), accentColor),
    renderStatPill(
      "interação",
      LIVE_INTERACTION_LABELS[interactionMode],
      accentColor,
    ),
  ];

  const footerPills = [
    renderStatPill("projetos", resolvedSummary.totalProjects, accentColor),
    renderStatPill("ativos", resolvedSummary.activeProjects, accentColor),
    renderStatPill("entregues", resolvedSummary.deliveredProjects, accentColor),
    renderStatPill(
      "saúde média",
      `${Math.round(resolvedSummary.averageHealthScore)}%`,
      accentColor,
    ),
  ];

  return (
    <header
      className={joinClassNames(className)}
      style={style}
      aria-label="Cabeçalho da seção ao vivo"
      data-live-section-header="true"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-24% auto auto -12%",
          width: "36%",
          aspectRatio: "1 / 1",
          borderRadius: "999px",
          background: `radial-gradient(circle, ${accentGlowColor} 0%, transparent 70%)`,
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.9fr)",
          gap: "clamp(18px, 2vw, 26px)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: "14px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              width: "fit-content",
              minHeight: "34px",
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: resolvedIsRunning
                  ? "rgba(248, 113, 113, 0.96)"
                  : "rgba(148, 163, 184, 0.92)",
                boxShadow: resolvedIsRunning
                  ? "0 0 18px rgba(248, 113, 113, 0.42)"
                  : "none",
              }}
            />

            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.84)",
              }}
            >
              {eyebrow}
            </span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 3vw, 3.2rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.055em",
                color: "rgba(255,255,255,0.96)",
                maxWidth: "18ch",
              }}
            >
              {title}
            </h2>

            <p
              style={{
                margin: 0,
                maxWidth: "70ch",
                fontSize: "0.98rem",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {description}
            </p>

            {caption ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  lineHeight: 1.6,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.48)",
                }}
              >
                {caption}
              </p>
            ) : null}
          </div>
        </div>

        <aside
          style={{
            display: "grid",
            gap: "14px",
            alignContent: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "10px",
              padding: "16px",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.032), rgba(255,255,255,0.012)), rgba(9,13,18,0.72)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            }}
          >
            <span
              style={{
                fontSize: "0.64rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              spotlight
            </span>

            <strong
              style={{
                fontSize: "1rem",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {spotlightTitle ?? "Nenhum projeto em destaque"}
            </strong>

            <span
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.62)",
              }}
            >
              {resolvedIsRunning
                ? "O painel permanece vivo para reforçar percepção de fluxo, volume e acompanhamento contínuo."
                : "Quando pausado, o cabeçalho continua servindo como resumo executivo da cena."}
            </span>
          </div>

          {rightSlot}
        </aside>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {headerPills}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {footerPills}
      </div>

      {footerSlot ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          {footerSlot}
        </div>
      ) : null}
    </header>
  );
}
