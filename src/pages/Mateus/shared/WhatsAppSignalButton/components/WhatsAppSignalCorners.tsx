import { memo } from "react";

export type WhatsAppSignalCornersProps = Readonly<{
  cornerClassName: string;
  cornerPathClassName: string;
  topLeftClassName: string;
  topRightClassName: string;
  bottomRightClassName: string;
  bottomLeftClassName: string;
}>;

type CornerItemProps = Readonly<{
  className: string;
  pathClassName: string;
}>;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function CornerItem({ className, pathClassName }: CornerItemProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M34 6H16a10 10 0 0 0-10 10v18"
        className={pathClassName}
      />
    </svg>
  );
}

function WhatsAppSignalCorners({
  cornerClassName,
  cornerPathClassName,
  topLeftClassName,
  topRightClassName,
  bottomRightClassName,
  bottomLeftClassName,
}: WhatsAppSignalCornersProps) {
  return (
    <>
      <CornerItem
        className={joinClasses(cornerClassName, topLeftClassName)}
        pathClassName={cornerPathClassName}
      />

      <CornerItem
        className={joinClasses(cornerClassName, topRightClassName)}
        pathClassName={cornerPathClassName}
      />

      <CornerItem
        className={joinClasses(cornerClassName, bottomRightClassName)}
        pathClassName={cornerPathClassName}
      />

      <CornerItem
        className={joinClasses(cornerClassName, bottomLeftClassName)}
        pathClassName={cornerPathClassName}
      />
    </>
  );
}

const MemoizedWhatsAppSignalCorners = memo(WhatsAppSignalCorners);
MemoizedWhatsAppSignalCorners.displayName = "WhatsAppSignalCorners";

export default MemoizedWhatsAppSignalCorners;
