import React, { useMemo } from "react";

import { homeHeroTokens } from "../../layout/homeHero.tokens";

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
      gridTemplateColumns: isSingle
        ? "minmax(0, 1fr)"
        : "repeat(2, minmax(0, 1fr))",
      gap: homeHeroTokens.primaryActions.gap.default,
      alignItems: "stretch",
      boxSizing: "border-box",
    };
  }, [items.length]);

  const getActionStyle = (
    variant: HeroPrimaryActionMobile["variant"],
  ): React.CSSProperties => {
    const isPrimary = (variant ?? "primary") === "primary";

    return {
      position: "relative",
      minHeight: homeHeroTokens.primaryActions.height,
      width: "100%",
      padding: homeHeroTokens.primaryActions.padding,
      borderRadius: homeHeroTokens.primaryActions.borderRadius,
      border: isPrimary
        ? homeHeroTokens.primaryActions.primary.border
        : homeHeroTokens.primaryActions.secondary.border,
      background: isPrimary
        ? homeHeroTokens.primaryActions.primary.background
        : homeHeroTokens.primaryActions.secondary.background,
      boxShadow: isPrimary
        ? homeHeroTokens.primaryActions.primary.shadow
        : homeHeroTokens.primaryActions.secondary.shadow,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      textDecoration: "none",
      color: isPrimary
        ? homeHeroTokens.primaryActions.primary.color
        : homeHeroTokens.primaryActions.secondary.color,
      fontSize: homeHeroTokens.primaryActions.fontSize,
      fontWeight: 800,
      letterSpacing: "-0.01em",
      textAlign: "center",
      WebkitTapHighlightColor: "transparent",
      boxSizing: "border-box",
      overflow: "hidden",
      transition:
        "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
    };
  };

  const actionGlowStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(90deg, rgba(255,210,120,0.00) 0%, rgba(255,210,120,0.06) 20%, rgba(255,210,120,0.12) 50%, rgba(255,210,120,0.06) 80%, rgba(255,210,120,0.00) 100%)",
      opacity: 0.9,
    };
  }, []);

  const iconWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: homeHeroTokens.primaryActions.iconSize,
      height: homeHeroTokens.primaryActions.iconSize,
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
      minWidth: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      lineHeight: 1,
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
            <span style={actionGlowStyle} />
            {item.icon ? <span style={iconWrapStyle}>{item.icon}</span> : null}
            <span style={labelStyle}>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
