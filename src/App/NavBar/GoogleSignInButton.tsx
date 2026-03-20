import React, {
  type ButtonHTMLAttributes,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import "./GoogleSignInButton.css";

export interface GoogleSignInButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onClick?: () => void | Promise<void>;
  label?: string;
  ariaLabel?: string;
  compact?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function GoogleLogoIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
      className="googleSignInButton__iconSvg"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        flex: "0 0 auto",
      }}
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9086c1.7023-1.5668 2.6837-3.8727 2.6837-6.6155Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5823-5.0364-3.7105H.9573v2.3318A8.9998 8.9998 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.9636 10.7104A5.409 5.409 0 0 1 3.6818 9c0-.5932.1014-1.1691.2818-1.7105V4.9577H.9573A8.9998 8.9998 0 0 0 0 9c0 1.4523.3482 2.8277.9573 4.0423l3.0063-2.3319Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5782c1.3214 0 2.5077.4541 3.4418 1.3459l2.5818-2.5818C13.4632.8918 11.426 0 9 0A8.9998 8.9998 0 0 0 .9573 4.9577l3.0063 2.3318C4.6718 5.1605 6.6559 3.5782 9 3.5782Z"
      />
    </svg>
  );
}

function getButtonInlineStyle(
  compact: boolean,
  fullWidth: boolean,
  disabled: boolean
): CSSProperties {
  const height = compact ? 42 : 46;
  const radius = compact ? 12 : 14;
  const iconGap = compact ? 9 : 10;
  const paddingX = compact ? 11 : 12;
  const paddingY = compact ? 7 : 8;
  const widthValue = fullWidth ? "100%" : compact ? "220px" : "248px";

  return {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: `${iconGap}px`,
    width: widthValue,
    minWidth: 0,
    maxWidth: "100%",
    minHeight: `${height}px`,
    padding: `${paddingY}px ${paddingX}px`,
    borderRadius: `${radius}px`,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background:
      "linear-gradient(180deg, rgba(34, 36, 42, 0.98), rgba(21, 22, 27, 0.98))",
    color: "rgba(255, 255, 255, 0.96)",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.24)",
    overflow: "hidden",
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    textAlign: "left",
    verticalAlign: "middle",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    backdropFilter: "blur(10px)",
    fontFamily: "inherit",
    opacity: disabled ? 0.58 : 1,
    transition:
      "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, opacity 180ms ease",
  };
}

function getIconWrapInlineStyle(compact: boolean): CSSProperties {
  const size = compact ? 28 : 30;
  const radius = compact ? 8 : 9;

  return {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    maxWidth: `${size}px`,
    maxHeight: `${size}px`,
    borderRadius: `${radius}px`,
    background: "rgba(255, 255, 255, 0.98)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 4px 10px rgba(0, 0, 0, 0.14)",
    overflow: "hidden",
  };
}

function getIconSvgWrapInlineStyle(compact: boolean): CSSProperties {
  const size = compact ? 16 : 18;

  return {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    maxWidth: `${size}px`,
    maxHeight: `${size}px`,
    flex: "0 0 auto",
  };
}

function getLabelInlineStyle(compact: boolean): CSSProperties {
  return {
    display: "block",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: compact ? "0.88rem" : "0.95rem",
    fontWeight: 650,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    color: "rgba(255, 255, 255, 0.96)",
  };
}

function getSpinnerInlineStyle(): CSSProperties {
  return {
    width: "15px",
    height: "15px",
    borderRadius: "999px",
    border: "2px solid rgba(255, 255, 255, 0.22)",
    borderTopColor: "rgba(255, 255, 255, 0.92)",
  };
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  label,
  ariaLabel,
  compact = false,
  fullWidth = false,
  disabled = false,
  loading = false,
  className,
  type = "button",
  title,
  ...rest
}) => {
  const { t } = useTranslation();

  const resolvedLabel =
    label ??
    t("google.login", {
      defaultValue: "Entrar com o Google",
    });

  const resolvedLoadingLabel = t("google.loading", {
    defaultValue: "Conectando...",
  });

  const resolvedAriaLabel = ariaLabel ?? resolvedLabel;
  const isDisabled = disabled || loading;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }

    void onClick?.();
  };

  return (
    <button
      type={type}
      className={joinClasses(
        "googleSignInButton",
        compact && "googleSignInButton--compact",
        fullWidth && "googleSignInButton--fullWidth",
        loading && "googleSignInButton--loading",
        isDisabled && "googleSignInButton--disabled",
        className
      )}
      style={getButtonInlineStyle(compact, fullWidth, isDisabled)}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={resolvedAriaLabel}
      aria-busy={loading || undefined}
      title={title ?? resolvedLabel}
      {...rest}
    >
      <span
        className="googleSignInButton__iconWrap"
        aria-hidden="true"
        style={getIconWrapInlineStyle(compact)}
      >
        <span style={getIconSvgWrapInlineStyle(compact)}>
          <GoogleLogoIcon />
        </span>
      </span>

      <span
        className="googleSignInButton__content"
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          className="googleSignInButton__label"
          style={getLabelInlineStyle(compact)}
        >
          {loading ? resolvedLoadingLabel : resolvedLabel}
        </span>
      </span>

      <span
        className="googleSignInButton__status"
        aria-hidden="true"
        style={{
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "16px",
          color: "rgba(255, 255, 255, 0.62)",
        }}
      >
        {loading ? (
          <span
            className="googleSignInButton__spinner"
            style={getSpinnerInlineStyle()}
          />
        ) : (
          <span
            className="googleSignInButton__arrow"
            style={{
              fontSize: "0.95rem",
              lineHeight: 1,
            }}
          >
            →
          </span>
        )}
      </span>
    </button>
  );
};

export default GoogleSignInButton;
