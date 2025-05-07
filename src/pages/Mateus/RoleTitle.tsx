import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const titles = [
  "Software Engineer",
  "Full Stack Developer",
  "Front-End Specialist",
  "Back-End Developer",
];

export default function RoleTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
  style={{
    height: "5rem", // ⬅️ reduzido sutilmente
    overflow: "hidden",
    width: "100%",
    maxWidth: "700px",
    position: "relative",
    borderRadius: "12px",
    background: "rgba(0, 0, 0, 0.2)",
    borderTop: "2px solid #f1c40f",
    borderBottom: "2px solid #f1c40f",
    padding: "0.5rem 1.5rem", // ⬅️ mais compacto
  }}
>

      <AnimatePresence mode="wait">
      <motion.div
        key={titles[index]}
        initial={{ y: "30%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        exit={{ y: "-30%", opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.6, 0, 0.4, 1] }}
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            padding: "0.5rem 1rem", // ← adiciona padding vertical e horizontal
            fontSize: "3.2rem",
            fontWeight: 700,
            fontFamily: '"Brutal", sans-serif',
            color: "#f1c40f",
            textAlign: "center",
            lineHeight: 1.2,
            boxSizing: "border-box", // garante que padding não quebre o layout
        }}
        >
        {titles[index]}
        </motion.div>


      </AnimatePresence>
    </div>
  );
}
