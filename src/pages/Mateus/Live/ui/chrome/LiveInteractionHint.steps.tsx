import type { LiveInteractionMode } from "../../domain/live.types";
import type { InteractionNarrative } from "./LiveInteractionHint.narrative";

// Bloco "leitura recomendada" com os passos do modo atual
export function LiveInteractionHintSteps({
  narrative,
  interactionMode,
  compact,
  accentColor,
}: Readonly<{
  narrative: InteractionNarrative;
  interactionMode: LiveInteractionMode;
  compact: boolean;
  accentColor: string;
}>) {
  return (
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
  );
}
