import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type MouseEventHandler,
} from "react";
import styles from "./ResumeDownloadButton.module.css";

export type ResumeDownloadButtonSize = "default" | "compact";
export type ResumeDownloadButtonType = "button" | "submit" | "reset";
export type ResumeDownloadButtonClickHandler =
  MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;

export type ResumeDownloadButtonProps = Readonly<{
  label: string;
  href?: string;
  className?: string;
  ariaLabel?: string;
  target?: "_self" | "_blank";
  rel?: string;
  download?: boolean | string;
  size?: ResumeDownloadButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: ResumeDownloadButtonType;
  trayLabel?: string;
  onClick?: ResumeDownloadButtonClickHandler;
}>;

function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function resolveRel(
  target: "_self" | "_blank",
  rel?: string,
): string | undefined {
  if (rel) {
    return rel;
  }

  return target === "_blank" ? "noopener noreferrer" : undefined;
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 4.5V14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11L12 14.5L15.5 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18.5H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ResumeDownloadButton({
  label,
  href,
  className,
  ariaLabel,
  target = "_self",
  rel,
  download,
  size = "default",
  fullWidth = false,
  disabled = false,
  type = "button",
  trayLabel,
  onClick,
}: ResumeDownloadButtonProps) {
  const compact = size === "compact";
  const accessibleLabel = ariaLabel ?? label;
  const resolvedRel = resolveRel(target, rel);

  /**
   * Mantido só para compatibilidade da API do componente.
   * A nova lógica visual não usa mais a bandeja/tray.
   */
  void trayLabel;

  const rootRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const [suspendMotion, setSuspendMotion] = useState(false);

  const clearInteractiveState = useCallback(() => {
    setSuspendMotion(false);
    rootRef.current?.blur();
  }, []);

  useEffect(() => {
    const handleGlobalBlur = () => {
      setSuspendMotion(true);
      rootRef.current?.blur();
    };

    const handleGlobalFocus = () => {
      clearInteractiveState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSuspendMotion(true);
        rootRef.current?.blur();
        return;
      }

      clearInteractiveState();
    };

    const handlePageHide = () => {
      setSuspendMotion(true);
      rootRef.current?.blur();
    };

    globalThis.addEventListener("blur", handleGlobalBlur);
    globalThis.addEventListener("focus", handleGlobalFocus);
    globalThis.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      globalThis.removeEventListener("blur", handleGlobalBlur);
      globalThis.removeEventListener("focus", handleGlobalFocus);
      globalThis.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearInteractiveState]);

  const handleClick = useCallback(
    (mouseEvent: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      onClick?.(mouseEvent);

      if (mouseEvent.defaultPrevented) {
        return;
      }

      setSuspendMotion(true);

      if (typeof globalThis.queueMicrotask === "function") {
        globalThis.queueMicrotask(() => {
          rootRef.current?.blur();
        });
      }

      globalThis.setTimeout(() => {
        rootRef.current?.blur();
      }, 0);
    },
    [onClick],
  );

  const setRootRef = useCallback(
    (node: HTMLAnchorElement | HTMLButtonElement | null) => {
      rootRef.current = node;
    },
    [],
  );

  const rootClassName = joinClasses(
    styles.root,
    compact && styles.rootCompact,
    fullWidth && styles.rootFullWidth,
    disabled && styles.rootDisabled,
    className,
  );

  const content = (
    <>
      <span className={styles.srOnly}>{accessibleLabel}</span>

      <span className={styles.surface} aria-hidden="true">
        <span className={styles.iconRail}>
          <span className={styles.icon}>
            <DownloadIcon />
          </span>
        </span>

        <span
          className={joinClasses(
            styles.text,
            compact && styles.textCompact,
          )}
        >
          {label}
        </span>
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <a
        ref={setRootRef}
        className={rootClassName}
        href={href}
        target={target}
        rel={resolvedRel}
        download={download}
        aria-label={accessibleLabel}
        data-suspend-motion={suspendMotion ? "true" : "false"}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={setRootRef}
      type={type}
      className={rootClassName}
      aria-label={accessibleLabel}
      disabled={disabled}
      data-suspend-motion={suspendMotion ? "true" : "false"}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
