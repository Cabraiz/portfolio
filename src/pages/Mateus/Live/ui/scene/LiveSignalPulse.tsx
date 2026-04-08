// src/pages/Mateus/Live/ui/scene/LiveSignalPulse.tsx

import { type CSSProperties } from "react";

export type LiveSignalPulseProps = Readonly<{
  className?: string;
  active?: boolean;
  label?: string;
  size?: number;
  x?: number | string;
  y?: number | string;
  color?: string;
  glowColor?: string;
  durationMs?: number;
  ringCount?: number;
  opacity?: number;
  variant?: "soft" | "focus" | "radar";
  dataParallax?: number | string;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function toPosition(value: number | string | undefined, fallback: string): string {
  if (typeof value === "number") {
    return `${value}px`;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return fallback;
}

function getVariantScale(variant: LiveSignalPulseProps["variant"]): number {
  switch (variant) {
    case "focus":
      return 1;
    case "radar":
      return 1.18;
    case "soft":
    default:
      return 0.86;
  }
}

export default function LiveSignalPulse({
  className,
  active = true,
  label,
  size = 96,
  x = "50%",
  y = "50%",
  color = "rgba(96, 165, 250, 0.92)",
  glowColor = "rgba(96, 165, 250, 0.24)",
  durationMs = 2800,
  ringCount = 3,
  opacity = 1,
  variant = "focus",
  dataParallax = 0.45,
}: LiveSignalPulseProps) {
  const scaleFactor = getVariantScale(variant);
  const baseSize = Math.max(18, size) * scaleFactor;
  const left = toPosition(x, "50%");
  const top = toPosition(y, "50%");

  const rootStyle: CSSProperties = {
    position: "absolute",
    left,
    top,
    width: `${baseSize}px`,
    height: `${baseSize}px`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity: active ? opacity : 0,
    transition: "opacity 180ms ease",
    zIndex: 2,
  };

  return (
    <>
      <style>
        {`
          @keyframes live-signal-pulse-ring {
            0% {
              transform: translate(-50%, -50%) scale(0.24);
              opacity: 0.82;
            }

            72% {
              opacity: 0.18;
            }

            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }

          @keyframes live-signal-pulse-core {
            0%, 100% {
              transform: translate(-50%, -50%) scale(0.98);
              opacity: 0.92;
            }

            50% {
              transform: translate(-50%, -50%) scale(1.08);
              opacity: 1;
            }
          }
        `}
      </style>

      <div
        className={joinClassNames(className)}
        style={rootStyle}
        data-live-pulse="true"
        data-live-parallax={String(dataParallax)}
        aria-hidden="true"
      >
        {Array.from({ length: ringCount }, (_, index) => {
          const delayMs = Math.round((durationMs / Math.max(ringCount, 1)) * index);
          const ringSize = Math.round(baseSize * (0.92 + index * 0.06));

          return (
            <span
              key={`ring-${index}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${ringSize}px`,
                height: `${ringSize}px`,
                borderRadius: "999px",
                transform: "translate(-50%, -50%)",
                border: `1px solid ${color}`,
                boxShadow: `0 0 20px ${glowColor}`,
                animation: active
                  ? `live-signal-pulse-ring ${durationMs}ms ease-out ${delayMs}ms infinite`
                  : "none",
              }}
            />
          );
        })}

        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${Math.round(baseSize * 0.14)}px`,
            height: `${Math.round(baseSize * 0.14)}px`,
            minWidth: "10px",
            minHeight: "10px",
            borderRadius: "999px",
            transform: "translate(-50%, -50%)",
            background: color,
            boxShadow: `0 0 18px ${glowColor}`,
            animation: active
              ? `live-signal-pulse-core ${Math.max(1400, durationMs * 0.72)}ms ease-in-out infinite`
              : "none",
          }}
        />

        {label ? (
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "calc(100% + 12px)",
              transform: "translateX(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "28px",
              padding: "6px 10px",
              borderRadius: "999px",
              border: `1px solid ${color}`,
              background: "rgba(8, 12, 18, 0.82)",
              color: "rgba(255, 255, 255, 0.84)",
              fontSize: "0.66rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              boxShadow: `0 0 16px ${glowColor}`,
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
    </>
  );
}
