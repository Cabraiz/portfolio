import {
  memo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import type { SectionRenderState } from "./useSectionRenderPolicy";

type LandingSectionShellProps = Readonly<{
  id: string;
  state: SectionRenderState;
  children: ReactNode;
  className?: string;
  placeholderMinHeight?: CSSProperties["minHeight"];
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
}> &
  Omit<HTMLAttributes<HTMLElement>, "children" | "id" | "style">;

type ExtendedCSSProperties = CSSProperties & {
  contentVisibility?: "visible" | "auto" | "hidden";
  containIntrinsicSize?: string;
};

const baseSectionStyle: ExtendedCSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box",
  overflow: "clip",
  contain: "layout paint style",
  contentVisibility: "auto",
  containIntrinsicSize: "100vh",
};

const baseContentStyle: CSSProperties = {
  width: "100%",
  minHeight: "100%",
  boxSizing: "border-box",
  transition:
    "opacity 240ms ease, transform 240ms ease, visibility 240ms ease",
  willChange: "transform, opacity",
  transformOrigin: "center top",
};

function getContentVisualStyle(state: SectionRenderState): CSSProperties {
  switch (state) {
    case "active":
      return {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
        pointerEvents: "auto",
        visibility: "visible",
      };

    case "near":
      return {
        opacity: 0.58,
        transform: "translate3d(0, 8px, 0) scale(0.988)",
        pointerEvents: "none",
        visibility: "visible",
      };

    case "far":
    default:
      return {
        opacity: 0,
        transform: "translate3d(0, 12px, 0) scale(0.98)",
        pointerEvents: "none",
        visibility: "hidden",
      };
  }
}

function getPlaceholderStyle(
  placeholderMinHeight: CSSProperties["minHeight"],
): CSSProperties {
  return {
    minHeight: placeholderMinHeight,
    width: "100%",
    boxSizing: "border-box",
    pointerEvents: "none",
    userSelect: "none",
  };
}

function LandingSectionShellComponent({
  id,
  state,
  children,
  className,
  placeholderMinHeight = "100vh",
  sectionStyle,
  contentStyle,
  ...rest
}: LandingSectionShellProps) {
  const shouldMountRealContent = state !== "far";

  return (
    <section
      id={id}
      data-section={id}
      data-page-section="true"
      data-render-state={state}
      data-section-active={state === "active" ? "true" : "false"}
      className={className}
      style={{
        ...baseSectionStyle,
        ...sectionStyle,
      }}
      aria-hidden={state === "far" ? "true" : undefined}
      {...rest}
    >
      {shouldMountRealContent ? (
        <div
          data-section-content="true"
          style={{
            ...baseContentStyle,
            ...getContentVisualStyle(state),
            ...contentStyle,
          }}
        >
          {children}
        </div>
      ) : (
        <div
          data-section-placeholder="true"
          aria-hidden="true"
          style={getPlaceholderStyle(placeholderMinHeight)}
        />
      )}
    </section>
  );
}

const LandingSectionShell = memo(LandingSectionShellComponent);

LandingSectionShell.displayName = "LandingSectionShell";

export default LandingSectionShell;
