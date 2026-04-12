export interface PortfolioCounterAngleOptions {
  total: number;
  activeIndex: number;
}

export interface PortfolioCounterStepOptions {
  currentIndex: number;
  nextIndex: number;
  total: number;
}

export interface PortfolioCounterMarkItem {
  index: number;
  angle: number;
  isActive: boolean;
  label: string;
}

export const PORTFOLIO_COUNTER_FALLBACK_TOTAL = 1;

export const clampPortfolioCounterIndex = (
  index: number,
  total: number,
): number => {
  if (total <= 0) {
    return 0;
  }

  if (Number.isNaN(index)) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
};

export const normalizePortfolioCounterTotal = (total: number): number => {
  if (!Number.isFinite(total) || total <= 0) {
    return PORTFOLIO_COUNTER_FALLBACK_TOTAL;
  }

  return Math.max(1, Math.floor(total));
};

export const formatPortfolioCounterValue = (value: number): string =>
  String(value).padStart(2, "0");

export const getPortfolioCounterStepAngle = (total: number): number => {
  const safeTotal = normalizePortfolioCounterTotal(total);
  return 360 / safeTotal;
};

export const getPortfolioCounterAngle = ({
  total,
  activeIndex,
}: PortfolioCounterAngleOptions): number => {
  const safeTotal = normalizePortfolioCounterTotal(total);
  const safeIndex = clampPortfolioCounterIndex(activeIndex, safeTotal);

  return safeIndex * getPortfolioCounterStepAngle(safeTotal);
};

export const getPortfolioCounterRelativeDelta = ({
  currentIndex,
  nextIndex,
  total,
}: PortfolioCounterStepOptions): number => {
  const safeTotal = normalizePortfolioCounterTotal(total);
  const safeCurrent = clampPortfolioCounterIndex(currentIndex, safeTotal);
  const safeNext = clampPortfolioCounterIndex(nextIndex, safeTotal);

  const forward = (safeNext - safeCurrent + safeTotal) % safeTotal;
  const backward = forward - safeTotal;

  return Math.abs(forward) <= Math.abs(backward) ? forward : backward;
};

export const getPortfolioCounterNextRotation = ({
  currentIndex,
  nextIndex,
  total,
}: PortfolioCounterStepOptions): number => {
  const safeTotal = normalizePortfolioCounterTotal(total);
  const stepAngle = getPortfolioCounterStepAngle(safeTotal);
  const delta = getPortfolioCounterRelativeDelta({
    currentIndex,
    nextIndex,
    total: safeTotal,
  });

  return delta * stepAngle;
};

export const buildPortfolioCounterMarks = (
  total: number,
  activeIndex: number,
): PortfolioCounterMarkItem[] => {
  const safeTotal = normalizePortfolioCounterTotal(total);
  const safeIndex = clampPortfolioCounterIndex(activeIndex, safeTotal);
  const stepAngle = getPortfolioCounterStepAngle(safeTotal);

  return Array.from({ length: safeTotal }, (_, index) => ({
    index,
    angle: index * stepAngle,
    isActive: index === safeIndex,
    label: formatPortfolioCounterValue(index + 1),
  }));
};

export const isPortfolioCounterInteractive = (
  onSelectIndex?: ((index: number) => void) | null,
): onSelectIndex is (index: number) => void =>
  typeof onSelectIndex === "function";
