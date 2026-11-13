import { localizeLabel } from '@/i18n/labels';
import type * as React from "react";
import type { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import mateusChatAvatar from "../../assets/Mateus/mateus-chat-avatar-v2.webp";
import lagArthurSupport from "../../assets/Mateus/lag-arthur-support-wig-suit-v2.webp";

import styles from "./FloatingChat.module.css";
import { getWhatsAppSupportUrl } from "./FloatingChat.helpers";
import type { ChatMessage } from "./FloatingChat.helpers";

type SendStatus = "idle" | "sending" | "sent" | "error";

type FloatingChatPanelBodyProps = {
  t: ReturnType<typeof useTranslation>["t"];
  isMobile: boolean;
  scale: (value: number) => number;
  setIsOpen: (isOpen: boolean) => void;
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  followLatestRef: React.RefObject<boolean>;
  messages: ChatMessage[];
  sendStatus: SendStatus;
  setSendStatus: (status: SendStatus) => void;
  privacyPath: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  sendMessage: () => Promise<void>;
};

// Conteúdo do painel aberto: cabeçalho, mensagens, aviso e campo de envio.
export function FloatingChatPanelBody({
  t,
  isMobile,
  scale,
  setIsOpen,
  messagesScrollRef,
  followLatestRef,
  messages,
  sendStatus,
  setSendStatus,
  privacyPath,
  inputRef,
  inputValue,
  setInputValue,
  handleKeyDown,
  sendMessage,
}: FloatingChatPanelBodyProps) {
  return (
    <>
            <button
              type="button"
              className={styles.chatCloseButton}
              aria-label={localizeLabel(t("floatingChat.close"))}
              title={localizeLabel(t("floatingChat.close"))}
              onClick={() => setIsOpen(false)}
            >
              {localizeLabel("×")}</button>

            <div
              className={styles.chatHeader}
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
                alt={localizeLabel("Lag Arthur, assistente da Cabraiz")}
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
                  {localizeLabel("Atendente")}</span>
                <span style={{ fontSize: `${scale(0.9)}rem`, color: "#aaa" }}>
                  {t("floatingChat.availability")}
                </span>
              </div>
            </div>

            <div
              ref={messagesScrollRef}
              data-chat-scroll-area="true"
              className={styles.chatScrollArea}
              onScroll={() => {
                const area = messagesScrollRef.current;
                if (area) followLatestRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 48;
              }}
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
                  alt={localizeLabel("Lag Arthur, assistente da Cabraiz")}
                  className={styles.botAvatar}
                />
                <div className={styles.botIntroContent}>
                  <div className={styles.botIntroBubble}>
                    {t("floatingChat.welcome")}
                  </div>
                  <div
                    className={styles.quickActions}
                    aria-label={localizeLabel(t("floatingChat.quickActionsLabel"))}
                  >
                    <a
                      className={`${styles.quickAction} ${styles.quickActionPrimary}`}
                      href={getWhatsAppSupportUrl()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("floatingChat.whatsappAction")}
                    </a>
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
                      aria-label={localizeLabel(t("floatingChat.anonymousVisitor"))}
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
                      alt={localizeLabel("Mateus Cabral")}
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
              className={styles.chatStatus}
              style={{
                minHeight: `${scale(1.25)}rem`,
                marginTop: `${scale(0.4)}rem`,
                color: sendStatus === "error" ? "#ffb4ab" : "#b9f6ca",
                fontSize: `${scale(0.82)}rem`,
              }}
            >
              {localizeLabel(sendStatus === "sent" && t(isMobile ? "floatingChat.sendSuccessShort" : "floatingChat.sendSuccess"))}
              {localizeLabel(sendStatus === "error" && t(isMobile ? "floatingChat.sendErrorShort" : "floatingChat.sendError"))}
            </div>

            {/* Transparência (LGPD): para onde a mensagem vai e link para o aviso.
                Fica acima do campo, que continua colado na base do painel. */}
            <p
              data-chat-privacy-note="true"
              style={{
                margin: `${scale(0.3)}rem 0 0`,
                color: "rgba(255, 255, 255, 0.62)",
                fontSize: `${scale(0.72)}rem`,
                lineHeight: 1.4,
              }}
            >
              {localizeLabel("Sua mensagem vai direto para o Mateus pelo Telegram. Não envie dados sensíveis.")}{" "}
              <Link
                to={privacyPath}
                style={{ color: "rgba(255, 255, 255, 0.86)", textDecoration: "underline" }}
              >
                {localizeLabel("Aviso de privacidade")}
              </Link>
            </p>

            <div
              data-chat-composer="true"
              className={styles.chatComposer}
              style={{
                display: "flex",
                marginTop: `${scale(0.4)}rem`,
                gap: `${scale(0.5)}rem`,
              }}
            >
              <form autoComplete="off" style={{ flex: 1, minWidth: 0 }}>
                <input
                  ref={inputRef}
                  type="text"
                  name="message"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder={localizeLabel(t("floatingChat.placeholder"))}
                  aria-label={localizeLabel(t("floatingChat.placeholder"))}
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
                    fontSize: isMobile ? '16px' : `${scale(1)}rem`,
                  }}
                />
              </form>

              <button
                type="button"
                onClick={() => void sendMessage()}
                onPointerDown={(event) => {
                  if (isMobile && document.activeElement === inputRef.current) event.preventDefault();
                }}
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
                {localizeLabel(sendStatus === "sending"
                  ? t("floatingChat.sending")
                  : t("floatingChat.send"))}
              </button>
            </div>
    </>
  );
}
