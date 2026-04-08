// src/pages/Mateus/Live/ui/chrome/LiveInteractionHint.tsx

import { useMemo, type CSSProperties } from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_INTERACTION_LABELS,
} from "../../domain/live.constants";
import type { LiveInteractionMode } from "../../domain/live.types";

export type LiveInteractionHintProps = Readonly<{
  className?: string;
  title?: string;
  description?: string;

  interactionMode?: LiveInteractionMode;
  isRunning?: boolean;

  selectedProjectName?: string | null;
  activeMetricLabel?: string | null;

  compact?: boolean;
  showKeyboardHint?: boolean;
  showModeRail?: boolean;

  accentColor?: string;
}>;

type HintCssVariables = CSSProperties & {
  "--live-hint-accent"?: string;
};

type InteractionNarrative = Readonly<{
  label: string;
  heading: string;
  description: string;
  steps: readonly string[];
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function getNarrative(mode: LiveInteractionMode): InteractionNarrative {
  switch (mode) {
    case "hover":
      return {
        label: LIVE_INTERACTION_LABELS.hover,
        heading: "Leitura por aproximação",
        description:
          "A cena responde quando o cursor se aproxima, destacando sinais e abrindo foco sem exigir clique.",
        steps: [
          "Passe o cursor pelos nós para revelar prioridade, estado e contexto.",
          "Use o placar para cruzar volume com o radar visual.",
          "A leitura fica mais limpa quando o foco se concentra em um cluster.",
        ],
      };

    case "drag":
      return {
        label: LIVE_INTERACTION_LABELS.drag,
        heading: "Exploração manual",
        description:
          "O visitante pode empurrar o campo visual para investigar relações de forma mais tátil.",
        steps: [
          "Arraste para deslocar o plano e tensionar a leitura espacial.",
          "Pare sobre um ponto importante para estabilizar a observação.",
          "Combine com o placar para validar o que está em primeiro plano.",
        ],
      };

    case "spotlight":
      return {
        label: LIVE_INTERACTION_LABELS.spotlight,
        heading: "Foco editorial",
        description:
          "Cada aproximação funciona como um spotlight, isolando o que merece atenção no momento.",
        steps: [
          "Use o cursor para acender um nó e reduzir ruído periférico.",
          "Leia o destaque atual como um recorte editorial do radar.",
          "Saia do alvo para devolver equilíbrio à cena.",
        ],
      };

    case "magnetic":
    default:
      return {
        label: LIVE_INTERACTION_LABELS.magnetic,
        heading: "Campo magnético",
        description:
          "Os elementos reagem ao cursor como um painel vivo, com atração sutil e sensação de sistema em operação.",
        steps: [
          "Mova o mouse lentamente para perceber a atração entre cursor e nós.",
          "Aproxime-se dos pontos mais fortes para abrir detalhes do fluxo.",
          "Use o painel como uma vitrine operacional, não como um gráfico estático.",
        ],
      };
  }
}

export default function LiveInteractionHint({
  className,
  title = "Como ler e interagir",
  description = "Uma camada curta de orientação para transformar o radar ao vivo em experiência, e não só em decoração.",
  interactionMode = LIVE_DEFAULT_SCENE_CONFIG.interactionMode,
  isRunning,
  selectedProjectName = null,
  activeMetricLabel = null,
  compact = false,
  showKeyboardHint = true,
  showModeRail = true,
  accentColor = "rgba(96, 165, 250, 0.9)",
}: LiveInteractionHintProps) {
  const metrics = useLiveMetrics();

  const resolvedIsRunning = isRunning ?? metrics.isRunning;
  const resolvedMetricLabel =
    activeMetricLabel
    ?? metrics.heroMetrics.find((metric) => metric.interactive)?.label
    ?? metrics.heroMetrics[0]?.label
    ?? null;

  const narrative = useMemo(() => getNarrative(interactionMode), [interactionMode]);

  const style = useMemo<HintCssVariables>(() => {
    return {
      "--live-hint-accent": accentColor,
      position: "relative",
      display: "grid",
      gap: compact ? "14px" : "18px",
      width: "100%",
      padding: compact ? "16px" : "20px",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012)), rgba(8, 12, 18, 0.84)",
      boxShadow: "0 16px 42px rgba(0,0,0,0.2)",
      overflow: "hidden",
      isolation: "isolate",
    };
  }, [accentColor, compact]);

  return (
    <aside
      className={joinClassNames(className)}
      style={style}
      aria-label="Dicas de interação da seção ao vivo"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "0 0 auto auto",
          width: "220px",
          height: "220px",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 72%)`,
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: "8px",
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
          interaction
        </span>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "6px",
              maxWidth: "62ch",
            }}
          >
            <strong
              style={{
                fontSize: compact ? "0.98rem" : "1.06rem",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {title}
            </strong>

            <span
              style={{
                fontSize: compact ? "0.78rem" : "0.82rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.62)",
              }}
            >
              {description}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: resolvedIsRunning
                  ? `1px solid ${accentColor}30`
                  : "1px solid rgba(255,255,255,0.08)",
                background: resolvedIsRunning
                  ? `${accentColor}12`
                  : "rgba(255,255,255,0.03)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {resolvedIsRunning ? "Painel vivo" : "Painel pausado"}
            </span>

            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.025)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.66)",
              }}
            >
              {narrative.label}
            </span>
          </div>
        </div>
      </header>

      {showModeRail ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
          aria-label="Modos de interação disponíveis"
        >
          {(Object.entries(LIVE_INTERACTION_LABELS) as Array<
            readonly [LiveInteractionMode, string]
          >).map(([mode, label]) => {
            const isActive = mode === interactionMode;

            return (
              <span
                key={mode}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: isActive
                    ? `1px solid ${accentColor}34`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? `${accentColor}12` : "rgba(255,255,255,0.02)",
                  fontSize: "0.72rem",
                  fontWeight: isActive ? 800 : 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isActive
                    ? "rgba(255,255,255,0.84)"
                    : "rgba(255,255,255,0.56)",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      ) : null}

      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: "12px",
          padding: compact ? "14px" : "16px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.012)), rgba(9,13,18,0.72)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "6px",
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
            leitura recomendada
          </span>

          <strong
            style={{
              fontSize: "1rem",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {narrative.heading}
          </strong>

          <span
            style={{
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.64)",
            }}
          >
            {narrative.description}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gap: "8px",
          }}
        >
          {narrative.steps.map((step, index) => (
            <div
              key={`${interactionMode}-${index + 1}`}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: "10px",
                alignItems: "start",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  border: `1px solid ${accentColor}2f`,
                  background: `${accentColor}10`,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {index + 1}
              </span>

              <span
                style={{
                  fontSize: "0.78rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {resolvedMetricLabel ? (
            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.025)",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.64)",
              }}
            >
              Métrica viva:{" "}
              <strong style={{ color: "rgba(255,255,255,0.88)" }}>
                {resolvedMetricLabel}
              </strong>
            </span>
          ) : null}

          {selectedProjectName ? (
            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: `1px solid ${accentColor}2c`,
                background: `${accentColor}10`,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Spotlight atual:{" "}
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                {selectedProjectName}
              </strong>
            </span>
          ) : null}
        </div>

        {showKeyboardHint ? (
          <span
            style={{
              fontSize: "0.74rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.52)",
            }}
          >
            Dica: se você expuser navegação por teclado na cena, mantenha{" "}
            <strong style={{ color: "rgba(255,255,255,0.72)" }}>foco visível</strong>,{" "}
            <strong style={{ color: "rgba(255,255,255,0.72)" }}>ordem previsível</strong> e{" "}
            <strong style={{ color: "rgba(255,255,255,0.72)" }}>Escape</strong> para sair do destaque.
          </span>
        ) : null}
      </footer>
    </aside>
  );
}
