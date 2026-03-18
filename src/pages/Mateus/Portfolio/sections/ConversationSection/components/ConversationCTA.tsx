import type { MouseEventHandler, ReactNode } from "react";

import CTAButton from "../../../../shared/CTAButton/CTAButton";
import type {
  ConversationCTAAction,
  ConversationCtaSize,
} from "../types";
import styles from "./ConversationCTA.module.css";

export type ConversationCTAProps = Readonly<{
  action: ConversationCTAAction;
  className?: string;
  caption?: string;
  supportText?: string;
  size?: ConversationCtaSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
}>;

function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function resolveTarget(action: ConversationCTAAction): "_self" | "_blank" {
  if (action.target) {
    return action.target;
  }

  return action.external ? "_blank" : "_self";
}

function resolveRel(
  action: ConversationCTAAction,
  target: "_self" | "_blank",
): string | undefined {
  if (action.rel) {
    return action.rel;
  }

  return target === "_blank" ? "noreferrer noopener" : undefined;
}

function resolveButtonVariant(
  action: ConversationCTAAction,
): "conversationPrimary" | "conversationSecondary" {
  return action.variant === "secondary"
    ? "conversationSecondary"
    : "conversationPrimary";
}

function resolveTrailingIcon(action: ConversationCTAAction): ReactNode | undefined {
  switch (action.icon) {
    case "download":
      return "↓";
    case "whatsapp":
      return "↗";
    case "none":
    default:
      return undefined;
  }
}

export default function ConversationCTA({
  action,
  className,
  caption,
  supportText,
  size = "default",
  fullWidth = true,
  loading = false,
  disabled = false,
  onClick,
}: ConversationCTAProps) {
  const compact = size === "compact";
  const target = resolveTarget(action);
  const resolvedRel = resolveRel(action, target);
  const trailingIcon = resolveTrailingIcon(action);
  const isInactive = disabled || loading || !action.href;

  return (
    <div
      className={joinClasses(
        styles.root,
        compact && styles.rootCompact,
        className,
      )}
      data-size={size}
      data-variant={action.variant}
      data-full-width={fullWidth ? "true" : "false"}
      data-loading={loading ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      {caption ? (
        <span className={joinClasses(styles.caption, compact && styles.captionCompact)}>
          {caption}
        </span>
      ) : null}

      <div className={styles.buttonSlot}>
        <CTAButton
          label={action.label}
          backLabel={action.label}
          ariaLabel={action.ariaLabel}
          href={isInactive ? undefined : action.href}
          target={target}
          rel={resolvedRel}
          download={action.download}
          variant={resolveButtonVariant(action)}
          size={size}
          align="space-between"
          fullWidth={fullWidth}
          loading={loading}
          disabled={isInactive}
          trailingIcon={trailingIcon}
          backTrailingIcon={loading ? "…" : trailingIcon}
          onClick={onClick}
        />
      </div>

      {supportText ? (
        <p
          className={joinClasses(
            styles.supportText,
            compact && styles.supportTextCompact,
          )}
        >
          {supportText}
        </p>
      ) : null}
    </div>
  );
}
