import type {
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import styles from "./CTAButton.module.css";

export type CTAButtonVariant =
  | "heroPrimary"
  | "heroSecondary"
  | "conversationPrimary"
  | "conversationSecondary";

export type CTAButtonSize = "default" | "compact";
export type CTAButtonAlign = "center" | "space-between";
export type CTAButtonType = "button" | "submit" | "reset";

export type CTAButtonProps = Readonly<{
  label: string;
  backLabel?: string;
  href?: string;
  className?: string;
  ariaLabel?: string;
  target?: "_self" | "_blank";
  rel?: string;
  download?: boolean | string;
  variant?: CTAButtonVariant;
  size?: CTAButtonSize;
  align?: CTAButtonAlign;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  forceFlip?: boolean;
  type?: CTAButtonType;
  heightPx?: number;
  loadingLabel?: string;
  loadingIndicator?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  backLeadingIcon?: ReactNode;
  backTrailingIcon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}>;

type CTAButtonInlineStyle = CSSProperties & {
  "--cta-height"?: string;
};

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

  return target === "_blank" ? "noreferrer noopener" : undefined;
}

function resolveVariantClassName(variant: CTAButtonVariant): string {
  switch (variant) {
    case "heroPrimary":
      return styles.variantHeroPrimary;
    case "heroSecondary":
      return styles.variantHeroSecondary;
    case "conversationPrimary":
      return styles.variantConversationPrimary;
    case "conversationSecondary":
    default:
      return styles.variantConversationSecondary;
  }
}

function resolveBackFaceContent(args: Readonly<{
  loading: boolean;
  loadingIndicator?: ReactNode;
  loadingLabel: string;
  backLabel: string;
}>): ReactNode {
  const { loading, loadingIndicator, loadingLabel, backLabel } = args;

  if (!loading) {
    return backLabel;
  }

  if (loadingIndicator) {
    return loadingIndicator;
  }

  return loadingLabel;
}

function resolveAccessibleLabel(args: Readonly<{
  ariaLabel?: string;
  label: string;
  loading: boolean;
}>): string {
  const baseLabel = args.ariaLabel ?? args.label;

  if (args.loading) {
    return `${baseLabel}. Carregando.`;
  }

  return baseLabel;
}

function ButtonFaceContent({
  label,
  leadingIcon,
  trailingIcon,
  align,
  compact,
}: Readonly<{
  label: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  align: CTAButtonAlign;
  compact: boolean;
}>) {
  return (
    <span
      className={joinClasses(
        styles.faceContent,
        align === "center" ? styles.faceContentCenter : styles.faceContentSpaceBetween,
      )}
    >
      <span className={styles.leadingGroup}>
        {leadingIcon ? (
          <span
            className={joinClasses(
              styles.leadingIcon,
              compact && styles.leadingIconCompact,
            )}
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        ) : null}

        <span
          className={joinClasses(
            styles.label,
            compact && styles.labelCompact,
          )}
        >
          {label}
        </span>
      </span>

      {trailingIcon ? (
        <span
          className={joinClasses(
            styles.trailingIcon,
            compact && styles.trailingIconCompact,
          )}
          aria-hidden="true"
        >
          {trailingIcon}
        </span>
      ) : null}
    </span>
  );
}

export default function CTAButton({
  label,
  backLabel,
  href,
  className,
  ariaLabel,
  target = "_self",
  rel,
  download,
  variant = "conversationPrimary",
  size = "default",
  align = "space-between",
  fullWidth = false,
  loading = false,
  disabled = false,
  forceFlip = false,
  type = "button",
  heightPx,
  loadingLabel = "CARREGANDO...",
  loadingIndicator,
  leadingIcon,
  trailingIcon,
  backLeadingIcon,
  backTrailingIcon,
  onClick,
}: CTAButtonProps) {
  const compact = size === "compact";
  const accessibleLabel = resolveAccessibleLabel({
    ariaLabel,
    label,
    loading,
  });
  const resolvedRel = resolveRel(target, rel);
  const resolvedBackLabel = backLabel ?? label;
  const resolvedBackContent = resolveBackFaceContent({
    loading,
    loadingIndicator,
    loadingLabel,
    backLabel: resolvedBackLabel,
  });

  const variantClassName = resolveVariantClassName(variant);
  const rootClassName = joinClasses(
    styles.button,
    variantClassName,
    compact && styles.buttonCompact,
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    className,
  );

  const inlineStyle: CTAButtonInlineStyle = heightPx
    ? { "--cta-height": `${heightPx}px` }
    : {};

  const commonDataAttributes = {
    "data-loading": loading ? "true" : "false",
    "data-force-flip": forceFlip ? "true" : "false",
    "data-align": align,
    "data-size": size,
    "data-variant": variant,
  } as const;

  const track = (
    <>
      <span className={styles.srOnly}>{accessibleLabel}</span>

      <span className={styles.track} aria-hidden="true">
        <span className={joinClasses(styles.face, styles.faceFront)}>
          <ButtonFaceContent
            label={label}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
            align={align}
            compact={compact}
          />
        </span>

        <span className={joinClasses(styles.face, styles.faceBack)}>
          <ButtonFaceContent
            label={resolvedBackContent}
            leadingIcon={backLeadingIcon ?? leadingIcon}
            trailingIcon={backTrailingIcon ?? trailingIcon}
            align={align}
            compact={compact}
          />
        </span>
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <a
        className={rootClassName}
        href={href}
        target={target}
        rel={resolvedRel}
        download={download}
        aria-label={accessibleLabel}
        aria-busy={loading ? "true" : undefined}
        style={inlineStyle}
        onClick={onClick}
        {...commonDataAttributes}
      >
        {track}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={rootClassName}
      aria-label={accessibleLabel}
      aria-busy={loading ? "true" : undefined}
      disabled={disabled}
      style={inlineStyle}
      onClick={onClick}
      {...commonDataAttributes}
    >
      {track}
    </button>
  );
}
