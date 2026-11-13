import { localizeLabel } from '@/i18n/labels';
import type * as React from "react";
import msgIcon from "../../assets/Mateus/msgIcon.png";
import mateusChatAvatar from "../../assets/Mateus/mateus-chat-avatar-v2.webp";
import lagArthurSupport from "../../assets/Mateus/lag-arthur-support-wig-suit-v2.webp";
import lagArthurChat from "../../assets/Mateus/lag-arthur-chat-blank-eyes-closed-mouth-v3.webp";
import lagArthurIris from "../../assets/Mateus/lag-arthur-iris-anime-handpainted-v9.webp";

import styles from "./FloatingChat.module.css";
import type { MascotReaction } from "./FloatingChat.helpers";

type TriggerAvatarItem =
  | {
      type: "image";
      src: string;
      alt: string;
    }
  | {
      type: "more";
      label: string;
      ariaLabel: string;
    };

// O lagarto (Lag Arthur) em cima do botão do chat está escondido; sem ele o
// botão abre o chat direto e os efeitos de olhar/fuga não rodam.
const SHOW_CHAT_MASCOT = false;

type FloatingChatTriggerProps = {
  handleTriggerClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isMobile: boolean;
  isHomeSectionActive: boolean;
  scale: (value: number) => number;
  mascotRef: React.RefObject<HTMLSpanElement | null>;
  largeIrisRef: React.RefObject<HTMLImageElement | null>;
  smallIrisRef: React.RefObject<HTMLImageElement | null>;
  mascotReaction: MascotReaction;
  phrases: string[];
  currentPhraseIndex: number;
};

// Botão flutuante que abre o chat (fechado).
export function FloatingChatTrigger({
  handleTriggerClick,
  isMobile,
  isHomeSectionActive,
  scale,
  mascotRef,
  largeIrisRef,
  smallIrisRef,
  mascotReaction,
  phrases,
  currentPhraseIndex,
}: FloatingChatTriggerProps) {
  const triggerItems: TriggerAvatarItem[] = [
    {
      type: "image",
      src: lagArthurSupport,
      alt: "Lag Arthur, assistente da Cabraiz",
    },
    {
      type: "image",
      src: mateusChatAvatar,
      alt: "Mateus Cabral",
    },
    {
      type: "more",
      label: "...",
      ariaLabel: "Mais contatos",
    },
  ];

  return (
        <button
          onClick={handleTriggerClick}
          className={styles.chatTrigger}
          data-agent-piece=""
          data-mobile={isMobile ? "true" : "false"}
          data-home-active={isHomeSectionActive ? "true" : "false"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "flex-start",
            gap: isMobile ? 0 : `${scale(0.55)}rem`,
            background: "rgba(33, 35, 40, 0.92)",
            color: "#fff",
            border: "none",
            padding: isMobile ? `${scale(1)}rem` : "16px 20px",
            borderRadius: "50px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontWeight: "500",
            fontSize: `${scale(1.1)}rem`,
            cursor: "pointer",
            width: isMobile ? "60px" : "auto",
            height: isMobile ? "60px" : "auto",
            minWidth: "unset",
            maxWidth: isMobile ? "60px" : "none",
          }}
          aria-label={localizeLabel("Abrir chat")}
        >
          {SHOW_CHAT_MASCOT && (
            <span
              ref={mascotRef}
              className={styles.mascot}
              data-mascot-reaction={mascotReaction}
              aria-hidden="true"
            >
              <img
                className={styles.mascotImage}
                src={lagArthurChat}
                alt={localizeLabel("")}
                draggable={false}
              />
              <img
                ref={largeIrisRef}
                className={`${styles.iris} ${styles.largeIris}`}
                src={lagArthurIris}
                alt={localizeLabel("")}
                aria-hidden="true"
                draggable={false}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
              />
              <img
                ref={smallIrisRef}
                className={`${styles.iris} ${styles.smallIris}`}
                src={lagArthurIris}
                alt={localizeLabel("")}
                aria-hidden="true"
                draggable={false}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
              />
            </span>
          )}

          {!isMobile ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${scale(0.65)}rem`,
                  minWidth: 0,
                  flex: "0 1 auto",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={msgIcon}
                    alt={localizeLabel("Mensagem")}
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: "contain",
                      filter: "invert(1)",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    3
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    fontFamily:
                      "Khula, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                    fontWeight: 600,
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {localizeLabel(phrases[currentPhraseIndex])}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  marginLeft: `${scale(0.9)}rem`,
                  paddingRight: "2px",
                }}
              >
                {triggerItems.map((item, index) => {
                  const commonStyle: React.CSSProperties = {
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(33, 35, 40, 1)",
                    marginLeft: index === 0 ? "0" : "-10px",
                    zIndex: triggerItems.length - index,
                    backgroundColor: "#000",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
                    flexShrink: 0,
                  };

                  if (item.type === "image") {
                    return (
                      <div
                        key={item.alt}
                        style={commonStyle}
                      >
                        <img
                          src={item.src}
                          alt={localizeLabel(item.alt)}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.ariaLabel}
                      aria-label={localizeLabel(item.ariaLabel)}
                      title={localizeLabel(item.ariaLabel)}
                      style={{
                        ...commonStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(180deg, rgba(56,58,64,0.98) 0%, rgba(28,30,34,1) 100%)",
                        color: "rgba(255,255,255,0.92)",
                        fontSize: "15px",
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          transform: "translateY(-1px)",
                        }}
                      >
                        {localizeLabel(item.label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={msgIcon}
                alt={localizeLabel("Mensagem")}
                style={{
                  width: 24,
                  height: 24,
                  objectFit: "contain",
                  filter: "invert(1)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                3
              </div>
            </div>
          )}
        </button>
  );
}
