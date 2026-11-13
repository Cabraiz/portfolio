// Peças visuais do campo do cursor: retícula e cabeçalho

export function LiveCursorReticle({
  reticleLeft,
  reticleTop,
  isPointerInside,
  isActive,
  accentColor,
  accentGlowColor,
}: Readonly<{
  reticleLeft: string;
  reticleTop: string;
  isPointerInside: boolean;
  isActive: boolean;
  accentColor: string;
  accentGlowColor: string;
}>) {
  return (
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
  );
}

export function LiveCursorFieldHeader({
  label,
  hint,
  frameColor,
  textColor,
  showCoordinates,
  metaLabel,
  interactionLabel,
  offsetX,
  offsetY,
  scale,
}: Readonly<{
  label: string;
  hint: string;
  frameColor: string;
  textColor: string;
  showCoordinates: boolean;
  metaLabel: string;
  interactionLabel: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}>) {
  return (
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
  );
}
