import React, { useMemo } from "react";

export type HeroIdentityMobileProps = Readonly<{
  roleLabel?: string;
  secondaryLabel?: string;
  bottomSlot?: React.ReactNode;
  className?: string;
}>;

export default function HeroIdentityMobile({
  roleLabel,
  secondaryLabel,
  bottomSlot,
  className,
}: HeroIdentityMobileProps) {
  const hasRoleLabel = Boolean(roleLabel?.trim());
  const hasSecondaryLabel = Boolean(secondaryLabel?.trim());

  if (!hasRoleLabel && !hasSecondaryLabel && !bottomSlot) {
    return null;
  }

  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      textAlign: "center",
    };
  }, []);

  const roleStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      color: "rgba(255, 248, 230, 0.96)",
      fontSize: "clamp(1rem, 3.9vw, 1.18rem)",
      lineHeight: 1.15,
      fontWeight: 700,
      letterSpacing: "0.02em",
      textWrap: "balance",
    };
  }, []);

  const secondaryStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      maxWidth: "28ch",
      color: "rgba(255, 235, 190, 0.74)",
      fontSize: "clamp(0.76rem, 3vw, 0.9rem)",
      lineHeight: 1.35,
      fontWeight: 500,
      letterSpacing: "0.015em",
      textWrap: "balance",
    };
  }, []);

  return (
    <div className={className} style={rootStyle}>
      {hasRoleLabel ? <p style={roleStyle}>{roleLabel}</p> : null}
      {hasSecondaryLabel ? (
        <p style={secondaryStyle}>{secondaryLabel}</p>
      ) : null}
      {bottomSlot}
    </div>
  );
}
