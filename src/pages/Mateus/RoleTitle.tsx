import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const titles = [
  "Software Engineer",
  "Full Stack Developer",
  "Front-End Specialist",
  "Back-End Developer",
  "📱 Mobile Developer",
];

export default function RoleTitle() {
  const [index, setIndex] = useState(0);
  const [windowSize, setWindowSize] = useState(getWindowSize());

  const isMobileView = windowSize.innerWidth < 768;

  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  function getWindowSize() {
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: "5rem",
        overflow: "hidden",
        width: "100%",
        position: "relative",
        borderRadius: "12px",
        background: "rgba(0, 0, 0, 0.2)",
        borderTop: "2px solid #f1c40f",
        borderBottom: "2px solid #f1c40f",
        padding: "0.5rem 1.5rem",
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
            inset: 0,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobileView ? "calc(7vw)" : "calc(2.5vw)",
            fontWeight: 700,
            fontFamily: '"Brutal", sans-serif',
            color: "#f1c40f",
            textAlign: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            boxSizing: "border-box",
            padding: "0 1rem",
          }}
        >
          {titles[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
