import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type {
  LandingSectionMeasurement,
  LandingSectionMeasurementsMap,
} from "../landing.types";

type MeasurementState<SectionId extends string> = Partial<
  Record<SectionId, LandingSectionMeasurement<SectionId>>
>;

export type UseLandingSectionMeasurementsParams = Readonly<{
  /**
   * Fallback padrão quando ainda não existe altura medida.
   */
  defaultPlaceholderMinHeight?: CSSProperties["minHeight"];

  /**
   * Ignora leituras irrisórias ou inválidas.
   */
  minimumAcceptedHeight?: number;

  /**
   * Arredonda para cima para evitar placeholders menores
   * que o conteúdo real por causa de subpixels.
   */
  roundHeights?: boolean;
}>;

export type UseLandingSectionMeasurementsResult<
  SectionId extends string = string,
> = Readonly<{
  measurements: LandingSectionMeasurementsMap<SectionId>;
  registerSectionElement: (
    _sectionId: SectionId,
    _element: HTMLElement | null,
  ) => void;
  getMeasuredHeight: (_sectionId: SectionId) => number | null;
  getPlaceholderMinHeight: (
    _sectionId: SectionId,
    _fallback?: CSSProperties["minHeight"],
  ) => CSSProperties["minHeight"];
  hasMeasurement: (_sectionId: SectionId) => boolean;
}>;

function normalizeHeight(
  value: number,
  minimumAcceptedHeight: number,
  roundHeights: boolean,
): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalizedValue = roundHeights ? Math.ceil(value) : value;

  if (normalizedValue < minimumAcceptedHeight) {
    return null;
  }

  return normalizedValue;
}

function isResizeObserverSize(
  value: unknown,
): value is ResizeObserverSize {
  return (
    typeof value === "object" &&
    value !== null &&
    "blockSize" in value &&
    typeof (value as { blockSize?: unknown }).blockSize === "number"
  );
}

function isResizeObserverSizeArray(
  value: unknown,
): value is readonly ResizeObserverSize[] {
  return Array.isArray(value) && value.every(isResizeObserverSize);
}

function getEntryHeight(entry: ResizeObserverEntry): number {
  const borderBoxSize: unknown = entry.borderBoxSize;

  if (isResizeObserverSizeArray(borderBoxSize) && borderBoxSize.length > 0) {
    return borderBoxSize[0].blockSize;
  }

  if (isResizeObserverSize(borderBoxSize)) {
    return borderBoxSize.blockSize;
  }

  return entry.contentRect.height;
}

export default function useLandingSectionMeasurements<
  SectionId extends string = string,
>({
  defaultPlaceholderMinHeight = "100dvh",
  minimumAcceptedHeight = 24,
  roundHeights = true,
}: UseLandingSectionMeasurementsParams = {}): UseLandingSectionMeasurementsResult<SectionId> {
  const [measurementState, setMeasurementState] = useState<
    MeasurementState<SectionId>
  >({});

  const sectionElementsRef = useRef<Map<SectionId, HTMLElement>>(new Map());
  const elementToSectionIdRef = useRef<Map<HTMLElement, SectionId>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const commitMeasurement = useCallback(
    (sectionId: SectionId, rawHeight: number): void => {
      const nextHeight = normalizeHeight(
        rawHeight,
        minimumAcceptedHeight,
        roundHeights,
      );

      if (nextHeight === null) {
        return;
      }

      setMeasurementState((currentState) => {
        const currentEntry = currentState[sectionId];

        if (
          currentEntry !== undefined &&
          Math.abs(currentEntry.height - nextHeight) < 1
        ) {
          return currentState;
        }

        return {
          ...currentState,
          [sectionId]: {
            id: sectionId,
            height: nextHeight,
            updatedAt: Date.now(),
          },
        };
      });
    },
    [minimumAcceptedHeight, roundHeights],
  );

  const measureElement = useCallback(
    (sectionId: SectionId, element: HTMLElement): void => {
      const rect = element.getBoundingClientRect();
      commitMeasurement(sectionId, rect.height);
    },
    [commitMeasurement],
  );

  const registerSectionElement = useCallback(
    (sectionId: SectionId, element: HTMLElement | null): void => {
      const previousElement = sectionElementsRef.current.get(sectionId);

      if (previousElement !== undefined && previousElement !== element) {
        resizeObserverRef.current?.unobserve(previousElement);
        elementToSectionIdRef.current.delete(previousElement);
        sectionElementsRef.current.delete(sectionId);
      }

      if (element === null) {
        return;
      }

      const alreadyRegisteredSectionId =
        elementToSectionIdRef.current.get(element);

      if (alreadyRegisteredSectionId === sectionId) {
        return;
      }

      sectionElementsRef.current.set(sectionId, element);
      elementToSectionIdRef.current.set(element, sectionId);

      measureElement(sectionId, element);
      resizeObserverRef.current?.observe(element);
    },
    [measureElement],
  );

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const sectionId = elementToSectionIdRef.current.get(element);

        if (sectionId === undefined) {
          return;
        }

        commitMeasurement(sectionId, getEntryHeight(entry));
      });
    });

    resizeObserverRef.current = observer;

    sectionElementsRef.current.forEach((element, sectionId) => {
      observer.observe(element);
      measureElement(sectionId, element);
    });

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [commitMeasurement, measureElement]);

  const measurements = useMemo<LandingSectionMeasurementsMap<SectionId>>(() => {
    const nextMap = new Map<SectionId, LandingSectionMeasurement<SectionId>>();

    (Object.keys(measurementState) as SectionId[]).forEach((sectionId) => {
      const entry = measurementState[sectionId];

      if (entry !== undefined) {
        nextMap.set(sectionId, entry);
      }
    });

    return nextMap;
  }, [measurementState]);

  const getMeasuredHeight = useCallback(
    (sectionId: SectionId): number | null => {
      return measurementState[sectionId]?.height ?? null;
    },
    [measurementState],
  );

  const hasMeasurement = useCallback(
    (sectionId: SectionId): boolean => {
      return measurementState[sectionId] !== undefined;
    },
    [measurementState],
  );

  const getPlaceholderMinHeight = useCallback(
    (
      sectionId: SectionId,
      fallback?: CSSProperties["minHeight"],
    ): CSSProperties["minHeight"] => {
      const measuredHeight = measurementState[sectionId]?.height;

      if (typeof measuredHeight === "number" && measuredHeight > 0) {
        return `${measuredHeight}px`;
      }

      return fallback ?? defaultPlaceholderMinHeight;
    },
    [defaultPlaceholderMinHeight, measurementState],
  );

  return {
    measurements,
    registerSectionElement,
    getMeasuredHeight,
    getPlaceholderMinHeight,
    hasMeasurement,
  };
}
