import React, {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";

import styles from "./HomeGameStage.module.css";

type CssVars = CSSProperties &
  Readonly<Record<`--${string}`, string | number | undefined>>;

export type HomeGameOverlayProps = PropsWithChildren<
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    closeOnBackdrop?: boolean;
    ariaLabel?: string;
  }>
>;

const EXIT_ANIMATION_MS = 220;

export default function HomeGameOverlay({
  isOpen,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  ariaLabel = "Interactive mobile game",
}: HomeGameOverlayProps) {
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
    }, EXIT_ANIMATION_MS);

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

  const overlayStyle = useMemo<CssVars>(() => {
    return {
      opacity: isVisible ? 1 : 0,
      visibility: shouldRender ? "visible" : "hidden",
      transition: `opacity ${EXIT_ANIMATION_MS}ms ease, visibility ${EXIT_ANIMATION_MS}ms ease`,
    };
  }, [isVisible, shouldRender]);

  const stageStyle = useMemo<CssVars>(() => {
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? "translateY(0) scale(1)"
        : "translateY(18px) scale(0.975)",
      transition: `opacity ${EXIT_ANIMATION_MS}ms ease, transform ${EXIT_ANIMATION_MS}ms ease`,
    };
  }, [isVisible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={[styles.overlay, className].filter(Boolean).join(" ")}
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Fechar jogo"
        onClick={closeOnBackdrop ? onClose : undefined}
        style={{
          appearance: "none",
          border: "none",
          padding: 0,
          cursor: closeOnBackdrop ? "pointer" : "default",
        }}
      />

      <div
        className={styles.stage}
        style={stageStyle}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
}
