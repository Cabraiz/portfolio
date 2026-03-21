import { useEffect, useState } from "react";

const titles = [
  "Software Engineer",
  "Full Stack Developer",
  "Front-End Specialist",
  "Back-End Developer",
  "📱 Mobile Developer",
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
        background: "rgba(0, 0, 0, 0.16)",
        borderTop: "2px solid #f1c40f",
        borderBottom: "2px solid #f1c40f",
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
          color: "#f1c40f",
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
