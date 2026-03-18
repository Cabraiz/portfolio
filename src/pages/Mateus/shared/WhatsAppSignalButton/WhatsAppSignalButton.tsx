import { memo, type AnchorHTMLAttributes, type ReactNode } from "react";
import styles from "./WhatsAppSignalButton.module.css";

type WhatsAppSignalButtonProps = {
  href: string;
  label?: string;
  topLabel?: string;
  bottomLabel?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  compact?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  hero?: boolean;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: string;
};

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function DefaultWhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={styles.iconSvg}
    >
      <path
        fill="currentColor"
        d="M16.01 4.1c-6.58 0-11.9 5.2-11.9 11.63 0 2.05.55 4.04 1.59 5.78L4 28l6.71-1.75a12 12 0 0 0 5.3 1.22c6.57 0 11.9-5.2 11.9-11.63S22.58 4.1 16.01 4.1Zm0 21.33a9.8 9.8 0 0 1-4.98-1.35l-.36-.22-3.98 1.04 1.06-3.85-.23-.37a9.43 9.43 0 0 1-1.46-5.04c0-5.2 4.45-9.43 9.95-9.43 5.49 0 9.95 4.23 9.95 9.43 0 5.2-4.46 9.43-9.95 9.43Zm5.45-7.03c-.3-.15-1.78-.86-2.05-.95-.28-.1-.48-.15-.68.15-.2.3-.78.95-.96 1.14-.17.2-.35.22-.65.08-.3-.15-1.25-.45-2.39-1.44-.88-.76-1.48-1.7-1.65-2-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.61-.93-2.2-.24-.58-.49-.5-.68-.5h-.58c-.2 0-.52.08-.79.37-.28.3-1.04 1.01-1.04 2.47 0 1.45 1.06 2.85 1.21 3.05.15.2 2.09 3.3 5.18 4.49.73.28 1.3.44 1.74.56.73.19 1.4.16 1.92.1.58-.08 1.78-.72 2.03-1.4.25-.68.25-1.27.18-1.4-.08-.14-.28-.22-.58-.37Z"
      />
    </svg>
  );
}

type CornerProps = {
  className: string;
};

function Corner({ className }: CornerProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M34 6H16a10 10 0 0 0-10 10v18"
        className={styles.cornerPath}
      />
    </svg>
  );
}

function WhatsAppSignalButton({
  href,
  label = "WhatsApp",
  topLabel = "Contato direto",
  bottomLabel = "Resposta rápida",
  ariaLabel,
  fullWidth = false,
  compact = false,
  disabled = false,
  icon,
  className,
  hero = false,
  target = "_blank",
  rel,
}: WhatsAppSignalButtonProps) {
  const resolvedRel =
    target === "_blank" ? rel ?? "noreferrer noopener" : rel;

  return (
    <div
      className={joinClasses(
        styles.root,
        fullWidth && styles.fullWidth,
        compact && styles.compact,
        hero && styles.hero,
        disabled && styles.disabled,
        className
      )}
      data-disabled={disabled ? "true" : "false"}
    >
      <div className={styles.frame}>
        <span
          className={joinClasses(styles.drawer, styles.drawerTop)}
          aria-hidden="true"
        >
          {topLabel}
        </span>

        <a
          href={disabled ? undefined : href}
          target={disabled ? undefined : target}
          rel={disabled ? undefined : resolvedRel}
          aria-label={ariaLabel ?? label}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          className={styles.button}
        >
          <span className={styles.buttonSurface}>
            <span className={styles.leadingIcon} aria-hidden="true">
              {icon ?? <DefaultWhatsAppIcon />}
            </span>

            <span className={styles.labelWrap}>
              <span className={styles.label}>{label}</span>
            </span>
          </span>
        </a>

        <span
          className={joinClasses(styles.drawer, styles.drawerBottom)}
          aria-hidden="true"
        >
          {bottomLabel}
        </span>

        <Corner className={joinClasses(styles.corner, styles.cornerTopLeft)} />
        <Corner className={joinClasses(styles.corner, styles.cornerTopRight)} />
        <Corner
          className={joinClasses(styles.corner, styles.cornerBottomRight)}
        />
        <Corner
          className={joinClasses(styles.corner, styles.cornerBottomLeft)}
        />
      </div>
    </div>
  );
}

const MemoizedWhatsAppSignalButton = memo(WhatsAppSignalButton);
MemoizedWhatsAppSignalButton.displayName = "WhatsAppSignalButton";

export default MemoizedWhatsAppSignalButton;
export type { WhatsAppSignalButtonProps };
