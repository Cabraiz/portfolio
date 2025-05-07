import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  const phrases = [
    "Let's Work Together",
    "Send Me a Message",
    "Let's Get in Touch",
    "Reach Out to Me",
    "Talk to Me Today",
  ];
  
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
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
      padding: "0.7rem 1.2rem",
      borderRadius: "10px 10px 0 10px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      fontWeight: "500",
      fontSize: "0.95rem",
      cursor: "pointer",
    }}
  >
    <FaEnvelope size={16} />
    {randomPhrase}
  </button>
)}



      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0 } }}
            transition={{
              duration: 0.8,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{
              width: "320px",
              height: "400px",
              backgroundColor: "#1b1b1b",
              borderRadius: "12px",
              boxShadow: "0 0 25px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              padding: "1rem",
              color: "#fff",
              position: "relative",
            }}
          >
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
              Atendimento
            </div>
            <div style={{ flex: 1, overflowY: "auto", fontSize: "0.85rem" }}>
              <p>Olá! Em que podemos ajudar?</p>
            </div>
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "none",
                outline: "none",
                backgroundColor: "#333",
                color: "white",
              }}
            />
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: "0.8rem",
                backgroundColor: "#9b59b6",
                color: "white",
                border: "none",
                padding: "0.4rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
