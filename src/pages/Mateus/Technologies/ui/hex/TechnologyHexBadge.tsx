import React, { memo } from "react";

export type TechnologyBadgeTone =
  | "neutral"
  | "cloud"
  | "frontend"
  | "backend"
  | "data"
  | "qa"
  | "observability";

type TechnologyHexBadgeProps = Readonly<{
  label: string;
  tone?: TechnologyBadgeTone;
  emphasis?: "soft" | "strong";
  title?: string;
  className?: string;
}>;

const TONE_STYLES: Record<
  TechnologyBadgeTone,
  Readonly<{
    background: string;
    borderColor: string;
    color: string;
  }>
> = {
  neutral: {
    background: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 245, 230, 0.84)",
  },
  cloud: {
    background: "rgba(73, 139, 255, 0.16)",
    borderColor: "rgba(73, 139, 255, 0.28)",
    color: "#e8f1ff",
  },
  frontend: {
    background: "rgba(61, 215, 188, 0.16)",
    borderColor: "rgba(61, 215, 188, 0.28)",
    color: "#e6fffa",
  },
  backend: {
    background: "rgba(255, 170, 76, 0.16)",
    borderColor: "rgba(255, 170, 76, 0.28)",
    color: "#fff3e4",
  },
  data: {
    background: "rgba(168, 122, 255, 0.16)",
    borderColor: "rgba(168, 122, 255, 0.28)",
    color: "#f3ecff",
  },
  qa: {
    background: "rgba(255, 111, 145, 0.16)",
    borderColor: "rgba(255, 111, 145, 0.28)",
    color: "#ffeaf0",
  },
  observability: {
    background: "rgba(255, 214, 84, 0.16)",
    borderColor: "rgba(255, 214, 84, 0.28)",
    color: "#fff7dd",
  },
};

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function TechnologyHexBadgeComponent({
  label,
  tone = "neutral",
  emphasis = "soft",
  title,
  className,
}: TechnologyHexBadgeProps) {
  const toneStyle = TONE_STYLES[tone];

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    padding: emphasis === "strong" ? "7px 12px" : "6px 11px",
    borderRadius: 999,
    border: `1px solid ${toneStyle.borderColor}`,
    background: toneStyle.background,
    color: toneStyle.color,
    fontSize: "0.72rem",
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    boxShadow:
      emphasis === "strong"
        ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 18px rgba(0,0,0,0.14)"
        : "inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <span className={joinClasses(className)} style={style} title={title}>
      {label}
    </span>
  );
}

const TechnologyHexBadge = memo(TechnologyHexBadgeComponent);
TechnologyHexBadge.displayName = "TechnologyHexBadge";

export default TechnologyHexBadge;
