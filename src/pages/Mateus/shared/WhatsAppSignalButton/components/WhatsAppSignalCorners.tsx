import { memo } from "react";
import styles from "./WhatsAppSignalCorners.module.css";

type CornerItemProps = Readonly<{
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function CornerItem({ className }: CornerItemProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={joinClasses(styles.corner, className)}
    >
      <path
        d="M34 6H16a10 10 0 0 0-10 10v18"
        className={styles.cornerPath}
      />
    </svg>
  );
}

function WhatsAppSignalCorners() {
  return (
    <>
      <CornerItem className={styles.cornerTopLeft} />
      <CornerItem className={styles.cornerTopRight} />
      <CornerItem className={styles.cornerBottomRight} />
      <CornerItem className={styles.cornerBottomLeft} />
    </>
  );
}

const MemoizedWhatsAppSignalCorners = memo(WhatsAppSignalCorners);
MemoizedWhatsAppSignalCorners.displayName = "WhatsAppSignalCorners";

export default MemoizedWhatsAppSignalCorners;
