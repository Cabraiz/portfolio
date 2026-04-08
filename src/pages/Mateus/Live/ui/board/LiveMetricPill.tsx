// src/pages/Mateus/Live/ui/board/LiveMetricPill.tsx

import { type CSSProperties, type ReactNode } from "react";

import type { LiveProjectStatus } from "../../domain/live.types";
import styles from "./LiveStatsBoard.module.css";

export type LiveMetricPillProps = Readonly<{
  label: string;
  value?: ReactNode;
  className?: string;
  title?: string;
  ariaLabel?: string;
  status?: LiveProjectStatus;
  accentToken?: string;
  selected?: boolean;
  onClick?: () => void;
}>;

type MetricCssVariables = CSSProperties & {
  "--live-board-accent"?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function getAccessibleValueText(value: ReactNode): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return null;
}

export default function LiveMetricPill({
  label,
  value,
  className,
  title,
  ariaLabel,
  status,
  accentToken,
  selected = false,
  onClick,
}: LiveMetricPillProps) {
  const style: MetricCssVariables = {
    "--live-board-accent": accentToken,
  };

  const hasValue = value !== undefined && value !== null;
  const accessibleValueText = getAccessibleValueText(value);

  const resolvedButtonAriaLabel =
    ariaLabel ?? (accessibleValueText ? `${label}: ${accessibleValueText}` : label);

  if (onClick) {
    return (
      <button
        type="button"
        className={joinClassNames(styles.statusPill, className)}
        style={{
          ...style,
          appearance: "none",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          background: "transparent",
        }}
        title={title}
        aria-label={resolvedButtonAriaLabel}
        data-status={status}
        data-selected={selected ? "true" : "false"}
        onClick={onClick}
      >
        <span className={styles.statusPillLabel}>{label}</span>

        {hasValue ? (
          <strong className={styles.statusPillValue}>{value}</strong>
        ) : null}
      </button>
    );
  }

  return (
    <div
      className={joinClassNames(styles.statusPill, className)}
      style={style}
      title={title}
      aria-label={ariaLabel}
      data-status={status}
      data-selected={selected ? "true" : "false"}
    >
      <span className={styles.statusPillLabel}>{label}</span>

      {hasValue ? (
        <strong className={styles.statusPillValue}>{value}</strong>
      ) : null}
    </div>
  );
}
