import { useState, useRef, useEffect } from "react";
import { FaEnvelope } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const phrases = t("floatingChat.phrases", { returnObjects: true }) as string[];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

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
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            background: "linear-gradient(90deg, #5b117d, #9b59b6)",
            color: "white",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "12px 12px 0 12px",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.35)",
            fontWeight: "600",
            fontSize: "1.1rem",
            cursor: "pointer",
            minWidth: "250px",
          }}
        >
          <FaEnvelope size={20} />
          {phrases[currentPhraseIndex]}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0 } }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{
              width: "480px",
              height: "600px",
              backgroundColor: "#1b1b1b",
              borderRadius: "16px",
              boxShadow: "0 0 30px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
              color: "#fff",
              position: "relative",
              fontSize: "1rem",
            }}
          >
            <div style={{ marginBottom: "0.8rem", fontWeight: "bold", fontSize: "1.3rem" }}>
              {t("floatingChat.title")}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                fontSize: "1.05rem",
                lineHeight: "1.6",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <span>
                {t("floatingChat.greeting").split('\n').map((line, index) => (
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
                    backgroundColor: "#9b59b6",
                    padding: "0.6rem 1rem",
                    borderRadius: "12px",
                    maxWidth: "80%",
                    wordWrap: "break-word",
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", marginTop: "1rem", gap: "0.5rem" }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={t("floatingChat.placeholder")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "none",
                  outline: "none",
                  backgroundColor: "#2c2c2c",
                  color: "white",
                  fontSize: "1rem",
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "0 1rem",
                  backgroundColor: "#9b59b6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {t("floatingChat.send")}
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: "1rem",
                backgroundColor: "#9b59b6",
                color: "white",
                border: "none",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
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
