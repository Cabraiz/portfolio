import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import "./model/portfolio.tokens.css";
import rootStyles from "./core/PortfolioRoot.module.css";

import {
  defaultPortfolioProjectId,
  portfolioProjects,
} from "./portfolio.data";

import usePortfolioActiveItem from "./hooks/usePortfolioActiveItem";

import PortfolioStage from "./components/PortfolioStage";
import PortfolioTimelineRail from "./ui/rail/PortfolioTimelineRail";

type PortfolioHeightMode = "compact" | "default" | "tall";

type PortfolioResponsivePreset = Readonly<{
  sectionMinHeight: string;
  sectionPaddingTop: string;
  sectionPaddingBottom: string;
  layoutGap: string;
  railColumnWidth: string;
  railCounterSize: string;
  railGap: string;
  timelineMaxHeight: string;
  controlSize: string;
}>;

const PORTFOLIO_COMPACT_HEIGHT_MAX = 820;
const PORTFOLIO_TALL_HEIGHT_MIN = 980;
const PORTFOLIO_AUTOPLAY_INTERVAL_MS = 4200;
const PORTFOLIO_SECTION_MIN_HEIGHT =
  "calc(100dvh - var(--app-navbar-height, 70px))";

const PORTFOLIO_RESPONSIVE_PRESETS: Record<
  PortfolioHeightMode,
  PortfolioResponsivePreset
> = {
  compact: {
    sectionMinHeight: PORTFOLIO_SECTION_MIN_HEIGHT,
    sectionPaddingTop: "clamp(22px, 5.5dvh, 52px)",
    sectionPaddingBottom: "clamp(22px, 5.5dvh, 52px)",
    layoutGap: "12px",
    railColumnWidth: "246px",
    railCounterSize: "clamp(5.15rem, 6.4vw, 6.75rem)",
    railGap: "12px",
    timelineMaxHeight: "100%",
    controlSize: "38px",
  },
  default: {
    sectionMinHeight: PORTFOLIO_SECTION_MIN_HEIGHT,
    sectionPaddingTop: "clamp(30px, 7.5dvh, 84px)",
    sectionPaddingBottom: "clamp(30px, 7.5dvh, 84px)",
    layoutGap: "16px",
    railColumnWidth: "284px",
    railCounterSize: "clamp(5.75rem, 8vw, 8rem)",
    railGap: "14px",
    timelineMaxHeight: "100%",
    controlSize: "44px",
  },
  tall: {
    sectionMinHeight: PORTFOLIO_SECTION_MIN_HEIGHT,
    sectionPaddingTop: "clamp(38px, 8.5dvh, 108px)",
    sectionPaddingBottom: "clamp(38px, 8.5dvh, 108px)",
    layoutGap: "18px",
    railColumnWidth: "304px",
    railCounterSize: "clamp(6rem, 8.4vw, 8.4rem)",
    railGap: "16px",
    timelineMaxHeight: "100%",
    controlSize: "46px",
  },
};

function resolvePortfolioHeightMode(
  viewportHeight: number,
): PortfolioHeightMode {
  if (viewportHeight <= PORTFOLIO_COMPACT_HEIGHT_MAX) {
    return "compact";
  }

  if (viewportHeight >= PORTFOLIO_TALL_HEIGHT_MIN) {
    return "tall";
  }

  return "default";
}

function getInitialPortfolioHeightMode(): PortfolioHeightMode {
  if (typeof globalThis.window === "undefined") {
    return "default";
  }

  return resolvePortfolioHeightMode(globalThis.innerHeight);
}

export default function Portfolio() {
  const [heightMode, setHeightMode] = useState<PortfolioHeightMode>(
    getInitialPortfolioHeightMode,
  );
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const {
    activeIndex,
    activeProject,
    hasPrevious,
    hasNext,
    setActiveIndex,
    goToPrevious,
    goToNext,
  } = usePortfolioActiveItem({
    projects: portfolioProjects,
    defaultProjectId: defaultPortfolioProjectId,
  });

  const canAutoplay = portfolioProjects.length > 1;

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return undefined;
    }

    function syncHeightMode() {
      setHeightMode(resolvePortfolioHeightMode(globalThis.innerHeight));
    }

    syncHeightMode();
    globalThis.addEventListener("resize", syncHeightMode);

    return () => {
      globalThis.removeEventListener("resize", syncHeightMode);
    };
  }, []);

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return undefined;
    }

    if (!canAutoplay || isAutoplayPaused) {
      return undefined;
    }

    const intervalId = globalThis.setInterval(() => {
      goToNext();
    }, PORTFOLIO_AUTOPLAY_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [canAutoplay, goToNext, isAutoplayPaused]);

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return undefined;
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (!canAutoplay) {
        return;
      }

      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      const isWithinTimelineRail =
        target instanceof HTMLElement &&
        Boolean(target.closest('[data-portfolio-timeline="true"]'));

      if (isTypingTarget || isWithinTimelineRail) {
        return;
      }

      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        goToNext();
      }
    }

    globalThis.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      globalThis.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [canAutoplay, goToNext, goToPrevious, hasNext, hasPrevious]);

  const handleAutoplayPause = useCallback(() => {
    setIsAutoplayPaused(true);
  }, []);

  const handleAutoplayResume = useCallback(() => {
    setIsAutoplayPaused(false);
  }, []);

  const handleSelectProjectIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setIsAutoplayPaused(true);
    },
    [setActiveIndex],
  );

  const railItems = useMemo(
    () =>
      portfolioProjects.map((project) => ({
        id: project.id,
        year: project.year,
        title: project.name,
        subtitle: project.subtitle,
        statusLabel: project.statusLabel,
        railLogoSrc: project.logoSrc,
        railLogoAlt: project.logoAlt,
        isActive: project.id === activeProject.id,
      })),
    [activeProject.id],
  );

  const responsivePreset = PORTFOLIO_RESPONSIVE_PRESETS[heightMode];

  const responsiveStyle = useMemo(
    () =>
      ({
        "--portfolio-section-min-height": responsivePreset.sectionMinHeight,
        "--portfolio-section-padding-top": responsivePreset.sectionPaddingTop,
        "--portfolio-section-padding-bottom":
          responsivePreset.sectionPaddingBottom,
        "--portfolio-layout-gap": responsivePreset.layoutGap,
        "--portfolio-rail-column-width": responsivePreset.railColumnWidth,
        "--portfolio-rail-counter-size": responsivePreset.railCounterSize,
        "--portfolio-rail-gap": responsivePreset.railGap,
        "--portfolio-stage-aspect-ratio": "16 / 9",
        "--portfolio-timeline-max-height":
          responsivePreset.timelineMaxHeight,
        "--portfolio-control-size": responsivePreset.controlSize,
      }) as CSSProperties,
    [responsivePreset],
  );

  return (
    <section
      className={rootStyles.portfolioRoot}
      aria-label="Portfólio"
      data-portfolio-root="true"
      data-portfolio-height-mode={heightMode}
      data-portfolio-autoplay={isAutoplayPaused ? "paused" : "running"}
      style={responsiveStyle}
    >
      <div className={rootStyles.portfolioSection}>
        <div className={rootStyles.portfolioContent}>
          <div className={rootStyles.portfolioStageColumn}>
            <PortfolioStage
              project={activeProject}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onHoverStart={handleAutoplayPause}
              onHoverEnd={handleAutoplayResume}
            />
          </div>

          <aside
            className={rootStyles.portfolioRailColumn}
            aria-label="Navegação de projetos"
          >
            <PortfolioTimelineRail
              items={railItems}
              activeIndex={activeIndex}
              paused={isAutoplayPaused}
              counterLabel="PROJECT INDEX"
              counterCaption="PORTFOLIO"
              onSelectIndex={handleSelectProjectIndex}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
