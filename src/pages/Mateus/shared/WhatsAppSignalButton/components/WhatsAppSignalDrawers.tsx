import { memo, type ReactNode } from "react";
import styles from "./WhatsAppSignalDrawers.module.css";

export type WhatsAppSignalDrawersProps = Readonly<{
  topLabel?: ReactNode;
  bottomLabel?: ReactNode;
  hideTopWhenEmpty?: boolean;
  hideBottomWhenEmpty?: boolean;
}>;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function hasRenderableContent(content: ReactNode): boolean {
  if (content === null || content === undefined || content === false) {
    return false;
  }

  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  return true;
}

function WhatsAppSignalDrawers({
  topLabel = "Contato direto",
  bottomLabel = "Resposta rápida",
  hideTopWhenEmpty = true,
  hideBottomWhenEmpty = true,
}: WhatsAppSignalDrawersProps) {
  const shouldRenderTop = hideTopWhenEmpty
    ? hasRenderableContent(topLabel)
    : true;

  const shouldRenderBottom = hideBottomWhenEmpty
    ? hasRenderableContent(bottomLabel)
    : true;

  return (
    <>
      {shouldRenderTop ? (
        <span
          className={joinClasses(styles.drawer, styles.drawerTop)}
          aria-hidden="true"
        >
          {topLabel}
        </span>
      ) : null}

      {shouldRenderBottom ? (
        <span
          className={joinClasses(styles.drawer, styles.drawerBottom)}
          aria-hidden="true"
        >
          {bottomLabel}
        </span>
      ) : null}
    </>
  );
}

const MemoizedWhatsAppSignalDrawers = memo(WhatsAppSignalDrawers);
MemoizedWhatsAppSignalDrawers.displayName = "WhatsAppSignalDrawers";

export default MemoizedWhatsAppSignalDrawers;
