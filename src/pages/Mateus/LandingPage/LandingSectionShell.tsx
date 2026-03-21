import {
  memo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { shouldDisableScrollFades } from "../../../features/scroll/scrollMotionFlags";
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
  contain: "layout paint",
  contentVisibility: "auto",
  containIntrinsicSize: "100vh",
};

function getBaseContentStyle(disableScrollFades: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    transition: disableScrollFades
      ? "none"
      : "opacity 140ms ease, transform 140ms ease, visibility 140ms ease",
    willChange: disableScrollFades ? "auto" : "opacity, transform",
    transformOrigin: "center top",
    backfaceVisibility: "hidden",
  };
}

function getContentVisualStyle(
  state: SectionRenderState,
  disableScrollFades: boolean,
): CSSProperties {
  if (disableScrollFades) {
    switch (state) {
      case "active":
        return {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
          pointerEvents: "auto",
          visibility: "visible",
        };

      case "near":
        return {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
          pointerEvents: "none",
          visibility: "visible",
        };

      case "far":
      default:
        return {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
          pointerEvents: "none",
          visibility: "hidden",
        };
    }
  }

  switch (state) {
    case "active":
      return {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        pointerEvents: "auto",
        visibility: "visible",
      };

    case "near":
      return {
        opacity: 0.96,
        transform: "translate3d(0, 2px, 0)",
        pointerEvents: "none",
        visibility: "visible",
      };

    case "far":
    default:
      return {
        opacity: 0,
        transform: "translate3d(0, 6px, 0)",
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
  const disableScrollFades = shouldDisableScrollFades();
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
            ...getBaseContentStyle(disableScrollFades),
            ...getContentVisualStyle(state, disableScrollFades),
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
