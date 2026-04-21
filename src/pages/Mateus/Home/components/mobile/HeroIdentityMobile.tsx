import React, { useMemo, type CSSProperties } from "react";

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

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "12px",
      textAlign: "left",
      boxSizing: "border-box",
    };
  }, []);

  const seniorStyle = useMemo<CSSProperties>(() => {
    return {
      margin: 0,
      color: "#f3c400",
      fontSize: "clamp(1.85rem, 7vw, 2.6rem)",
      fontWeight: 900,
      lineHeight: 0.96,
      letterSpacing: "-0.035em",
      textShadow: "0 4px 22px rgba(243,196,0,0.14)",
    };
  }, []);

  const rolePillStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      padding: "15px 18px",
      borderRadius: "18px",
      border: "1px solid rgba(243, 196, 0, 0.72)",
      background:
        "linear-gradient(180deg, rgba(255,196,0,0.06) 0%, rgba(255,196,0,0.02) 100%)",
      boxSizing: "border-box",
      boxShadow:
        "0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
    };
  }, []);

  const roleTextStyle = useMemo<CSSProperties>(() => {
    return {
      margin: 0,
      color: "#f3c400",
      fontSize: "clamp(1.08rem, 4.8vw, 1.34rem)",
      fontWeight: 900,
      lineHeight: 1.08,
      letterSpacing: "-0.02em",
    };
  }, []);

  return (
    <div className={className} style={rootStyle}>
      {hasSeniorLabel ? <h2 style={seniorStyle}>{seniorLabel}</h2> : null}

      {hasRoleLabel ? (
        <div style={rolePillStyle}>
          <p style={roleTextStyle}>{roleLabel}</p>
        </div>
      ) : null}

      {bottomSlot ? <div>{bottomSlot}</div> : null}
    </div>
  );
}
