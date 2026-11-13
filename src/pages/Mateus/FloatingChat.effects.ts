// Efeitos do chat flutuante (olhos do mascote, rolagem do painel, respostas).
import type * as React from "react";
import { useEffect } from "react";
import { CONTACT_API_URL } from "./FloatingChat.helpers";
import type { ChatMessage, ContactReply, MascotReaction } from "./FloatingChat.helpers";

export function useMascotEyeTracking(
  mascotRef: React.RefObject<HTMLSpanElement | null>,
  largeIrisRef: React.RefObject<HTMLImageElement | null>,
  smallIrisRef: React.RefObject<HTMLImageElement | null>,
  isOpen: boolean,
  isMobile: boolean,
  mascotReaction: MascotReaction,
) {
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
}

export function useChatPanelWheel(
  isOpen: boolean,
  chatRef: React.RefObject<HTMLDivElement | null>,
  messagesScrollRef: React.RefObject<HTMLDivElement | null>,
) {
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
}

export function useChatReplyPolling(
  isOpen: boolean,
  hasActiveConversation: boolean,
  conversationId: string,
  replyCursorRef: React.RefObject<number>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
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
}
