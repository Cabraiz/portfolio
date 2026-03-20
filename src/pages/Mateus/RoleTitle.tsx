import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const titles = [
  "Software Engineer",
  "Full Stack Developer",
  "Front-End Specialist",
  "Back-End Developer",
  "📱 Mobile Developer",
];

function getWindowSize() {
  if (typeof window === "undefined") {
    return { innerWidth: 1440, innerHeight: 900 };
  }

  const { innerWidth, innerHeight } = window;
  return { innerWidth, innerHeight };
}

export default function RoleTitle() {
  const [index, setIndex] = useState(0);
  const [windowSize, setWindowSize] = useState(() => getWindowSize());

  const isMobileView = windowSize.innerWidth < 768;
  const is1080pDesktop =
    windowSize.innerWidth >= 1024 && windowSize.innerHeight >= 900;

  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: isMobileView ? "5rem" : is1080pDesktop ? "6.4rem" : "5rem",
        overflow: "hidden",
        width: "100%",
        position: "relative",
        borderRadius: "12px",
        background: "rgba(0, 0, 0, 0.2)",
        borderTop: "2px solid #f1c40f",
        borderBottom: "2px solid #f1c40f",
        padding: isMobileView
          ? "0.5rem 1rem"
          : is1080pDesktop
            ? "0.85rem 1.5rem"
            : "0.5rem 1.5rem",
        boxSizing: "border-box",
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
            fontSize: isMobileView
              ? "calc(7vw)"
              : is1080pDesktop
                ? "calc(2.45vw)"
                : "calc(2.5vw)",
            fontWeight: 700,
            fontFamily: '"Brutal", sans-serif',
            color: "#f1c40f",
            textAlign: "center",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            boxSizing: "border-box",
            padding: isMobileView ? "0 0.75rem" : "0 1rem",
          }}
        >
          {titles[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
