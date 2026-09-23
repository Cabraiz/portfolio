import { useEffect, useState } from "react";

const titles = [
  "Engenheiro de Software",
  "Dev Full Stack",
  "Back-End e APIs",
  "Cloud e DevOps",
  "Dev Mobile",
];

function prefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function RoleTitle() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let timeoutId = 0;

    const intervalId = window.setInterval(() => {
      setIsVisible(false);

      timeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % titles.length);
        setIsVisible(true);
      }, 140);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      style={{
        height: "clamp(5rem, 5.5vw, 6rem)",
        overflow: "hidden",
        width: "100%",
        position: "relative",
        borderRadius: "12px",
        background:
          "linear-gradient(#07101a, #07101a) padding-box, linear-gradient(105deg, #8a5700 0%, #e1b338 20%, #fff6c7 38%, #c48a10 55%, #ffe18a 75%, #8b5700 100%) border-box",
        border: "2px solid transparent",
        padding: "clamp(0.5rem, 0.8vw, 0.85rem) clamp(1rem, 1.6vw, 1.5rem)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontSize: "clamp(1.8rem, 2.45vw, 2.75rem)",
          fontWeight: 700,
          fontFamily: '"Brutal", sans-serif',
          color: "transparent",
          backgroundImage:
            "linear-gradient(105deg, #8a5700 0%, #e1b338 20%, #fff6c7 38%, #c48a10 55%, #ffe18a 75%, #8b5700 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 2px 8px rgba(199, 139, 18, 0.22))",
          textAlign: "center",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "0 clamp(0.75rem, 1vw, 1rem)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 140ms ease",
        }}
      >
        {titles[index]}
      </div>
    </div>
  );
}
