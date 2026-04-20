import React, { useMemo } from "react";

export type MobileSocialItem = Readonly<{
  key: string;
  href: string;
  icon: string;
  alt: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
}>;

export type SocialRowMobileProps = Readonly<{
  items: readonly MobileSocialItem[];
  className?: string;
  iconBoxSize?: number;
  iconGlyphSize?: number;
}>;

const MAX_ITEMS = 3;

export default function SocialRowMobile({
  items,
  className,
  iconBoxSize = 44,
  iconGlyphSize = 22,
}: SocialRowMobileProps) {
  const visibleItems = useMemo(() => {
    return items.slice(0, MAX_ITEMS);
  }, [items]);

  const rowStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "grid",
      gridTemplateColumns: `repeat(${visibleItems.length || 3}, minmax(0, 1fr))`,
      gap: "12px",
      alignItems: "center",
      justifyItems: "center",
    };
  }, [visibleItems.length]);

  const buttonStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: `${iconBoxSize}px`,
      height: `${iconBoxSize}px`,
      minWidth: `${iconBoxSize}px`,
      minHeight: `${iconBoxSize}px`,
      aspectRatio: "1 / 1",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "12px",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow:
        "0 10px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
      textDecoration: "none",
      transition:
        "transform 160ms ease, border-color 160ms ease, background 160ms ease",
      boxSizing: "border-box",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    };
  }, [iconBoxSize]);

  const iconStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: `${iconGlyphSize}px`,
      height: `${iconGlyphSize}px`,
      minWidth: `${iconGlyphSize}px`,
      minHeight: `${iconGlyphSize}px`,
      aspectRatio: "1 / 1",
      objectFit: "contain",
      display: "block",
      flex: "0 0 auto",
      imageRendering: "auto",
      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.16))",
    };
  }, [iconGlyphSize]);

  return (
    <div className={className} style={rowStyle}>
      {visibleItems.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.target ?? "_blank"}
          rel={item.rel ?? "noreferrer"}
          aria-label={item.alt}
          title={item.alt}
          style={buttonStyle}
        >
          <img src={item.icon} alt={item.alt} style={iconStyle} />
        </a>
      ))}
    </div>
  );
}
