import { memo, type ReactNode } from "react";
import styles from "./WhatsAppHeroSlot.module.css";
import {
  getWhatsAppHeroSlotCssVars,
  type WhatsAppSignalDensity,
} from "./whatsAppSignal.tokens";

export type WhatsAppHeroSlotProps = Readonly<{
  primary: ReactNode;
  secondary?: ReactNode;
  compact?: boolean;
  preserveDesktopOffset?: boolean;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}>;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function WhatsAppHeroSlot({
  primary,
  secondary,
  compact = false,
  preserveDesktopOffset = true,
  className,
  primaryClassName,
  secondaryClassName,
}: WhatsAppHeroSlotProps) {
  const density: WhatsAppSignalDensity = compact ? "compact" : "default";
  const hasSecondary = Boolean(secondary);

  return (
    <div
      className={joinClasses(
        styles.root,
        compact && styles.compact,
        !preserveDesktopOffset && styles.noDesktopOffset,
        !hasSecondary && styles.singleAction,
        className
      )}
      data-density={density}
      data-has-secondary={hasSecondary ? "true" : "false"}
      data-preserve-desktop-offset={preserveDesktopOffset ? "true" : "false"}
      style={getWhatsAppHeroSlotCssVars(density)}
    >
      <div className={styles.rail}>
        <div className={styles.grid}>
          <div
            className={joinClasses(
              styles.slot,
              styles.primarySlot,
              primaryClassName
            )}
          >
            {primary}
          </div>

          {hasSecondary ? (
            <div
              className={joinClasses(
                styles.slot,
                styles.secondarySlot,
                secondaryClassName
              )}
            >
              {secondary}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const MemoizedWhatsAppHeroSlot = memo(WhatsAppHeroSlot);
MemoizedWhatsAppHeroSlot.displayName = "WhatsAppHeroSlot";

export default MemoizedWhatsAppHeroSlot;
