export type PortfolioHeightMode = "compact" | "default" | "tall";

export type PortfolioResponsiveVars = Readonly<{
  sectionMinHeight: string;
  sectionPaddingTop: string;
  sectionPaddingBottom: string;
  layoutGap: string;
  railColumnWidth: string;
  timelineMaxHeight: string;
  controlSize: string;
}>;

const PORTFOLIO_COMPACT_HEIGHT_MAX = 820;
const PORTFOLIO_TALL_HEIGHT_MIN = 980;

const SECTION_MIN_HEIGHT =
  "calc(100dvh - var(--app-navbar-height, 70px))";

const PRESETS: Record<PortfolioHeightMode, PortfolioResponsiveVars> = {
  compact: {
    sectionMinHeight: SECTION_MIN_HEIGHT,
    sectionPaddingTop: "10px",
    sectionPaddingBottom: "10px",
    layoutGap: "10px",
    railColumnWidth: "228px",
    timelineMaxHeight: "100%",
    controlSize: "38px",
  },
  default: {
    sectionMinHeight: SECTION_MIN_HEIGHT,
    sectionPaddingTop: "24px",
    sectionPaddingBottom: "24px",
    layoutGap: "16px",
    railColumnWidth: "292px",
    timelineMaxHeight: "100%",
    controlSize: "46px",
  },
  tall: {
    sectionMinHeight: SECTION_MIN_HEIGHT,
    sectionPaddingTop: "30px",
    sectionPaddingBottom: "30px",
    layoutGap: "18px",
    railColumnWidth: "312px",
    timelineMaxHeight: "100%",
    controlSize: "48px",
  },
};

export function resolvePortfolioHeightMode(
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

export function getPortfolioResponsiveVars(
  mode: PortfolioHeightMode,
): PortfolioResponsiveVars {
  return PRESETS[mode];
}
