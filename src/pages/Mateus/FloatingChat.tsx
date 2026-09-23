import type * as React from "react";
import { useState, useRef, useEffect } from "react";
import msgIcon from "../../assets/Mateus/msgIcon.png";
import perfilMini from "../../assets/Mateus/perfilMini.webp";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import {
  isHomeGameRoutePath,
  isHomeGameStandaloneHost,
} from "../../App/appHostRouting";

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

type ChatMessage = {
  id: string;
  text: string;
  author: "visitor" | "mateus";
};

type ContactReply = {
  id: number;
  text: string;
};

const CHAT_CONVERSATION_STORAGE_KEY = "cabraiz-chat-conversation-id";
const CHAT_CONVERSATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTACT_API_URL =
  import.meta.env.VITE_CONTACT_API_URL?.trim() || "/api/contact";

function getOrCreateConversationId(): string {
  const conversationId = window.crypto.randomUUID();
  try {
    const storedConversationId = window.localStorage.getItem(
      CHAT_CONVERSATION_STORAGE_KEY
    );
    if (
      storedConversationId &&
      CHAT_CONVERSATION_ID_PATTERN.test(storedConversationId)
    ) {
      return storedConversationId;
    }

    window.localStorage.setItem(CHAT_CONVERSATION_STORAGE_KEY, conversationId);
  } catch {
    // A conversa continua durante esta visita quando o armazenamento é bloqueado.
  }
  return conversationId;
}

export default function FloatingChat() {
  const location = useLocation();
  const shouldHideForStandaloneGame =
    isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId] = useState(getOrCreateConversationId);
  const [sendStatus, setSendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatOpenedAtRef = useRef(Date.now());
  const replyCursorRef = useRef(0);

  const { t, i18n } = useTranslation();
  const phrases = t("floatingChat.phrases", {
    returnObjects: true,
  }) as string[];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const shouldHideForMobileHome = isMobile && location.pathname === "/home";
  const scale = (value: number) => (isMobile ? value * 0.8 : value);

  const bottomOffset = isMobile ? "30px" : "3vh";
  const rightOffset = isMobile ? "30px" : "3vw";

  const triggerItems: TriggerAvatarItem[] = [
    {
      type: "image",
      src: perfilMini,
      alt: "Mateus Cabral",
    },
    {
      type: "image",
      src: "https://i.pravatar.cc/300?img=12",
      alt: "Contato 1",
    },
    {
      type: "more",
      label: "...",
      ariaLabel: "Mais contatos",
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [phrases.length]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !messages.some((message) => message.author === "visitor")) {
      return;
    }

    let cancelled = false;
    const readReplies = async () => {
      try {
        const url = new URL(CONTACT_API_URL, window.location.origin);
        url.searchParams.set("conversationId", conversationId);
        url.searchParams.set("after", String(replyCursorRef.current));
        const response = await fetch(url);
        if (!response.ok) return;

        const payload = (await response.json()) as {
          replies?: ContactReply[];
          cursor?: number;
        };
        if (cancelled || !Array.isArray(payload.replies)) return;

        if (Number.isSafeInteger(payload.cursor)) {
          replyCursorRef.current = Math.max(
            replyCursorRef.current,
            Number(payload.cursor)
          );
        }

        setMessages((currentMessages) => {
          const knownIds = new Set(currentMessages.map((message) => message.id));
          const newReplies = payload.replies!
            .filter((reply) => !knownIds.has(`telegram-${reply.id}`))
            .map((reply) => ({
              id: `telegram-${reply.id}`,
              text: reply.text,
              author: "mateus" as const,
            }));

          return newReplies.length > 0
            ? [...currentMessages, ...newReplies]
            : currentMessages;
        });
      } catch {
        // A próxima consulta automática tenta novamente sem interromper o chat.
      }
    };

    void readReplies();
    const interval = window.setInterval(() => void readReplies(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversationId, isOpen, messages]);

  const openChat = () => {
    chatOpenedAtRef.current = Date.now();
    setSendStatus("idle");
    setIsOpen(true);
  };

  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || sendStatus === "sending") return;

    setSendStatus("sending");

    try {
      const response = await fetch(CONTACT_API_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId,
            pageUrl: window.location.href,
            language: i18n.resolvedLanguage ?? i18n.language,
            startedAt: chatOpenedAtRef.current,
            website: "",
          }),
        });

      if (!response.ok) {
        throw new Error(`Contact API returned ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `visitor-${Date.now()}-${window.crypto.randomUUID()}`,
          text: message,
          author: "visitor",
        },
      ]);
      setInputValue("");
      setSendStatus("sent");
    } catch (error) {
      console.error("Não foi possível enviar a mensagem do portfólio.", error);
      setSendStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (shouldHideForStandaloneGame || shouldHideForMobileHome) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: bottomOffset,
        right: rightOffset,
        zIndex: 9999,
      }}
    >
      {!isOpen && (
        <button
          onClick={openChat}
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
          title="Abrir chat"
        >
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
                    alt="Mensagem"
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
                  {phrases[currentPhraseIndex]}
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
                        key={`${item.alt}-${index}`}
                        style={commonStyle}
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
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
                      key={`${item.ariaLabel}-${index}`}
                      aria-label={item.ariaLabel}
                      title={item.ariaLabel}
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
                        {item.label}
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
                alt="Mensagem"
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
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0 } }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{
              width: isMobile ? "80vw" : "480px",
              height: isMobile ? "40vh" : "600px",
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              padding: `${scale(1.5)}rem`,
              color: "#fff",
              fontSize: `${scale(1)}rem`,
              position: "fixed",
              bottom: "20px",
              right: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: `${scale(1)}rem`,
              }}
            >
              <img
                src={perfilMini}
                alt="Perfil"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: `${scale(1.1)}rem` }}>
                  Mateus Cabral
                </span>
                <span style={{ fontSize: `${scale(0.9)}rem`, color: "#aaa" }}>
                  Mensagens para mim
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                fontSize: `${scale(1.05)}rem`,
                lineHeight: scale(1.6),
                display: "flex",
                flexDirection: "column",
                gap: `${scale(0.5)}rem`,
              }}
            >
              {[t("floatingChat.secondMessage"), t("floatingChat.firstMessage")].map(
                (text, index) => (
                  <div
                    key={`initial-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      maxWidth: "80%",
                    }}
                  >
                    <img
                      src={perfilMini}
                      alt="Perfil"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        marginRight: "0.5rem",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        padding: `${scale(0.6)}rem ${scale(1)}rem`,
                        borderRadius: "12px",
                        wordWrap: "break-word",
                        color: "#fff",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        fontSize: `${scale(1)}rem`,
                      }}
                    >
                      {text}
                    </div>
                  </div>
                )
              )}

              {messages.map((message) =>
                message.author === "visitor" ? (
                  <div
                    key={message.id}
                    data-chat-author="visitor"
                    style={{
                      alignSelf: "flex-end",
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: `${scale(0.6)}rem ${scale(1)}rem`,
                      borderRadius: "12px",
                      maxWidth: "80%",
                      wordWrap: "break-word",
                      color: "#fff",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      fontSize: `${scale(1)}rem`,
                    }}
                  >
                    {message.text}
                  </div>
                ) : (
                  <div
                    key={message.id}
                    data-chat-author="mateus"
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      maxWidth: "80%",
                    }}
                  >
                    <img
                      src={perfilMini}
                      alt="Perfil"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        marginRight: "0.5rem",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        background: "rgba(244, 17, 18, 0.18)",
                        border: "1px solid rgba(244, 17, 18, 0.4)",
                        padding: `${scale(0.6)}rem ${scale(1)}rem`,
                        borderRadius: "12px",
                        wordWrap: "break-word",
                        color: "#fff",
                        fontSize: `${scale(1)}rem`,
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: `${scale(1)}rem`,
                gap: `${scale(0.5)}rem`,
              }}
            >
              <form autoComplete="off" style={{ flex: 1 }}>
                <input
                  type="text"
                  autoComplete="new-password"
                  style={{
                    visibility: "hidden",
                    position: "absolute",
                    height: 0,
                    width: 0,
                  }}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  style={{
                    visibility: "hidden",
                    position: "absolute",
                    height: 0,
                    width: 0,
                  }}
                />

                <input
                  ref={inputRef}
                  type="text"
                  name="message"
                  inputMode="text"
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder={t("floatingChat.placeholder")}
                  value={inputValue}
                  maxLength={1000}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (sendStatus !== "sending") setSendStatus("idle");
                  }}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%",
                    padding: `${scale(1)}rem`,
                    borderRadius: "10px",
                    border: "none",
                    outline: "none",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                    fontSize: `${scale(1)}rem`,
                  }}
                />
              </form>

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!inputValue.trim() || sendStatus === "sending"}
                style={{
                  padding: `0 ${scale(1)}rem`,
                  backgroundColor: "#f41112",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    !inputValue.trim() || sendStatus === "sending"
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "bold",
                  fontSize: `${scale(1)}rem`,
                  opacity:
                    !inputValue.trim() || sendStatus === "sending" ? 0.65 : 1,
                }}
              >
                {sendStatus === "sending"
                  ? t("floatingChat.sending")
                  : t("floatingChat.send")}
              </button>
            </div>

            <div
              aria-live="polite"
              style={{
                minHeight: `${scale(1.25)}rem`,
                marginTop: `${scale(0.4)}rem`,
                color: sendStatus === "error" ? "#ffb4ab" : "#b9f6ca",
                fontSize: `${scale(0.82)}rem`,
              }}
            >
              {sendStatus === "sent" && t("floatingChat.sendSuccess")}
              {sendStatus === "error" && t("floatingChat.sendError")}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: `${scale(1)}rem`,
                backgroundColor: "#f41112",
                color: "#fff",
                border: "none",
                padding: `${scale(0.6)}rem ${scale(1)}rem`,
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: `${scale(1)}rem`,
              }}
            >
              {t("floatingChat.close")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


