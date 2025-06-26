import type * as React from 'react';
import { useState, useRef, useEffect } from "react";
import msgIcon from '../../assets/Mateus/msgIcon.png';
import mySelf from '../../assets/Mateus/mySelf.png';
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const phrases = t("floatingChat.phrases", {
    returnObjects: true,
  }) as string[];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const scale = (value: number) => isMobile ? value * 0.8 : value;

  const bottomOffset = isMobile ? "30px" : "3vh";
  const rightOffset = isMobile ? "30px" : "3vw";

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

  const typewriterText = t("floatingChat.intro");

  useEffect(() => {
    if (!isOpen || !inputRef.current || messages.length > 0) return;

    inputRef.current.focus();
    setInputValue("");

    let i = 0;
    const interval = setInterval(() => {
      if (i < typewriterText.length) {
        const char = typewriterText[i];
        if (char !== undefined) {
          setInputValue((prev) => prev + char);
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, messages.length]);

  const sendMessage = () => {
    if (inputValue.trim()) {
      setMessages((prev) => [...prev, inputValue]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

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
    onClick={() => setIsOpen(true)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? 0 : `${scale(0.7)}rem`,
      background: "rgba(33, 35, 40, 1)",
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
      minWidth: isMobile ? "unset" : "250px",
    }}
    title="Abrir chat"
  >
    {/* Ícone + Badge */}
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
  <img
  src={msgIcon}
  alt="Mensagem"
  style={{
    width: isMobile ? 24 : 20,
    height: isMobile ? 24 : 20,
    objectFit: 'contain',
    filter: 'invert(1)',
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


    {/* Texto dinâmico */}
{!isMobile && (
  <div
    style={{
      fontSize: '16px',
      fontFamily: 'Khula, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      fontWeight: 600,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}
  >
    {phrases[currentPhraseIndex]}
  </div>
  )}


    {/* Fotos de Perfil */}
{/* Fotos de Perfil */}
{!isMobile && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}
  >
    {/* Sua imagem — esquerda e na frente */}
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(33, 35, 40, 1)',
        zIndex: 2,
        backgroundColor: '#000',
      }}
    >
      <img
        src={mySelf}
        alt="Myself"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>

    {/* Aleatório — direita e atrás */}
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(33, 35, 40, 1)',
        marginLeft: '-10px',
        zIndex: 1,
        backgroundColor: '#000',
      }}
    >
      <img
        src="https://i.pravatar.cc/300"
        alt="Perfil"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
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
              width: isMobile ? "70vw" : "480px",
              height: isMobile ? "50vh" : "600px",
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
                marginBottom: `${scale(0.8)}rem`,
                fontWeight: "bold",
                fontSize: `${scale(1.3)}rem`,
              }}
            >
              {t("floatingChat.title")}
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
              <span>
                {t("floatingChat.greeting")
                  .split("\n")
                  .map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
              </span>

              {messages.map((msg, index) => (
                <div
                  key={index}
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
                  {msg}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", marginTop: `${scale(1)}rem`, gap: `${scale(0.5)}rem` }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={t("floatingChat.placeholder")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: `${scale(1)}rem`,
                  borderRadius: "10px",
                  border: "none",
                  outline: "none",
                  backgroundColor: "#2c2c2c",
                  color: "white",
                  fontSize: `${scale(1)}rem`,
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: `0 ${scale(1)}rem`,
                  backgroundColor: "#f1c40f",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: `${scale(1)}rem`,
                }}
              >
                {t("floatingChat.send")}
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: `${scale(1)}rem`,
                backgroundColor: "#f1c40f",
                color: "#000",
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
