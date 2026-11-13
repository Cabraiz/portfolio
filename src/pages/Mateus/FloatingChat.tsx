import { useLabelLanguage } from '@/i18n/labels';
import type * as React from "react";
import { useState, useRef, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { privacyPathFor } from "../Privacy/privacyNotice.text";

import {
  getSectionIdByPath,
  isLandingPath,
} from "../../features/navigation/landingSections";
import { useMateusViewport } from "./Home/hooks/useHomeViewport";

import styles from "./FloatingChat.module.css";
import useChatVisualViewport from './hooks/useChatVisualViewport';

import {
  isHomeGameRoutePath,
  isHomeGameStandaloneHost,
} from "../../App/appHostRouting";

import {
  CHAT_LAST_SENT_AT_STORAGE_KEY,
  CONTACT_API_URL,
  getActiveLandingSectionSnapshot,
  getStoredMessages,
  hasRecentConversationActivity,
  persistConversationId,
  readOrCreateConversationId,
  storeMessages,
  subscribeToActiveLandingSection,
} from "./FloatingChat.helpers";
import type { ChatMessage, MascotReaction } from "./FloatingChat.helpers";
import {
  useChatPanelWheel,
  useChatReplyPolling,
  useMascotEyeTracking,
} from "./FloatingChat.effects";
import { FloatingChatPanelBody } from "./FloatingChat.panel";
import { FloatingChatTrigger } from "./FloatingChat.trigger";

export default function FloatingChat() {
  useLabelLanguage();
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const shouldHideForStandaloneGame =
    isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [conversationId] = useState(readOrCreateConversationId);
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
  const followLatestRef = useRef(true);
  const mascotRef = useRef<HTMLSpanElement>(null);
  const largeIrisRef = useRef<HTMLImageElement>(null);
  const smallIrisRef = useRef<HTMLImageElement>(null);
  const mascotTimersRef = useRef<number[]>([]);
  const chatOpenedAtRef = useRef(0);
  const replyCursorRef = useRef(0);
  const isSendingRef = useRef(false);

  const { t, i18n } = useTranslation();
  const privacyPath = privacyPathFor(i18n.resolvedLanguage);
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
  const isHome = getSectionIdByPath(location.pathname) === "home";
  const isHomeSectionActive = activeLandingSection
    ? activeLandingSection === "home"
    : isHome;
  // No celular o chat não aparece: o contato fica pelos botões do Início.
  const shouldHideForMobile = isMobile;
  const scale = (value: number) => (isMobile ? value * 0.8 : value);

  const bottomOffset = isMobile ? "30px" : "3vh";
  const rightOffset = isMobile ? "30px" : "3vw";

  useChatVisualViewport({
    enabled: isOpen && isMobile && !shouldHideForStandaloneGame && !shouldHideForMobile,
    hasMessages: messages.length > 0,
    panelRef: chatRef, inputRef, scrollRef: messagesScrollRef, followLatestRef,
  });

  useLayoutEffect(() => {
    const area = messagesScrollRef.current;
    if (isOpen && area && followLatestRef.current) area.scrollTop = area.scrollHeight;
  }, [isOpen, messages]);

  useEffect(() => {
    // Sem mensagens, nada vai para o navegador.
    if (messages.length > 0) storeMessages(conversationId, messages);
  }, [conversationId, messages]);

  useMascotEyeTracking(mascotRef, largeIrisRef, smallIrisRef, isOpen, isMobile, mascotReaction);

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
    if (isOpen && !isMobile) inputRef.current?.focus();
  }, [isOpen, isMobile]);

  useChatPanelWheel(isOpen, chatRef, messagesScrollRef);

  useChatReplyPolling(isOpen, hasActiveConversation, conversationId, replyCursorRef, setMessages);

  const openChat = () => {
    chatOpenedAtRef.current = Date.now();
    setSendStatus("idle");
    setIsOpen(true);
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
      persistConversationId(conversationId);
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

  if (shouldHideForStandaloneGame || shouldHideForMobile) {
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
        <FloatingChatTrigger
          handleTriggerClick={handleTriggerClick}
          isMobile={isMobile}
          isHomeSectionActive={isHomeSectionActive}
          scale={scale}
          mascotRef={mascotRef}
          largeIrisRef={largeIrisRef}
          smallIrisRef={smallIrisRef}
          mascotReaction={mascotReaction}
          phrases={phrases}
          currentPhraseIndex={currentPhraseIndex}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            data-lenis-prevent
            data-chat-panel="true"
            data-mobile={String(isMobile)}
            className={styles.chatPanel}
            initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion || isMobile
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
              prefersReducedMotion || isMobile
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
            <FloatingChatPanelBody
              t={t}
              isMobile={isMobile}
              scale={scale}
              setIsOpen={setIsOpen}
              messagesScrollRef={messagesScrollRef}
              followLatestRef={followLatestRef}
              messages={messages}
              sendStatus={sendStatus}
              setSendStatus={setSendStatus}
              privacyPath={privacyPath}
              inputRef={inputRef}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleKeyDown={handleKeyDown}
              sendMessage={sendMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
