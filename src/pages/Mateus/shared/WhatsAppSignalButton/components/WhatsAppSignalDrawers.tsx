import { memo, type ReactNode } from "react";

export type WhatsAppSignalDrawersProps = Readonly<{
  topLabel?: ReactNode;
  bottomLabel?: ReactNode;
  drawerClassName: string;
  topDrawerClassName: string;
  bottomDrawerClassName: string;
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
  drawerClassName,
  topDrawerClassName,
  bottomDrawerClassName,
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
          className={joinClasses(drawerClassName, topDrawerClassName)}
          aria-hidden="true"
        >
          {topLabel}
        </span>
      ) : null}

      {shouldRenderBottom ? (
        <span
          className={joinClasses(drawerClassName, bottomDrawerClassName)}
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
