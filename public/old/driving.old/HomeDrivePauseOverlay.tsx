import React from "react";

import type { HomeDriveRuntimeState } from "./HomeDriveGame";

export type HomeDrivePauseOverlayProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  onResume: () => void;
  onReset: () => void;
  onClose?: () => void;
  className?: string;
}>;

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return "0 m";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function createActionButtonStyle(
  variant: "primary" | "secondary" = "secondary",
): React.CSSProperties {
  const isPrimary = variant === "primary";

  return {
    width: "100%",
    minHeight: 52,
    padding: "0 18px",
    border: `1px solid ${
      isPrimary ? "rgba(225, 187, 118, 0.38)" : "rgba(255,255,255,0.14)"
    }`,
    borderRadius: 18,
    background: isPrimary
      ? "linear-gradient(180deg, rgba(203,154,82,0.34), rgba(92,58,18,0.88))"
      : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(12,12,15,0.9))",
    color: "#f5efe3",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    boxShadow: isPrimary
      ? "0 18px 32px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.16)"
      : "0 14px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
    display: "grid",
    placeItems: "center",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    cursor: "pointer",
  };
}

export default function HomeDrivePauseOverlay({
  runtime,
  onResume,
  onReset,
  onClose,
  className,
}: HomeDrivePauseOverlayProps) {
  if (runtime.phase !== "paused") {
    return null;
  }

  const routePercent = Math.round(runtime.routeProgress * 100);
  const currentLandmark = runtime.currentLandmark?.label ?? "Saída da orla";
  const nextLandmark = runtime.nextLandmark?.label ?? "Circuito completo";
  const nextLandmarkDistance = runtime.nextLandmark
    ? runtime.nextLandmark.atMeter - runtime.traveledMeters
    : 0;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: "grid",
        placeItems: "center",
        padding:
          "max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        background:
          "linear-gradient(180deg, rgba(3,4,7,0.58), rgba(5,6,10,0.78) 32%, rgba(4,4,6,0.9) 100%)",
        backdropFilter: "blur(14px)",
        boxSizing: "border-box",
      }}
      data-home-drive-overlay="pause"
    >
      <div
        style={{
          width: "min(100%, 420px)",
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(10,12,18,0.92), rgba(7,8,11,0.98))",
          boxShadow:
            "0 26px 60px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(208,154,78,0.18), rgba(208,154,78,0.03))",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "baseline",
            }}
          >
            <strong
              style={{
                fontSize: 18,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#f7f2e8",
              }}
            >
              Drive paused
            </strong>

            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#d9b06b",
              }}
            >
              Fortaleza
            </span>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              lineHeight: 1.55,
              color: "rgba(247,242,232,0.8)",
            }}
          >
            Você parou no trecho de <strong>{runtime.districtLabel}</strong>.
          </div>
        </div>

        <div
          style={{
            padding: 18,
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div
              style={{
                padding: "14px 12px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                  marginBottom: 6,
                }}
              >
                Speed
              </div>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#f7f2e8",
                }}
              >
                {Math.round(runtime.speedKmh)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                }}
              >
                km/h
              </div>
            </div>

            <div
              style={{
                padding: "14px 12px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                  marginBottom: 6,
                }}
              >
                Gear
              </div>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#ddb77a",
                }}
              >
                {runtime.gearLabel}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                }}
              >
                marcha
              </div>
            </div>

            <div
              style={{
                padding: "14px 12px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                  marginBottom: 6,
                }}
              >
                Route
              </div>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#f7f2e8",
                }}
              >
                {routePercent}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(247,242,232,0.58)",
                }}
              >
                %
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(247,242,232,0.62)",
              }}
            >
              <span>Rota</span>
              <span>{routePercent}%</span>
            </div>

            <div
              style={{
                position: "relative",
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${runtime.routeProgress * 100}%`,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, rgba(196,147,68,0.92), rgba(255,214,134,0.98))",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                display: "grid",
                gap: 6,
                fontSize: 12,
                color: "rgba(247,242,232,0.82)",
              }}
            >
              <div>
                Rodado: <strong>{formatDistance(runtime.traveledMeters)}</strong>
              </div>
              <div>
                Último marco: <strong>{currentLandmark}</strong>
              </div>
              <div>
                Próximo ponto: <strong>{nextLandmark}</strong>
                {runtime.nextLandmark ? ` · ${formatDistance(nextLandmarkDistance)}` : ""}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onResume}
              style={createActionButtonStyle("primary")}
            >
              Resume drive
            </button>

            <button
              type="button"
              onClick={onReset}
              style={createActionButtonStyle("secondary")}
            >
              Reset route
            </button>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                style={createActionButtonStyle("secondary")}
              >
                Exit
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
