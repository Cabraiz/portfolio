import {
  memo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { shouldDisableScrollFades } from "../../../features/scroll/scrollMotionFlags";
import {
  resolveLandingSectionBehavior,
  type LandingSectionBehavior,
} from "./landing.types";
import type { SectionRenderState } from "./useSectionRenderPolicy";

type LandingSectionShellProps = Readonly<{
  id: string;
  state: SectionRenderState;
  children: ReactNode;
  className?: string;
  behavior?: LandingSectionBehavior;
  placeholderMinHeight?: CSSProperties["minHeight"];
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
}> &
  Omit<HTMLAttributes<HTMLElement>, "children" | "id" | "style">;

const DEFAULT_PLACEHOLDER_MIN_HEIGHT = "100vh";

const baseSectionStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  minHeight: "100vh",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflowX: "clip",
  overflowY: "visible",
  isolation: "isolate",
};

function getBaseContentStyle(
  disableScrollFades: boolean,
  isAlwaysMounted: boolean,
): CSSProperties {
  return {
    width: "100%",
    minWidth: 0,
    minHeight: "100%",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    transition:
      disableScrollFades || isAlwaysMounted
        ? "none"
        : "opacity 160ms ease, transform 160ms ease, visibility 160ms ease",
    willChange:
      disableScrollFades || isAlwaysMounted ? "auto" : "opacity, transform",
    transformOrigin: "center top",
    backfaceVisibility: "hidden",
  };
}

function getContentVisualStyle(
  state: SectionRenderState,
  disableScrollFades: boolean,
  isAlwaysMounted: boolean,
): CSSProperties {
  if (isAlwaysMounted) {
    return {
      opacity: 1,
      transform: "translate3d(0, 0, 0)",
      pointerEvents: "auto",
      visibility: "visible",
    };
  }

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
        opacity: 0.98,
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
    width: "100%",
    minWidth: 0,
    minHeight: placeholderMinHeight,
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    flex: "0 0 auto",
    pointerEvents: "none",
    userSelect: "none",
    visibility: "hidden",
  };
}

function shouldRenderRealContent(
  state: SectionRenderState,
  behavior: ReturnType<typeof resolveLandingSectionBehavior>,
): boolean {
  if (behavior.renderStrategy === "always-mounted") {
    return true;
  }

  if (state === "active") {
    return true;
  }

  if (state === "near") {
    return behavior.keepMountedWhenNear;
  }

  return false;
}

function LandingSectionShellComponent({
  id,
  state,
  children,
  className,
  behavior,
  placeholderMinHeight = DEFAULT_PLACEHOLDER_MIN_HEIGHT,
  sectionStyle,
  contentStyle,
  ...rest
}: LandingSectionShellProps) {
  const disableScrollFades = shouldDisableScrollFades();
  const resolvedBehavior = resolveLandingSectionBehavior(behavior);
  const isAlwaysMounted = resolvedBehavior.renderStrategy === "always-mounted";

  const resolvedPlaceholderMinHeight =
    placeholderMinHeight ?? resolvedBehavior.placeholderFallbackMinHeight;

  const shouldMountRealContent = shouldRenderRealContent(
    state,
    resolvedBehavior,
  );

  const shouldRenderPlaceholder =
    !shouldMountRealContent &&
    resolvedBehavior.renderStrategy === "placeholder-when-far";

  const resolvedSectionStyle: CSSProperties = {
    ...baseSectionStyle,
    minHeight:
      sectionStyle?.minHeight ??
      resolvedPlaceholderMinHeight ??
      DEFAULT_PLACEHOLDER_MIN_HEIGHT,
    ...sectionStyle,
  };

  const resolvedContentStyle: CSSProperties = {
    ...getBaseContentStyle(disableScrollFades, isAlwaysMounted),
    ...getContentVisualStyle(state, disableScrollFades, isAlwaysMounted),
    ...contentStyle,
  };

  return (
    <section
      id={id}
      data-section={id}
      data-page-section="true"
      data-render-state={state}
      data-render-strategy={resolvedBehavior.renderStrategy}
      data-section-active={state === "active" ? "true" : "false"}
      data-section-mounted={shouldMountRealContent ? "true" : "false"}
      className={className}
      style={resolvedSectionStyle}
      aria-hidden={shouldRenderPlaceholder ? "true" : undefined}
      {...rest}
    >
      {shouldMountRealContent ? (
        <div
          data-section-content="true"
          style={resolvedContentStyle}
        >
          {children}
        </div>
      ) : null}

      {shouldRenderPlaceholder ? (
        <div
          data-section-placeholder="true"
          aria-hidden="true"
          style={getPlaceholderStyle(resolvedPlaceholderMinHeight)}
        />
      ) : null}
    </section>
  );
}

const LandingSectionShell = memo(LandingSectionShellComponent);

LandingSectionShell.displayName = "LandingSectionShell";

export default LandingSectionShell;
