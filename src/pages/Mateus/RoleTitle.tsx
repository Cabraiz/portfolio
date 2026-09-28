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
        height: "clamp(4.75rem, 5.35vw, 5.5rem)",
        overflow: "hidden",
        width: "100%",
        position: "relative",
        border: "2px solid rgba(218, 162, 37, 0.92)",
        borderRadius: "12px",
        padding: "clamp(0.5rem, 0.8vw, 0.85rem) clamp(1rem, 1.6vw, 1.5rem)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4, 15, 27, 0.72)",
      }}
    >
      <div
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontSize: "clamp(1.75rem, 2.35vw, 2.5rem)",
          fontWeight: 700,
          fontFamily: '"Brutal", sans-serif',
          color: "#dcae43",
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
