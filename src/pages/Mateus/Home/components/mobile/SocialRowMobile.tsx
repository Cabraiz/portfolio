import React, { useMemo } from "react";

export type MobileSocialItem = Readonly<{
  id?: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  target?: "_self" | "_blank";
  rel?: string;
}>;

export type SocialRowMobileProps = Readonly<{
  items: readonly MobileSocialItem[];
  className?: string;
}>;

export default function SocialRowMobile({
  items,
  className,
}: SocialRowMobileProps) {
  if (!items.length) {
    return null;
  }

  const rowStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))`,
      gap: "10px",
      alignItems: "stretch",
    };
  }, [items.length]);

  const getButtonStyle = (): React.CSSProperties => {
    return {
      minHeight: "54px",
      padding: "12px 12px",
      borderRadius: "18px",
      border: "1px solid rgba(255, 215, 140, 0.14)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      boxShadow:
        "0 12px 24px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      textDecoration: "none",
      color: "rgba(255, 247, 230, 0.96)",
      fontSize: "0.82rem",
      fontWeight: 700,
      letterSpacing: "0.01em",
      textAlign: "center",
      WebkitTapHighlightColor: "transparent",
      transition:
        "transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease",
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
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    };
  }, []);

  return (
    <div className={className} style={rowStyle}>
      {items.map((item, index) => {
        const key = item.id ?? `${item.label}-${index}`;
        const target = item.target ?? "_blank";
        const rel = item.rel ?? (target === "_blank" ? "noreferrer noopener" : undefined);

        return (
          <a
            key={key}
            href={item.href}
            target={target}
            rel={rel}
            aria-label={item.ariaLabel ?? item.label}
            style={getButtonStyle()}
          >
            {item.icon ? <span style={iconWrapStyle}>{item.icon}</span> : null}
            <span style={labelStyle}>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
