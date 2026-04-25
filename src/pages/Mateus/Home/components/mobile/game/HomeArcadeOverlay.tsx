import React, {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import HomeArcadeGame from "./HomeArcadeGame";

export type HomeArcadeOverlayProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  portraitSrc: string;
  portraitAlt?: string;
  className?: string;
}>;

const EXIT_DURATION_MS = 220;

export default function HomeArcadeOverlay({
  isOpen,
  onClose,
  portraitSrc,
  portraitAlt = "Mateus Cabral",
  className,
}: HomeArcadeOverlayProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsVisible(false);

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, shouldRender]);

  const overlayStyle = useMemo<CSSProperties>(() => {
    return {
      position: "fixed",
      inset: 0,
      zIndex: 180,
      display: "grid",
      placeItems: "center",
      padding:
        "max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
      boxSizing: "border-box",
      opacity: isVisible ? 1 : 0,
      visibility: shouldRender ? "visible" : "hidden",
      transition: `opacity ${EXIT_DURATION_MS}ms ease, visibility ${EXIT_DURATION_MS}ms ease`,
      isolation: "isolate",
    };
  }, [isVisible, shouldRender]);

  const backdropStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      border: "none",
      padding: 0,
      margin: 0,
      appearance: "none",
      cursor: "default",
      background:
        "radial-gradient(circle at 50% 50%, rgba(75, 18, 176, 0.22) 0%, rgba(9, 11, 24, 0.82) 48%, rgba(3, 4, 10, 0.96) 100%)",
      backdropFilter: "blur(20px) saturate(135%)",
      WebkitBackdropFilter: "blur(20px) saturate(135%)",
    };
  }, []);

  const shellStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: "min(100%, 480px)",
      height: "calc(100dvh - 24px)",
      maxWidth: "480px",
      maxHeight: "calc(100dvh - 24px)",
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? "translateY(0) scale(1)"
        : "translateY(18px) scale(0.975)",
      transition: `opacity ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease`,
      boxSizing: "border-box",
    };
  }, [isVisible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={className}
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Arcade game"
    >
      <button
        type="button"
        aria-label="Fechar jogo"
        onClick={onClose}
        style={backdropStyle}
      />

      <div style={shellStyle}>
        <HomeArcadeGame
          portraitSrc={portraitSrc}
          portraitAlt={portraitAlt}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
