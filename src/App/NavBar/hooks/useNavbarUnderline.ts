import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type NavButtonRegistry = Record<string, HTMLButtonElement | null>;

export type UseNavbarUnderlineParams = Readonly<{
  selectedLink: string;
  isMobileView: boolean;
  viewportWidth: number;
  viewportHeight: number;
  isCompactDesktop: boolean;
  linksCount: number;
}>;

export type UseNavbarUnderlineResult = Readonly<{
  navRefs: RefObject<NavButtonRegistry>;
  navContainerRef: RefObject<HTMLDivElement | null>;
  underlineStyle: CSSProperties;
  setNavRef: (linkKey: string, element: HTMLButtonElement | null) => void;
  hideUnderline: () => void;
}>;

function getUnderlineHiddenStyle(): CSSProperties {
  return {
    width: 0,
    left: 0,
    opacity: 0,
  };
}

function getUnderlineVisibleStyle(
  targetElement: HTMLButtonElement,
  containerElement: HTMLDivElement,
): CSSProperties {
  const targetRect = targetElement.getBoundingClientRect();
  const containerRect = containerElement.getBoundingClientRect();

  return {
    width: targetRect.width,
    left: targetRect.left - containerRect.left,
    opacity: 1,
  };
}

function scheduleAnimationFrame(callback: () => void): number | null {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    callback();
    return null;
  }

  return globalThis.requestAnimationFrame(callback);
}

function cancelAnimationFrameSafely(animationFrameId: number | null): void {
  if (
    animationFrameId === null ||
    typeof globalThis.cancelAnimationFrame !== "function"
  ) {
    return;
  }

  globalThis.cancelAnimationFrame(animationFrameId);
}

export function useNavbarUnderline({
  selectedLink,
  isMobileView,
  viewportWidth,
  viewportHeight,
  isCompactDesktop,
  linksCount,
}: UseNavbarUnderlineParams): UseNavbarUnderlineResult {
  const navRefs = useRef<NavButtonRegistry>({});
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  const [underlineStyle, setUnderlineStyle] = useState<CSSProperties>(
    getUnderlineHiddenStyle,
  );

  const setNavRef = useCallback(
    (linkKey: string, element: HTMLButtonElement | null) => {
      navRefs.current[linkKey] = element;
    },
    [],
  );

  const hideUnderline = useCallback(() => {
    setUnderlineStyle(getUnderlineHiddenStyle());
  }, []);

  useLayoutEffect(() => {
    if (isMobileView || !selectedLink) {
      hideUnderline();
      return;
    }

    const targetElement = navRefs.current[selectedLink];
    const containerElement = navContainerRef.current;

    if (!targetElement || !containerElement) {
      hideUnderline();
      return;
    }

    const updateUnderline = () => {
      setUnderlineStyle(
        getUnderlineVisibleStyle(targetElement, containerElement),
      );
    };

    const animationFrameId = scheduleAnimationFrame(updateUnderline);

    return () => {
      cancelAnimationFrameSafely(animationFrameId);
    };
  }, [
    selectedLink,
    isMobileView,
    viewportWidth,
    viewportHeight,
    isCompactDesktop,
    linksCount,
    hideUnderline,
  ]);

  return {
    navRefs,
    navContainerRef,
    underlineStyle,
    setNavRef,
    hideUnderline,
  };
}

export default useNavbarUnderline;
