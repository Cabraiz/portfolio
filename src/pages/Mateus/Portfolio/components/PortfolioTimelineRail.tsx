import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import type { PortfolioProjectListItem, PortfolioProjectId } from "../types";
import styles from "./PortfolioTimelineRail.module.css";

type PortfolioTimelineRailProps = Readonly<{
  projects: readonly PortfolioProjectListItem[];
  activeIndex: number;
  activeProjectId: PortfolioProjectId;
  onSelectProject: (projectId: PortfolioProjectId) => void;
  onSelectProjectIndex: (index: number) => void;
  onMovePrevious?: () => void;
  onMoveNext?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  className?: string;
  ariaLabel?: string;
}>;

type PickerAxis = "vertical" | "horizontal";

type VisibleProjectSlot = Readonly<{
  slotIndex: number;
  projectIndex: number;
  project: PortfolioProjectListItem;
  isActive: boolean;
}> | null;

const MOBILE_PICKER_BREAKPOINT_PX = 960;
const DESKTOP_VISIBLE_ITEMS = 4;
const DESKTOP_ACTIVE_SLOT = 2;
const WHEEL_NAVIGATION_LOCK_MS = 180;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function clampIndex(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function wrapIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return ((index % total) + total) % total;
}

function resolvePickerAxis(): PickerAxis {
  if (typeof globalThis.window === "undefined") {
    return "vertical";
  }

  return globalThis.matchMedia(
    `(max-width: ${MOBILE_PICKER_BREAKPOINT_PX}px)`,
  ).matches
    ? "horizontal"
    : "vertical";
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

function getWindowStart(
  activeIndex: number,
  total: number,
  visibleCount: number,
  activeSlot: number,
): number {
  if (total <= visibleCount) {
    return 0;
  }

  const rawStart = activeIndex - activeSlot;
  const maxStart = total - visibleCount;

  return clampIndex(rawStart, 0, maxStart);
}

function PortfolioTimelineRailComponent({
  projects,
  activeIndex,
  activeProjectId,
  onSelectProject,
  onSelectProjectIndex,
  onMovePrevious,
  onMoveNext,
  onHoverStart,
  onHoverEnd,
  className,
  ariaLabel = "Navegação dos projetos do portfólio",
}: PortfolioTimelineRailProps) {
  const wheelUnlockTimeoutRef = useRef<number | null>(null);
  const pendingFocusProjectIdRef = useRef<PortfolioProjectId | null>(null);
  const buttonRefs = useRef<
    Partial<Record<PortfolioProjectId, HTMLButtonElement | null>>
  >({});

  const [pickerAxis, setPickerAxis] = useState<PickerAxis>(resolvePickerAxis);

  const totalProjects = projects.length;

  const safeActiveIndex = useMemo(
    () => clampIndex(activeIndex, 0, Math.max(totalProjects - 1, 0)),
    [activeIndex, totalProjects],
  );

  const windowStart = useMemo(
    () =>
      getWindowStart(
        safeActiveIndex,
        totalProjects,
        DESKTOP_VISIBLE_ITEMS,
        DESKTOP_ACTIVE_SLOT,
      ),
    [safeActiveIndex, totalProjects],
  );

  const desktopVisibleSlots = useMemo<readonly VisibleProjectSlot[]>(
    () =>
      Array.from({ length: DESKTOP_VISIBLE_ITEMS }, (_, slotIndex) => {
        const projectIndex = windowStart + slotIndex;
        const project = projects[projectIndex];

        if (!project) {
          return null;
        }

        return {
          slotIndex,
          projectIndex,
          project,
          isActive: project.id === activeProjectId,
        };
      }),
    [activeProjectId, projects, windowStart],
  );

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return undefined;
    }

    function handleResize() {
      setPickerAxis(resolvePickerAxis());
    }

    handleResize();
    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return undefined;
    }

    if (!pendingFocusProjectIdRef.current) {
      return undefined;
    }

    const nextFocusedProjectId = pendingFocusProjectIdRef.current;
    const frameId = globalThis.requestAnimationFrame(() => {
      const button = buttonRefs.current[nextFocusedProjectId];

      if (!button) {
        return;
      }

      try {
        button.focus({ preventScroll: true });
      } catch {
        button.focus();
      }

      pendingFocusProjectIdRef.current = null;
    });

    return () => {
      globalThis.cancelAnimationFrame(frameId);
    };
  }, [activeProjectId, pickerAxis, windowStart]);

  useEffect(() => {
    return () => {
      if (
        typeof globalThis.window !== "undefined" &&
        wheelUnlockTimeoutRef.current !== null
      ) {
        globalThis.clearTimeout(wheelUnlockTimeoutRef.current);
      }
    };
  }, []);

  const focusProjectByIndex = useCallback(
    (projectIndex: number) => {
      const project = projects[projectIndex];

      if (!project) {
        return;
      }

      pendingFocusProjectIdRef.current = project.id;
    },
    [projects],
  );

  const handleSelectIndex = useCallback(
    (
      nextIndex: number,
      options: Readonly<{
        focus?: boolean;
      }> = {},
    ) => {
      if (totalProjects === 0) {
        return;
      }

      const clampedIndex = clampIndex(nextIndex, 0, totalProjects - 1);
      const nextProject = projects[clampedIndex];

      if (!nextProject) {
        return;
      }

      if (options.focus) {
        focusProjectByIndex(clampedIndex);
      }

      onSelectProjectIndex(clampedIndex);
    },
    [focusProjectByIndex, onSelectProjectIndex, projects, totalProjects],
  );

  const handleMovePrevious = useCallback(
    (options: Readonly<{ focus?: boolean }> = {}) => {
      if (totalProjects <= 1) {
        return;
      }

      const nextIndex = wrapIndex(safeActiveIndex - 1, totalProjects);

      if (options.focus) {
        focusProjectByIndex(nextIndex);
      }

      onMovePrevious?.();
    },
    [focusProjectByIndex, onMovePrevious, safeActiveIndex, totalProjects],
  );

  const handleMoveNext = useCallback(
    (options: Readonly<{ focus?: boolean }> = {}) => {
      if (totalProjects <= 1) {
        return;
      }

      const nextIndex = wrapIndex(safeActiveIndex + 1, totalProjects);

      if (options.focus) {
        focusProjectByIndex(nextIndex);
      }

      onMoveNext?.();
    },
    [focusProjectByIndex, onMoveNext, safeActiveIndex, totalProjects],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLElement>) => {
      if (pickerAxis !== "vertical" || totalProjects <= DESKTOP_VISIBLE_ITEMS) {
        return;
      }

      if (Math.abs(event.deltaY) < 8) {
        return;
      }

      event.preventDefault();

      if (wheelUnlockTimeoutRef.current !== null) {
        return;
      }

      if (event.deltaY > 0) {
        handleMoveNext();
      } else {
        handleMovePrevious();
      }

      wheelUnlockTimeoutRef.current = globalThis.window.setTimeout(() => {
        wheelUnlockTimeoutRef.current = null;
      }, WHEEL_NAVIGATION_LOCK_MS);
    },
    [handleMoveNext, handleMovePrevious, pickerAxis, totalProjects],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (isTypingTarget(event.target) || totalProjects <= 1) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "ArrowLeft": {
          event.preventDefault();
          event.stopPropagation();
          handleMovePrevious({ focus: true });
          return;
        }

        case "ArrowDown":
        case "ArrowRight": {
          event.preventDefault();
          event.stopPropagation();
          handleMoveNext({ focus: true });
          return;
        }

        case "Home": {
          event.preventDefault();
          event.stopPropagation();
          handleSelectIndex(0, { focus: true });
          return;
        }

        case "End": {
          event.preventDefault();
          event.stopPropagation();
          handleSelectIndex(totalProjects - 1, { focus: true });
          return;
        }

        case "PageUp": {
          event.preventDefault();
          event.stopPropagation();
          handleSelectIndex(safeActiveIndex - DESKTOP_VISIBLE_ITEMS, {
            focus: true,
          });
          return;
        }

        case "PageDown": {
          event.preventDefault();
          event.stopPropagation();
          handleSelectIndex(safeActiveIndex + DESKTOP_VISIBLE_ITEMS, {
            focus: true,
          });
          return;
        }

        default:
          return;
      }
    },
    [
      handleMoveNext,
      handleMovePrevious,
      handleSelectIndex,
      safeActiveIndex,
      totalProjects,
    ],
  );

  const handleBlurCapture = useCallback(
    (event: ReactFocusEvent<HTMLElement>) => {
      const nextFocusedElement = event.relatedTarget;

      if (
        nextFocusedElement instanceof Node &&
        event.currentTarget.contains(nextFocusedElement)
      ) {
        return;
      }

      onHoverEnd?.();
    },
    [onHoverEnd],
  );

  const renderProjectButton = useCallback(
    (project: PortfolioProjectListItem, projectIndex: number, isActive: boolean) => (
      <button
        ref={(element) => {
          buttonRefs.current[project.id] = element;
        }}
        type="button"
        className={joinClasses(
          styles.portfolioTimelineButton,
          isActive && styles.portfolioTimelineButtonActive,
        )}
        onClick={() => onSelectProject(project.id)}
        aria-current={isActive ? "true" : undefined}
        aria-label={`Abrir projeto ${project.name}`}
        data-project-id={project.id}
        data-project-index={projectIndex}
        data-project-active={isActive ? "true" : "false"}
      >
        <span className={styles.portfolioTimelineContent}>
          <span className={styles.portfolioTimelineMetaRow}>
            <span className={styles.portfolioTimelineYear}>{project.year}</span>

            <span className={styles.portfolioTimelineIndex}>
              {String(projectIndex + 1).padStart(2, "0")}
            </span>
          </span>

          <span className={styles.portfolioTimelineProjectName}>
            {project.name}
          </span>

          <span
            className={joinClasses(
              styles.portfolioTimelineStatus,
              isActive && styles.portfolioTimelineStatusActive,
            )}
          >
            {isActive ? "Atual" : "Selecionar"}
          </span>
        </span>
      </button>
    ),
    [onSelectProject],
  );

  return (
    <nav
      className={joinClasses(styles.portfolioTimelineRail, className)}
      data-portfolio-timeline="true"
      data-picker-axis={pickerAxis}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocusCapture={onHoverStart}
      onBlurCapture={handleBlurCapture}
    >
      <div className={styles.portfolioTimelineRailHeader}>
        <span className={styles.portfolioTimelineRailTitle}>Projetos</span>

        <span className={styles.portfolioTimelineRailCount}>
          {String(totalProjects).padStart(2, "0")}
        </span>
      </div>

      <div className={styles.portfolioTimelineRailBody}>
        <div className={styles.portfolioTimelineViewport}>
          {pickerAxis === "horizontal" ? (
            <ul className={styles.portfolioTimelineListMobile}>
              {projects.map((project, index) => {
                const isActive = project.id === activeProjectId;

                return (
                  <li
                    key={project.id}
                    className={joinClasses(
                      styles.portfolioTimelineItemMobile,
                      isActive && styles.portfolioTimelineItemMobileActive,
                    )}
                  >
                    {renderProjectButton(project, index, isActive)}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className={styles.portfolioTimelineList}>
              {desktopVisibleSlots.map((slot, slotIndex) => {
                if (!slot) {
                  return (
                    <li
                      key={`empty-slot-${slotIndex}`}
                      className={joinClasses(
                        styles.portfolioTimelineItem,
                        styles.portfolioTimelineItemEmpty,
                      )}
                      aria-hidden="true"
                    />
                  );
                }

                return (
                  <li
                    key={slot.project.id}
                    className={joinClasses(
                      styles.portfolioTimelineItem,
                      slot.isActive && styles.portfolioTimelineItemActive,
                    )}
                  >
                    {renderProjectButton(
                      slot.project,
                      slot.projectIndex,
                      slot.isActive,
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={styles.portfolioTimelineTracker} aria-hidden="true">
          <ol className={styles.portfolioTimelineTrackerList}>
            {projects.map((project, index) => {
              const isActive = index === safeActiveIndex;

              return (
                <li
                  key={`${project.id}-tracker`}
                  className={styles.portfolioTimelineTrackerItem}
                >
                  <button
                    type="button"
                    className={joinClasses(
                      styles.portfolioTimelineTrackerButton,
                      isActive && styles.portfolioTimelineTrackerButtonActive,
                    )}
                    onClick={() => handleSelectIndex(index)}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <span
                      className={joinClasses(
                        styles.portfolioTimelineTrackerGlyph,
                        isActive && styles.portfolioTimelineTrackerGlyphActive,
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
}

const PortfolioTimelineRail = memo(PortfolioTimelineRailComponent);

PortfolioTimelineRail.displayName = "PortfolioTimelineRail";

export default PortfolioTimelineRail;
