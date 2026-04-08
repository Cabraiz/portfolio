// src/pages/Mateus/Live/ui/scene/LiveAmbientGrid.tsx

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { LIVE_SCENE_DENSITY_WEIGHTS } from "../../domain/live.constants";
import type { LiveSceneDensity } from "../../domain/live.types";

type AmbientPointer = Readonly<{
  normalizedX: number;
  normalizedY: number;
  distanceFromCenter?: number;
}>;

export type LiveAmbientGridProps = Readonly<{
  className?: string;
  children?: ReactNode;

  density?: LiveSceneDensity;
  pointer?: AmbientPointer | null;

  columns?: number;
  rows?: number;
  pulses?: number;

  minHeight?: CSSProperties["minHeight"];
  borderRadius?: CSSProperties["borderRadius"];

  accentColor?: string;
  secondaryAccentColor?: string;
  tertiaryAccentColor?: string;
  lineColor?: string;
  axisColor?: string;
  textColor?: string;

  showAxes?: boolean;
  showScanlines?: boolean;
  showNoise?: boolean;
  showPulses?: boolean;
  showPointerGlow?: boolean;

  pointerGlowRadius?: number;
}>;

type GridCssVariables = CSSProperties & {
  "--live-grid-accent"?: string;
  "--live-grid-accent-secondary"?: string;
  "--live-grid-accent-tertiary"?: string;
  "--live-grid-line"?: string;
  "--live-grid-axis"?: string;
  "--live-grid-text"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildSequence(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function resolveColumns(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 10;
    case "dense":
      return 16;
    case "balanced":
    default:
      return 13;
  }
}

function resolveRows(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 6;
    case "dense":
      return 10;
    case "balanced":
    default:
      return 8;
  }
}

function resolvePulseCount(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit >= 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 2;
    case "dense":
      return 5;
    case "balanced":
    default:
      return 3;
  }
}

export default function LiveAmbientGrid({
  className,
  children,
  density = "balanced",
  pointer,
  columns,
  rows,
  pulses,
  minHeight = "clamp(320px, 42vw, 560px)",
  borderRadius = "28px",
  accentColor = "rgba(96, 165, 250, 0.86)",
  secondaryAccentColor = "rgba(52, 211, 153, 0.74)",
  tertiaryAccentColor = "rgba(167, 139, 250, 0.72)",
  lineColor = "rgba(255, 255, 255, 0.09)",
  axisColor = "rgba(255, 255, 255, 0.18)",
  textColor = "rgba(255, 255, 255, 0.62)",
  showAxes = true,
  showScanlines = true,
  showNoise = true,
  showPulses = true,
  showPointerGlow = true,
  pointerGlowRadius = 220,
}: LiveAmbientGridProps) {
  const densityWeight = LIVE_SCENE_DENSITY_WEIGHTS[density];

  const resolvedColumns = resolveColumns(density, columns);
  const resolvedRows = resolveRows(density, rows);
  const resolvedPulses = resolvePulseCount(density, pulses);

  const verticalLines = useMemo(() => {
    return buildSequence(resolvedColumns + 1);
  }, [resolvedColumns]);

  const horizontalLines = useMemo(() => {
    return buildSequence(resolvedRows + 1);
  }, [resolvedRows]);

  const pulseItems = useMemo(() => {
    return buildSequence(resolvedPulses);
  }, [resolvedPulses]);

  const pointerX = clamp(pointer?.normalizedX ?? 0.5, 0, 1);
  const pointerY = clamp(pointer?.normalizedY ?? 0.5, 0, 1);
  const pointerDistance = clamp(pointer?.distanceFromCenter ?? 0, 0, 1.5);

  const rootStyle = useMemo<GridCssVariables>(() => {
    return {
      "--live-grid-accent": accentColor,
      "--live-grid-accent-secondary": secondaryAccentColor,
      "--live-grid-accent-tertiary": tertiaryAccentColor,
      "--live-grid-line": lineColor,
      "--live-grid-axis": axisColor,
      "--live-grid-text": textColor,
      position: "relative",
      minHeight,
      width: "100%",
      borderRadius,
      overflow: "hidden",
      isolation: "isolate",
      border: `1px solid ${lineColor}`,
      background: `
        radial-gradient(
          circle at ${Math.round(pointerX * 100)}% ${Math.round(pointerY * 100)}%,
          rgba(255,255,255,0.04) 0%,
          transparent 26%
        ),
        linear-gradient(180deg, rgba(8, 12, 18, 0.88), rgba(5, 7, 10, 0.95))
      `,
      boxShadow:
        "0 24px 60px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.03)",
    };
  }, [
    accentColor,
    axisColor,
    borderRadius,
    lineColor,
    minHeight,
    pointerX,
    pointerY,
    secondaryAccentColor,
    tertiaryAccentColor,
    textColor,
  ]);

  const pointerGlowSize = Math.round(pointerGlowRadius * densityWeight);

  return (
    <div
      className={joinClassNames(className)}
      style={rootStyle}
      data-live-ambient-grid="true"
      data-live-density={density}
      data-live-parallax="0.3"
      aria-hidden="true"
    >
      {showNoise ? (
        <div
          data-live-parallax="0.12"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            mixBlendMode: "screen",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {showPointerGlow ? (
        <div
          data-live-parallax="0.85"
          style={{
            position: "absolute",
            left: `${pointerX * 100}%`,
            top: `${pointerY * 100}%`,
            width: `${pointerGlowSize}px`,
            height: `${pointerGlowSize}px`,
            borderRadius: "999px",
            transform: "translate(-50%, -50%)",
            background: `
              radial-gradient(circle,
                rgba(96,165,250,${0.18 + (1 - Math.min(pointerDistance, 1)) * 0.08}) 0%,
                rgba(52,211,153,0.07) 28%,
                rgba(167,139,250,0.04) 46%,
                transparent 74%
              )
            `,
            filter: "blur(18px)",
            opacity: 1,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : null}

      <svg
        viewBox={`0 0 ${resolvedColumns} ${resolvedRows}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.88,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient id="live-grid-line-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lineColor} />
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
          </linearGradient>

          <linearGradient id="live-grid-axis-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor={axisColor} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {verticalLines.map((line) => (
          <line
            key={`v-${line}`}
            x1={line}
            y1={0}
            x2={line}
            y2={resolvedRows}
            stroke="url(#live-grid-line-gradient)"
            strokeWidth={line === Math.floor(resolvedColumns / 2) ? 0.04 : 0.022}
            vectorEffect="non-scaling-stroke"
            opacity={line === Math.floor(resolvedColumns / 2) ? 0.92 : 0.74}
          />
        ))}

        {horizontalLines.map((line) => (
          <line
            key={`h-${line}`}
            x1={0}
            y1={line}
            x2={resolvedColumns}
            y2={line}
            stroke="url(#live-grid-line-gradient)"
            strokeWidth={line === Math.floor(resolvedRows / 2) ? 0.04 : 0.022}
            vectorEffect="non-scaling-stroke"
            opacity={line === Math.floor(resolvedRows / 2) ? 0.92 : 0.74}
          />
        ))}

        {showAxes ? (
          <>
            <line
              x1={resolvedColumns / 2}
              y1={0}
              x2={resolvedColumns / 2}
              y2={resolvedRows}
              stroke="url(#live-grid-axis-gradient)"
              strokeWidth={0.06}
              vectorEffect="non-scaling-stroke"
            />

            <line
              x1={0}
              y1={resolvedRows / 2}
              x2={resolvedColumns}
              y2={resolvedRows / 2}
              stroke="url(#live-grid-axis-gradient)"
              strokeWidth={0.06}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>

      {showScanlines ? (
        <div
          data-live-parallax="0.2"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            opacity: 0.15,
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0) 1px)",
            backgroundSize: "100% 12px",
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      {showPulses
        ? pulseItems.map((pulseIndex) => {
            const baseX = ((pulseIndex + 1) / (resolvedPulses + 1)) * 100;
            const baseY =
              pulseIndex % 2 === 0
                ? 28 + pulseIndex * 8
                : 64 - pulseIndex * 6;

            const size = 84 + pulseIndex * 34;

            const color =
              pulseIndex % 3 === 0
                ? accentColor
                : pulseIndex % 3 === 1
                  ? secondaryAccentColor
                  : tertiaryAccentColor;

            return (
              <div
                key={`pulse-${pulseIndex}`}
                data-live-pulse="true"
                data-live-parallax={String(0.4 + pulseIndex * 0.18)}
                style={{
                  position: "absolute",
                  left: `${baseX}%`,
                  top: `${clamp(baseY / 100, 0.12, 0.88) * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "999px",
                  transform: "translate(-50%, -50%)",
                  border: `1px solid ${color}`,
                  boxShadow: `0 0 18px ${color}`,
                  opacity: 0.18 - pulseIndex * 0.018,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            );
          })
        : null}

      <div
        style={{
          position: "absolute",
          left: "18px",
          bottom: "18px",
          zIndex: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          minHeight: "30px",
          padding: "7px 10px",
          borderRadius: "999px",
          border: `1px solid ${lineColor}`,
          background: "rgba(255,255,255,0.03)",
          color: textColor,
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          backdropFilter: "blur(10px)",
          pointerEvents: "none",
        }}
      >
        grid {resolvedColumns}×{resolvedRows} · density {density}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 4,
          width: "100%",
          height: "100%",
          minHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}
