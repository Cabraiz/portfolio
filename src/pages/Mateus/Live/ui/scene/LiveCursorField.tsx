// src/pages/Mateus/Live/ui/scene/LiveCursorField.tsx

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { useLiveMagneticPointer } from "../../hooks/useLiveMagneticPointer";
import { useLiveParallaxField } from "../../hooks/useLiveParallaxField";

type PointerSnapshot = Readonly<{
  clientX: number;
  clientY: number;
  normalizedX: number;
  normalizedY: number;
  centeredX: number;
  centeredY: number;
  distance: number;
}>;

export type LiveCursorFieldProps = Readonly<{
  className?: string;
  children?: ReactNode;

  disabled?: boolean;
  enableParallax?: boolean;
  respectReducedMotion?: boolean;

  label?: string;
  hint?: string;

  minHeight?: CSSProperties["minHeight"];
  borderRadius?: CSSProperties["borderRadius"];

  maxOffsetX?: number;
  maxOffsetY?: number;
  smoothing?: number;
  scaleBoost?: number;

  parallaxSelector?: string;
  parallaxMaxTranslateX?: number;
  parallaxMaxTranslateY?: number;
  parallaxMaxRotateDeg?: number;
  parallaxSmoothing?: number;

  showReticle?: boolean;
  showCoordinates?: boolean;
  showFrameGlow?: boolean;
  showCenterPulse?: boolean;

  accentColor?: string;
  accentGlowColor?: string;
  frameColor?: string;
  textColor?: string;

  onPointerStateChange?: (pointer: PointerSnapshot) => void;
  onPointerLeaveField?: () => void;
}>;

type CursorFieldCssVariables = CSSProperties & {
  "--live-cursor-accent"?: string;
  "--live-cursor-accent-glow"?: string;
  "--live-cursor-frame"?: string;
  "--live-cursor-text"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatPercent(value: number): string {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

export default function LiveCursorField({
  className,
  children,
  disabled = false,
  enableParallax = true,
  respectReducedMotion = true,
  label = "Campo interativo",
  hint = "Mova o cursor para explorar a camada viva da seção.",
  minHeight = "clamp(320px, 42vw, 560px)",
  borderRadius = "28px",
  maxOffsetX = 16,
  maxOffsetY = 12,
  smoothing = 0.16,
  scaleBoost = 0.025,
  parallaxSelector = "[data-live-parallax]",
  parallaxMaxTranslateX = 18,
  parallaxMaxTranslateY = 12,
  parallaxMaxRotateDeg = 3,
  parallaxSmoothing = 0.16,
  showReticle = true,
  showCoordinates = true,
  showFrameGlow = true,
  showCenterPulse = true,
  accentColor = "rgba(96, 165, 250, 0.88)",
  accentGlowColor = "rgba(96, 165, 250, 0.26)",
  frameColor = "rgba(255, 255, 255, 0.12)",
  textColor = "rgba(255, 255, 255, 0.82)",
  onPointerStateChange,
  onPointerLeaveField,
}: LiveCursorFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    isActive,
    isPointerInside,
    pointer,
    offsetX,
    offsetY,
    scale,
    style: magneticStyle,
    reset,
    bind,
  } = useLiveMagneticPointer({
    containerRef,
    disabled,
    maxOffsetX,
    maxOffsetY,
    smoothing,
    scaleBoost,
    respectReducedMotion,
  });

  const { hasLayers, layerCount, refresh, reset: resetParallax } =
    useLiveParallaxField({
      containerRef,
      pointer: {
        normalizedX: pointer.normalizedX,
        normalizedY: pointer.normalizedY,
        distanceFromCenter: pointer.distance,
      },
      disabled: disabled || !enableParallax,
      selector: parallaxSelector,
      maxTranslateX: parallaxMaxTranslateX,
      maxTranslateY: parallaxMaxTranslateY,
      maxRotateDeg: parallaxMaxRotateDeg,
      smoothing: parallaxSmoothing,
      respectReducedMotion,
    });

  useEffect(() => {
    refresh();
  }, [children, refresh]);

  useEffect(() => {
    if (!isPointerInside) {
      return;
    }

    onPointerStateChange?.(pointer);
  }, [isPointerInside, onPointerStateChange, pointer]);

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    bind.onPointerEnter(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    bind.onPointerMove(event);
  };

  const handlePointerLeave = () => {
    bind.onPointerLeave();
    resetParallax();
    onPointerLeaveField?.();
  };

  const rootStyle = useMemo<CursorFieldCssVariables>(() => {
    return {
      ...magneticStyle,
      position: "relative",
      minHeight,
      borderRadius,
      overflow: "hidden",
      isolation: "isolate",
      "--live-cursor-accent": accentColor,
      "--live-cursor-accent-glow": accentGlowColor,
      "--live-cursor-frame": frameColor,
      "--live-cursor-text": textColor,
      border: `1px solid ${frameColor}`,
      background: `
        radial-gradient(circle at ${formatPercent(pointer.normalizedX)} ${formatPercent(
          pointer.normalizedY,
        )}, ${accentGlowColor} 0%, rgba(255, 255, 255, 0.02) 24%, transparent 56%),
        linear-gradient(180deg, rgba(9, 13, 18, 0.82), rgba(5, 7, 10, 0.92))
      `,
      boxShadow: showFrameGlow
        ? `0 24px 60px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 0 1px ${accentGlowColor}`
        : `0 24px 60px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04)`,
      willChange: "transform",
      userSelect: "none",
      touchAction: "none",
    };
  }, [
    accentColor,
    accentGlowColor,
    borderRadius,
    frameColor,
    magneticStyle,
    minHeight,
    pointer.normalizedX,
    pointer.normalizedY,
    showFrameGlow,
    textColor,
  ]);

  const reticleLeft = `${formatPercent(pointer.normalizedX)}`;
  const reticleTop = `${formatPercent(pointer.normalizedY)}`;

  const metaLabel = isPointerInside
    ? `${formatPercent(pointer.normalizedX)} · ${formatPercent(pointer.normalizedY)}`
    : "Centro neutro";

  const interactionLabel = isActive ? "magnetic" : "passive";

  return (
    <div
      ref={containerRef}
      className={joinClassNames(className)}
      style={rootStyle}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-live-cursor-field="true"
      data-live-interaction-mode={interactionLabel}
      data-live-has-layers={hasLayers ? "true" : "false"}
      data-live-layer-count={String(layerCount)}
      aria-label={label}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent),
            linear-gradient(180deg, rgba(255,255,255,0.02), transparent 26%)
          `,
          opacity: 0.8,
        }}
      />

      {showCenterPulse ? (
        <div
          aria-hidden="true"
          data-live-pulse="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            transform: "translate(-50%, -50%)",
            border: `1px solid ${accentColor}`,
            boxShadow: `0 0 0 10px rgba(255,255,255,0.02), 0 0 18px ${accentGlowColor}`,
            opacity: isPointerInside ? 0.32 : 0.18,
            transition: "opacity 180ms ease",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {showReticle ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: reticleLeft,
            top: reticleTop,
            width: isPointerInside ? "140px" : "108px",
            height: isPointerInside ? "140px" : "108px",
            transform: "translate(-50%, -50%)",
            borderRadius: "999px",
            border: `1px solid ${accentColor}`,
            background: `radial-gradient(circle, ${accentGlowColor} 0%, rgba(255,255,255,0.02) 34%, transparent 72%)`,
            boxShadow: `0 0 22px ${accentGlowColor}`,
            opacity: isActive ? 1 : 0.52,
            transition:
              "left 90ms linear, top 90ms linear, width 180ms ease, height 180ms ease, opacity 180ms ease",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: "50% auto auto 50%",
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              transform: "translate(-50%, -50%)",
              background: accentColor,
              boxShadow: `0 0 14px ${accentGlowColor}`,
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: "1px",
              height: "100%",
              background:
                "linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)",
              transform: "translateX(-50%)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              width: "100%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: "18px 18px auto 18px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "6px",
            maxWidth: "min(70%, 36rem)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              minHeight: "30px",
              padding: "6px 10px",
              borderRadius: "999px",
              border: `1px solid ${frameColor}`,
              background: "rgba(255,255,255,0.04)",
              color: textColor,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.66)",
              fontSize: "0.86rem",
              lineHeight: 1.55,
            }}
          >
            {hint}
          </p>
        </div>

        {showCoordinates ? (
          <div
            style={{
              display: "grid",
              gap: "6px",
              padding: "10px 12px",
              minWidth: "126px",
              borderRadius: "16px",
              border: `1px solid ${frameColor}`,
              background: "rgba(9,13,18,0.56)",
              backdropFilter: "blur(12px)",
              color: textColor,
            }}
          >
            <span
              style={{
                fontSize: "0.64rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.52)",
              }}
            >
              cursor
            </span>

            <strong
              style={{
                fontSize: "0.92rem",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {metaLabel}
            </strong>

            <span
              style={{
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.56)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {interactionLabel} · x {offsetX.toFixed(1)} · y {offsetY.toFixed(1)} · s{" "}
              {scale.toFixed(3)}
            </span>
          </div>
        ) : null}
      </div>

      <div
        data-live-cursor-content="true"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          minHeight,
        }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => {
          reset();
          resetParallax();
        }}
        style={{
          position: "absolute",
          right: "18px",
          bottom: "18px",
          zIndex: 3,
          appearance: "none",
          border: `1px solid ${frameColor}`,
          borderRadius: "999px",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.04)",
          color: textColor,
          font: "inherit",
          fontSize: "0.74rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
        aria-label="Recentralizar campo interativo"
      >
        Recentralizar
      </button>
    </div>
  );
}
