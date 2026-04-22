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
  const hasBottomSlot = Boolean(bottomSlot);

  if (!hasRoleLabel && !hasSecondaryLabel && !hasBottomSlot) {
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
      padding: "0 6px",
      margin: 0,
      boxSizing: "border-box",
    };
  }, []);

  const roleBandStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "92%",
      maxWidth: "320px",
      minWidth: 0,
      height: "2.65rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "0 14px",
      boxSizing: "border-box",
      backgroundImage: "linear-gradient(90deg, #f1c40f 100%, #f1c40f 100%)",
      borderRadius: "10px",
      boxShadow:
        "0 8px 18px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.14)",
      overflow: "hidden",
    };
  }, []);

  const roleTextStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      color: "#111111",
      fontSize: "clamp(0.78rem, 3.5vw, 0.9rem)",
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textAlign: "left",
      width: "100%",
    };
  }, []);

  const secondaryStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      maxWidth: "28ch",
      color: "rgba(214, 198, 168, 0.78)",
      fontSize: "clamp(0.6rem, 2.55vw, 0.68rem)",
      lineHeight: 1.28,
      fontWeight: 600,
      letterSpacing: "0.015em",
      textWrap: "balance",
    };
  }, []);

  const bottomSlotWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginTop: "2px",
    };
  }, []);

  return (
    <div className={className} style={rootStyle}>
      {hasRoleLabel ? (
        <div style={roleBandStyle}>
          <p style={roleTextStyle}>{roleLabel}</p>
        </div>
      ) : null}

      {hasSecondaryLabel ? (
        <p style={secondaryStyle}>{secondaryLabel}</p>
      ) : null}

      {hasBottomSlot ? (
        <div style={bottomSlotWrapStyle}>{bottomSlot}</div>
      ) : null}
    </div>
  );
}
