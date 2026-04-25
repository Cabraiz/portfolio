import React, { useMemo } from "react";

import { homeHeroTokens } from "../../layout/homeHero.tokens";

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
  showLabels?: boolean;
}>;

export default function SocialRowMobile({
  items,
  className,
  showLabels = homeHeroTokens.socialRow.showLabelsByDefault,
}: SocialRowMobileProps) {
  if (!items.length) {
    return null;
  }

  const rowStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))`,
      gap: homeHeroTokens.socialRow.gap.default,
      alignItems: "stretch",
      boxSizing: "border-box",
    };
  }, [items.length]);

  const getButtonStyle = (): React.CSSProperties => {
    return {
      position: "relative",
      minHeight: homeHeroTokens.socialRow.dock.minHeight,
      padding: showLabels
        ? homeHeroTokens.socialRow.dock.paddingWithLabel
        : homeHeroTokens.socialRow.dock.paddingIconOnly,
      borderRadius: homeHeroTokens.socialRow.dock.borderRadius,
      border: homeHeroTokens.socialRow.dock.border,
      background: homeHeroTokens.socialRow.dock.background,
      boxShadow: homeHeroTokens.socialRow.dock.shadow,
      display: "flex",
      flexDirection: showLabels ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      gap: showLabels ? "8px" : "0",
      textDecoration: "none",
      color: homeHeroTokens.socialRow.dock.color,
      textAlign: "center",
      WebkitTapHighlightColor: "transparent",
      overflow: "hidden",
      transition:
        "transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
      boxSizing: "border-box",
    };
  };

  const glowStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 34%, rgba(255,210,120,0.05) 100%)",
      opacity: 0.9,
    };
  }, []);

  const iconWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: homeHeroTokens.socialRow.dock.iconSize,
      height: homeHeroTokens.socialRow.dock.iconSize,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    };
  }, []);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: homeHeroTokens.socialRow.dock.labelFontSize,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      color: homeHeroTokens.socialRow.dock.labelColor,
      opacity: 0.92,
    };
  }, []);

  return (
    <div className={className} style={rowStyle}>
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
            style={getButtonStyle()}
          >
            <span style={glowStyle} />
            {item.icon ? <span style={iconWrapStyle}>{item.icon}</span> : null}
            {showLabels ? <span style={labelStyle}>{item.label}</span> : null}
          </a>
        );
      })}
    </div>
  );
}
