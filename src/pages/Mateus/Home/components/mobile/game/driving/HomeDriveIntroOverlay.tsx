import React from "react";

import type { HomeDriveRuntimeState } from "./HomeDriveGame";

export type HomeDriveIntroOverlayProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  onStart: () => void;
  onClose?: () => void;
  className?: string;
}>;

type IntroGalleryItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  alt: string;
}>;

const INTRO_GALLERY_ITEMS: readonly IntroGalleryItem[] = [
  {
    id: "fortaleza-drive-01",
    title: "Beira Mar",
    subtitle: "Orla principal",
    imageSrc: "/images/fortaleza/intro/fortaleza-drive-01.png",
    alt: "Vista horizontal da Beira Mar em Fortaleza",
  },
  {
    id: "fortaleza-drive-02",
    title: "Praia de Iracema",
    subtitle: "Faixa cultural",
    imageSrc: "/images/fortaleza/intro/fortaleza-drive-02.png",
    alt: "Vista horizontal da Praia de Iracema em Fortaleza",
  },
  {
    id: "fortaleza-drive-03",
    title: "Centro",
    subtitle: "Miolo urbano",
    imageSrc: "/images/fortaleza/intro/fortaleza-drive-03.png",
    alt: "Vista horizontal do Centro de Fortaleza",
  },
  {
    id: "fortaleza-drive-04",
    title: "Castelão",
    subtitle: "Polo final",
    imageSrc: "/images/fortaleza/intro/fortaleza-drive-04.png",
    alt: "Vista horizontal da Arena Castelão em Fortaleza",
  },
] as const;

const MOBILE_NAVBAR_CLEARANCE = "clamp(54px, 8vh, 72px)";

function createActionButtonStyle(
  variant: "primary" | "secondary" = "secondary",
): React.CSSProperties {
  const isPrimary = variant === "primary";

  return {
    width: "100%",
    minHeight: 54,
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

function createHeaderPlayButtonStyle(): React.CSSProperties {
  return {
    width: 84,
    minWidth: 84,
    height: 84,
    minHeight: 84,
    padding: 0,
    border: "1px solid rgba(225, 187, 118, 0.34)",
    borderRadius: 22,
    background:
      "linear-gradient(180deg, rgba(203,154,82,0.34), rgba(92,58,18,0.88))",
    color: "#f5efe3",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    boxShadow:
      "0 18px 32px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.16)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    lineHeight: 1.05,
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    cursor: "pointer",
    flexShrink: 0,
  };
}

export default function HomeDriveIntroOverlay({
  runtime,
  onStart,
  onClose,
  className,
}: HomeDriveIntroOverlayProps) {
  if (runtime.phase !== "ready") {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 39,
        display: "grid",
        justifyItems: "center",
        alignItems: "start",
        paddingTop: `calc(max(18px, env(safe-area-inset-top)) + ${MOBILE_NAVBAR_CLEARANCE})`,
        paddingRight: "max(16px, env(safe-area-inset-right))",
        paddingBottom: "max(18px, env(safe-area-inset-bottom))",
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        background:
          "linear-gradient(180deg, rgba(2,4,8,0.34), rgba(4,6,10,0.58) 32%, rgba(4,4,6,0.8) 100%)",
        backdropFilter: "blur(10px)",
        boxSizing: "border-box",
      }}
      data-home-drive-overlay="intro"
    >
      <div
        style={{
          width: "min(100%, 440px)",
          maxHeight: `calc(100dvh - max(18px, env(safe-area-inset-bottom)) - max(16px, env(safe-area-inset-right)) - ${MOBILE_NAVBAR_CLEARANCE} - 18px)`,
          overflow: "hidden auto",
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(8,13,21,0.9), rgba(7,8,11,0.98) 74%)",
          boxShadow:
            "0 28px 60px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "20px 18px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(circle at 50% 0%, rgba(228,172,94,0.24), transparent 48%), linear-gradient(180deg, rgba(15,24,37,0.92), rgba(7,8,11,0.2))",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "start",
              gap: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                  lineHeight: 1.02,
                  letterSpacing: "-0.05em",
                  color: "#f7f2e8",
                  textWrap: "balance",
                }}
              >
                Dirija pela terra,
                <br />
                minha terra natal
              </h2>
            </div>

            <button
              type="button"
              onClick={onStart}
              style={createHeaderPlayButtonStyle()}
              aria-label="Jogar"
            >
              Jogar
            </button>
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
              gap: 10,
            }}
          >
            {INTRO_GALLERY_ITEMS.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  boxShadow:
                    "0 14px 28px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, rgba(18,24,34,0.96), rgba(10,12,16,1))",
                  }}
                >
                  <img
                    src={item.imageSrc}
                    alt={item.alt}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    loading="eager"
                    draggable={false}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 36%, rgba(0,0,0,0.64) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: 12,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 16,
                        lineHeight: 1.1,
                        letterSpacing: "-0.03em",
                        color: "#f7f2e8",
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        fontSize: 11,
                        lineHeight: 1.45,
                        color: "rgba(247,242,232,0.82)",
                      }}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onStart}
              style={createActionButtonStyle("primary")}
            >
              Start drive
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
