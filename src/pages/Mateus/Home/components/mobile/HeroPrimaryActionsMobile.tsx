import React, { useMemo } from "react";

export type HeroPrimaryActionMobile = Readonly<{
  id?: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  target?: "_self" | "_blank";
  rel?: string;
  variant?: "primary" | "secondary";
}>;

export type HeroPrimaryActionsMobileProps = Readonly<{
  items: readonly HeroPrimaryActionMobile[];
  className?: string;
}>;

export default function HeroPrimaryActionsMobile({
  items,
  className,
}: HeroPrimaryActionsMobileProps) {
  if (!items.length) {
    return null;
  }

  const rootStyle = useMemo<React.CSSProperties>(() => {
    const isSingle = items.length === 1;

    return {
      width: "100%",
      display: "grid",
      gridTemplateColumns: isSingle ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
      gap: "10px",
      alignItems: "stretch",
    };
  }, [items.length]);

  const getActionStyle = (
    variant: HeroPrimaryActionMobile["variant"]
  ): React.CSSProperties => {
    const isPrimary = (variant ?? "primary") === "primary";

    return {
      minHeight: "54px",
      width: "100%",
      padding: "12px 14px",
      borderRadius: "18px",
      border: isPrimary
        ? "1px solid rgba(255, 210, 120, 0.22)"
        : "1px solid rgba(255, 210, 120, 0.10)",
      background: isPrimary
        ? "linear-gradient(180deg, rgba(255, 205, 110, 0.16) 0%, rgba(255, 205, 110, 0.07) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
      boxShadow: isPrimary
        ? "0 14px 28px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.08)"
        : "0 12px 24px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255,255,255,0.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      textDecoration: "none",
      color: isPrimary
        ? "rgba(255, 247, 230, 0.98)"
        : "rgba(255, 243, 220, 0.92)",
      fontSize: "0.86rem",
      fontWeight: 800,
      letterSpacing: "0.01em",
      textAlign: "center",
      WebkitTapHighlightColor: "transparent",
      boxSizing: "border-box",
      transition:
        "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
    };
  };

  const iconWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "18px",
      height: "18px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    };
  }, []);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    return {
      minWidth: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    };
  }, []);

  return (
    <div className={className} style={rootStyle}>
      {items.map((item, index) => {
        const key = item.id ?? `${item.label}-${index}`;
        const target = item.target ?? "_blank";
        const rel =
          item.rel ?? (target === "_blank" ? "noreferrer noopener" : undefined);

        return (
          <a
            key={key}
            href={item.href}
            target={target}
            rel={rel}
            aria-label={item.ariaLabel ?? item.label}
            style={getActionStyle(item.variant)}
          >
            {item.icon ? <span style={iconWrapStyle}>{item.icon}</span> : null}
            <span style={labelStyle}>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
