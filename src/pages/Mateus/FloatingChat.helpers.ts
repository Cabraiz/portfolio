// Tipos, armazenamento local e API de contato do chat flutuante.
import appI18n from "@/i18n/i18n";

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
const WHATSAPP_SUPPORT_MESSAGES: Readonly<Record<string, string>> = {
  pt: "Olá Mateus, vim pelo atendimento 24/7 da Cabraiz e quero falar sobre um projeto.",
  en: "Hi Mateus, I came from the Cabraiz 24/7 chat and would like to talk about a project.",
  es: "Hola Mateus, vengo del chat 24/7 de Cabraiz y me gustaría hablar sobre un proyecto.",
};

function getWhatsAppSupportUrl(): string {
  const language = (appI18n.resolvedLanguage ?? "pt").split("-")[0];
  const message = WHATSAPP_SUPPORT_MESSAGES[language] ?? WHATSAPP_SUPPORT_MESSAGES.pt;
  return `https://wa.me/5585998575707?text=${encodeURIComponent(message)}`;
}

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

/**
 * Usa a conversa já guardada ou cria uma nova só na memória. Nada é gravado
 * no navegador antes de a pessoa enviar a primeira mensagem (privacidade:
 * quem só visita o site não deixa nada guardado no aparelho).
 */
function readOrCreateConversationId(): string {
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
  } catch {
    // Sem armazenamento: a conversa vale só durante esta visita.
  }
  return window.crypto.randomUUID();
}

function persistConversationId(conversationId: string) {
  try {
    window.localStorage.setItem(CHAT_CONVERSATION_STORAGE_KEY, conversationId);
  } catch {
    // A conversa continua durante esta visita quando o armazenamento é bloqueado.
  }
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

export type { ChatMessage, ContactReply, MascotReaction };
export {
  CHAT_LAST_SENT_AT_STORAGE_KEY,
  CONTACT_API_URL,
  getWhatsAppSupportUrl,
  getActiveLandingSectionSnapshot,
  subscribeToActiveLandingSection,
  readOrCreateConversationId,
  persistConversationId,
  hasRecentConversationActivity,
  getStoredMessages,
  storeMessages,
};
