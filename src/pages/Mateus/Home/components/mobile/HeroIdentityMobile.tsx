import React, { useMemo } from "react";

export type HeroIdentityMobileProps = Readonly<{
  seniorLabel?: string;
  roleLabel: string;
  bottomSlot?: React.ReactNode;
  className?: string;
}>;

export default function HeroIdentityMobile({
  seniorLabel,
  roleLabel,
  bottomSlot,
  className,
}: HeroIdentityMobileProps) {
  const hasSeniorLabel = Boolean(seniorLabel?.trim());
  const hasRoleLabel = Boolean(roleLabel?.trim());

  if (!hasSeniorLabel && !hasRoleLabel && !bottomSlot) {
    return null;
  }

  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      gap: "8px",
      width: "min(78%, 240px)",
      pointerEvents: "none",
      boxSizing: "border-box",
    };
  }, []);

  const seniorStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      color: "#f2c318",
      fontSize: "clamp(1.7rem, 5.6vw, 2.25rem)",
      fontWeight: 800,
      lineHeight: 0.9,
      letterSpacing: "-0.04em",
      textTransform: "none",
      textShadow: "0 8px 20px rgba(0,0,0,0.42)",
      pointerEvents: "none",
    };
  }, []);

  const roleStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "42px",
      padding: "10px 16px",
      borderRadius: "14px",
      background:
        "linear-gradient(180deg, rgba(18,18,20,0.88) 0%, rgba(8,8,10,0.94) 100%)",
      border: "1px solid rgba(242, 195, 24, 0.92)",
      color: "#f2c318",
      fontSize: "clamp(0.95rem, 3.6vw, 1.15rem)",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      boxShadow:
        "0 14px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
      pointerEvents: "none",
      boxSizing: "border-box",
      maxWidth: "100%",
    };
  }, []);

  return (
    <div className={className} style={rootStyle}>
      {hasSeniorLabel ? <h2 style={seniorStyle}>{seniorLabel}</h2> : null}
      {hasRoleLabel ? <div style={roleStyle}>{roleLabel}</div> : null}
      {bottomSlot}
    </div>
  );
}
