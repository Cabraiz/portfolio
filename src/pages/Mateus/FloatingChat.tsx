import type * as React from "react";
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import msgIcon from "../../assets/Mateus/msgIcon.png";
import mateusChatAvatar from "../../assets/Mateus/mateus-chat-avatar-v2.webp";
import lagArthurSupport from "../../assets/Mateus/lag-arthur-support-wig-suit-v2.webp";
import lagArthurChat from "../../assets/Mateus/lag-arthur-chat-blank-eyes-closed-mouth-v3.webp";
import lagArthurIris from "../../assets/Mateus/lag-arthur-iris-anime-handpainted-v9.png";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import useLandingSectionNavigation from "../../features/navigation/useLandingSectionNavigation";
import { isLandingPath } from "../../features/navigation/landingSections";
import { useMateusViewport } from "./Home/hooks/useHomeViewport";

import styles from "./FloatingChat.module.css";

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

type MascotReaction = "idle" | "fleeing" | "hidden" | "returning";

const CHAT_CONVERSATION_STORAGE_KEY = "cabraiz-chat-conversation-id";
const CHAT_LAST_SENT_AT_STORAGE_KEY = "cabraiz-chat-last-sent-at";
const CHAT_MESSAGES_STORAGE_KEY = "cabraiz-chat-messages";
const CHAT_REPLY_RETENTION_MS = 24 * 60 * 60 * 1000;
const CHAT_STORED_MESSAGE_LIMIT = 100;
const CHAT_CONVERSATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_CONTACT_API_URL =
  "https://cabraiz-telegram-relay.vercel.app/api/contact";
const CONTACT_API_URL =
  import.meta.env.VITE_CONTACT_API_URL?.trim() ||
  (import.meta.env.DEV ? LOCAL_CONTACT_API_URL : "/api/contact");
const WHATSAPP_SUPPORT_URL =
  "https://wa.me/5585998575707?text=Ol%C3%A1%20Mateus%2C%20vim%20pelo%20atendimento%2024%2F7%20da%20Cabraiz%20e%20quero%20falar%20sobre%20um%20projeto.";

function getActiveLandingSectionSnapshot(): string | null {
  if (typeof document === "undefined") return null;

  return (
    document
      .querySelector<HTMLElement>('main[data-active-section]')
      ?.dataset.activeSection ?? null
  );
}

function subscribeToActiveLandingSection(onStoreChange: () => void) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-active-section"],
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

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

function hasRecentConversationActivity(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const lastSentAt = Number(
      window.localStorage.getItem(CHAT_LAST_SENT_AT_STORAGE_KEY)
    );

    return (
      Number.isFinite(lastSentAt) &&
      lastSentAt > 0 &&
      Date.now() - lastSentAt < CHAT_REPLY_RETENTION_MS
    );
  } catch {
    return false;
  }
}

function getStoredMessages(conversationId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const rawMessages = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (!rawMessages) return [];

    const stored = JSON.parse(rawMessages) as {
      conversationId?: unknown;
      updatedAt?: unknown;
      messages?: unknown;
    };
    const updatedAt = Number(stored.updatedAt);
    if (
      stored.conversationId !== conversationId ||
      !Number.isFinite(updatedAt) ||
      Date.now() - updatedAt >= CHAT_REPLY_RETENTION_MS ||
      !Array.isArray(stored.messages)
    ) {
      return [];
    }

    return stored.messages
      .filter(
        (message): message is ChatMessage =>
          typeof message === "object" &&
          message !== null &&
          typeof (message as ChatMessage).id === "string" &&
          typeof (message as ChatMessage).text === "string" &&
          ["visitor", "mateus"].includes((message as ChatMessage).author)
      )
      .slice(-CHAT_STORED_MESSAGE_LIMIT);
  } catch {
    return [];
  }
}

function storeMessages(conversationId: string, messages: ChatMessage[]) {
  try {
    window.localStorage.setItem(
      CHAT_MESSAGES_STORAGE_KEY,
      JSON.stringify({
        conversationId,
        updatedAt: Date.now(),
        messages: messages.slice(-CHAT_STORED_MESSAGE_LIMIT),
      })
    );
  } catch {
    // A conversa continua durante esta visita quando o armazenamento é bloqueado.
  }
}

export default function FloatingChat() {
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const { navigateToSection } = useLandingSectionNavigation();
  const shouldHideForStandaloneGame =
    isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [conversationId] = useState(getOrCreateConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getStoredMessages(conversationId)
  );
  const [hasActiveConversation, setHasActiveConversation] = useState(
    hasRecentConversationActivity
  );
  const [mascotReaction, setMascotReaction] =
    useState<MascotReaction>("idle");
  const [sendStatus, setSendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLSpanElement>(null);
  const largeIrisRef = useRef<HTMLImageElement>(null);
  const smallIrisRef = useRef<HTMLImageElement>(null);
  const mascotTimersRef = useRef<number[]>([]);
  const chatOpenedAtRef = useRef(0);
  const replyCursorRef = useRef(0);
  const isSendingRef = useRef(false);

  const { t, i18n } = useTranslation();
  const phrases = t("floatingChat.phrases", {
    returnObjects: true,
  }) as string[];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const activeLandingSection = useSyncExternalStore(
    subscribeToActiveLandingSection,
    getActiveLandingSectionSnapshot,
    () => null,
  );

  const { isMobile: isMobileLanding } = useMateusViewport();
  const isMobile = isLandingPath(location.pathname)
    ? isMobileLanding
    : typeof window !== "undefined" && window.innerWidth < 768;
  const isHome = location.pathname === "/home";
  const isHomeSectionActive = activeLandingSection
    ? activeLandingSection === "home"
    : isHome;
  const shouldHideForMobileHome = isMobile && isHome;
  const shouldHideForPortfolio = location.pathname === "/portfolio";
  const scale = (value: number) => (isMobile ? value * 0.8 : value);

  const bottomOffset = isMobile ? "30px" : "3vh";
  const rightOffset = isMobile ? "30px" : "3vw";

  useEffect(() => {
    storeMessages(conversationId, messages);
  }, [conversationId, messages]);

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

  useEffect(() => {
    const mascot = mascotRef.current;
    const largeIris = largeIrisRef.current;
    const smallIris = smallIrisRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (
      isOpen ||
      isMobile ||
      mascotReaction !== "idle" ||
      reduceMotion.matches ||
      !finePointer.matches ||
      !mascot ||
      !largeIris ||
      !smallIris
    ) {
      return;
    }

    let animationFrame = 0;

    const positionIrises = (clientX: number, clientY: number) => {
      const bounds = mascot.getBoundingClientRect();
      const deltaX = clientX - (bounds.left + bounds.width * 0.46);
      const deltaY = clientY - (bounds.top + bounds.height * 0.48);
      const directionX = Math.max(-1, Math.min(1, deltaX / 150));
      const directionY = Math.max(-1, Math.min(1, deltaY / 115));
      const offset = (direction: number, negative: number, positive: number) =>
        direction < 0 ? direction * negative : direction * positive;

      largeIris.style.setProperty(
        "--eye-x",
        `${offset(directionX, 3.1, 3.1)}px`
      );
      largeIris.style.setProperty(
        "--eye-y",
        `${offset(directionY, 1.8, 1.1)}px`
      );
      smallIris.style.setProperty(
        "--eye-x",
        `${offset(directionX, 1.4, 1.4)}px`
      );
      smallIris.style.setProperty(
        "--eye-y",
        `${offset(directionY, 0.75, 0.65)}px`
      );
    };

    const resetIrises = () => {
      largeIris.style.setProperty("--eye-x", "0px");
      largeIris.style.setProperty("--eye-y", "0px");
      smallIris.style.setProperty("--eye-x", "0px");
      smallIris.style.setProperty("--eye-y", "0px");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        positionIrises(event.clientX, event.clientY);
      });
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.documentElement.addEventListener("mouseleave", resetIrises);
    window.addEventListener("blur", resetIrises);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", resetIrises);
      window.removeEventListener("blur", resetIrises);
    };
  }, [isMobile, isOpen, mascotReaction]);

  useEffect(
    () => () => {
      mascotTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

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
    if (!isOpen) return;

    const panel = chatRef.current;
    if (!panel) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;

      const scrollArea = messagesScrollRef.current;
      if (!scrollArea || event.deltaY === 0) return;

      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? scrollArea.clientHeight
            : 1;

      event.preventDefault();
      event.stopPropagation();
      scrollArea.scrollTop += event.deltaY * deltaMultiplier;
    };

    panel.addEventListener("wheel", handleWheel, { passive: false });
    return () => panel.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !hasActiveConversation) {
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
  }, [conversationId, hasActiveConversation, isOpen]);

  const openChat = () => {
    chatOpenedAtRef.current = Date.now();
    setSendStatus("idle");
    setIsOpen(true);
  };

  const showServices = () => {
    setIsOpen(false);
    navigateToSection("roadMap", {
      replace: true,
      syncUrl: true,
      offsetPx: 0,
    });
  };

  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || sendStatus === "sending" || isSendingRef.current) return;

    isSendingRef.current = true;
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

      let responsePayload: { ok?: boolean } | null = null;
      try {
        responsePayload = (await response.json()) as { ok?: boolean };
      } catch {
        // Uma resposta sem JSON não confirma que o relay entregou a mensagem.
      }

      if (!response.ok || responsePayload?.ok !== true) {
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
      setHasActiveConversation(true);
      try {
        window.localStorage.setItem(
          CHAT_LAST_SENT_AT_STORAGE_KEY,
          String(Date.now())
        );
      } catch {
        // O polling continua nesta visita quando o armazenamento é bloqueado.
      }
      setSendStatus("sent");
    } catch (error) {
      console.error("Não foi possível enviar a mensagem do portfólio.", error);
      setSendStatus("error");
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  };

  const scareMascot = () => {
    if (mascotReaction !== "idle") return;

    mascotTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    setMascotReaction("fleeing");

    const hideTimer = window.setTimeout(() => {
      setMascotReaction("hidden");
    }, 520);
    const returnTimer = window.setTimeout(() => {
      setMascotReaction("returning");
    }, 5520);
    const idleTimer = window.setTimeout(() => {
      setMascotReaction("idle");
      mascotTimersRef.current = [];
    }, 6480);

    mascotTimersRef.current = [hideTimer, returnTimer, idleTimer];
  };

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const mascot = mascotRef.current;

    if (mascot && event.detail > 0) {
      const bounds = mascot.getBoundingClientRect();
      const clickedMascot =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (clickedMascot) {
        scareMascot();
        return;
      }
    }

    openChat();
  };

  if (
    shouldHideForStandaloneGame ||
    shouldHideForMobileHome ||
    shouldHideForPortfolio
  ) {
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
          onClick={handleTriggerClick}
          className={styles.chatTrigger}
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
          aria-label="Abrir chat"
        >
          <span
            ref={mascotRef}
            className={styles.mascot}
            data-mascot-reaction={mascotReaction}
            aria-hidden="true"
          >
            <img
              className={styles.mascotImage}
              src={lagArthurChat}
              alt=""
              draggable={false}
            />
            <img
              ref={largeIrisRef}
              className={`${styles.iris} ${styles.largeIris}`}
              src={lagArthurIris}
              alt=""
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
              alt=""
              aria-hidden="true"
              draggable={false}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
          </span>

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
                        key={item.alt}
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
                      key={item.ariaLabel}
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
            data-lenis-prevent
            data-chat-panel="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0, transition: { duration: 0.12 } }
                : {
                    opacity: [1, 0.9, 0],
                    scaleX: [1, 0.82, 0.05],
                    scaleY: [1, 0.9, 0.08],
                    x: [0, 26, 76],
                    y: [0, 42, 116],
                    rotate: [0, 1.2, 5],
                    filter: ["blur(0px)", "blur(1px)", "blur(12px)"],
                    borderRadius: ["20px", "28px", "50%"],
                    transition: {
                      duration: 0.52,
                      times: [0, 0.46, 1],
                      ease: [0.4, 0, 0.9, 0.4],
                    },
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.12 }
                : { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
            }
            style={{
              width: isMobile ? "calc(100vw - 32px)" : "480px",
              height: "80dvh",
              maxHeight: "80dvh",
              boxSizing: "border-box",
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              padding: `${scale(1.5)}rem`,
              paddingBottom: isMobile ? "16px" : "20px",
              color: "#fff",
              fontSize: `${scale(1)}rem`,
              position: "fixed",
              overscrollBehavior: "contain",
              bottom: "20px",
              right: "20px",
              transformOrigin: "calc(100% - 28px) calc(100% - 28px)",
              transition:
                "width 260ms cubic-bezier(0.22, 1, 0.36, 1), height 260ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <button
              type="button"
              className={styles.chatCloseButton}
              aria-label={t("floatingChat.close")}
              title={t("floatingChat.close")}
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: `${scale(1)}rem`,
                paddingRight: `${scale(3.5)}rem`,
              }}
            >
              <img
                src={lagArthurSupport}
                alt="Lag Arthur, assistente da Cabraiz"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(224, 146, 70, 0.72)",
                  boxShadow: "0 0 0 3px rgba(224, 146, 70, 0.1)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: `${scale(1.1)}rem` }}>
                  Atendente virtual
                </span>
                <span style={{ fontSize: `${scale(0.9)}rem`, color: "#aaa" }}>
                  {t("floatingChat.availability")}
                </span>
              </div>
            </div>

            <div
              ref={messagesScrollRef}
              data-chat-scroll-area="true"
              className={styles.chatScrollArea}
              style={{
                flex: 1,
                fontSize: `${scale(1.05)}rem`,
                lineHeight: scale(1.6),
                display: "flex",
                flexDirection: "column",
                gap: `${scale(0.5)}rem`,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: `${scale(0.25)}rem`,
              }}
            >
              <div className={styles.botIntro}>
                <img
                  src={lagArthurSupport}
                  alt="Lag Arthur, assistente da Cabraiz"
                  className={styles.botAvatar}
                />
                <div className={styles.botIntroContent}>
                  <div className={styles.botIntroBubble}>
                    {t("floatingChat.welcome")}
                  </div>
                  <div
                    className={styles.quickActions}
                    aria-label={t("floatingChat.quickActionsLabel")}
                  >
                    <a
                      className={`${styles.quickAction} ${styles.quickActionPrimary}`}
                      href={WHATSAPP_SUPPORT_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("floatingChat.whatsappAction")}
                    </a>
                    <button
                      className={styles.quickAction}
                      type="button"
                      onClick={showServices}
                    >
                      {t("floatingChat.showPrices")}
                    </button>
                  </div>
                </div>
              </div>

              {messages.map((message) =>
                message.author === "visitor" ? (
                  <div
                    key={message.id}
                    data-chat-author="visitor"
                    className={styles.visitorMessage}
                    style={{
                      maxWidth: "88%",
                    }}
                  >
                    <div
                      className={styles.visitorMessageBubble}
                      style={{
                        padding: `${scale(0.6)}rem ${scale(1)}rem`,
                        fontSize: `${scale(1)}rem`,
                      }}
                    >
                      {message.text}
                    </div>
                    <span
                      className={styles.visitorAvatar}
                      data-chat-avatar="visitor"
                      role="img"
                      aria-label={t("floatingChat.anonymousVisitor")}
                    />
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
                      src={mateusChatAvatar}
                      alt="Mateus Cabral"
                      data-chat-avatar="mateus"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid rgba(224, 146, 70, 0.58)",
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

            <div
              data-chat-composer="true"
              style={{
                display: "flex",
                marginTop: `${scale(0.4)}rem`,
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


