// src/pages/Mateus/Live/hooks/useLiveCounterTicker.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addGsapTicker,
  removeGsapTicker,
} from "@/features/scroll/gsapRuntime";

import { useLiveReducedMotion } from "./useLiveReducedMotion";

type CounterFormatter = (value: number) => string;
type GsapTickerCallback = (time: number) => void;

type UseLiveCounterTickerParams = Readonly<{
  targetValue: number;
  startValue?: number;
  durationMs?: number;
  delayMs?: number;
  autoplay?: boolean;
  precision?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  formatter?: CounterFormatter;
  paused?: boolean;
  restartKey?: string | number;
  respectReducedMotion?: boolean;
}>;

type UseLiveCounterTickerResult = Readonly<{
  value: number;
  displayValue: string;
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  restart: () => void;
  jumpTo: (nextValue: number) => void;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function formatNumber(
  value: number,
  locale: string,
  precision: number,
  prefix?: string,
  suffix?: string,
): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);

  return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
}

export function useLiveCounterTicker({
  targetValue,
  startValue = 0,
  durationMs = 1400,
  delayMs = 0,
  autoplay = true,
  precision = 0,
  prefix,
  suffix,
  locale = "pt-BR",
  formatter,
  paused = false,
  restartKey,
  respectReducedMotion = true,
}: UseLiveCounterTickerParams): UseLiveCounterTickerResult {
  const { reducedMotion } = useLiveReducedMotion({
    respectSystemPreference: respectReducedMotion,
  });

  const [value, setValue] = useState<number>(startValue);
  const [progress, setProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const fromValueRef = useRef(startValue);
  const currentValueRef = useRef(startValue);
  const targetValueRef = useRef(targetValue);
  const startedAtMsRef = useRef<number | null>(null);
  const frameDelayCompletedRef = useRef(delayMs <= 0);

  const completeImmediately = useCallback(
    (nextValue: number) => {
      currentValueRef.current = nextValue;
      targetValueRef.current = nextValue;
      setValue(nextValue);
      setProgress(1);
      setIsRunning(false);
      startedAtMsRef.current = null;
      frameDelayCompletedRef.current = true;
    },
    [],
  );

  const reset = useCallback(() => {
    fromValueRef.current = startValue;
    currentValueRef.current = startValue;
    targetValueRef.current = targetValue;
    startedAtMsRef.current = null;
    frameDelayCompletedRef.current = delayMs <= 0;
    setValue(startValue);
    setProgress(0);
    setIsRunning(false);
  }, [delayMs, startValue, targetValue]);

  const start = useCallback(() => {
    if (reducedMotion || durationMs <= 0) {
      completeImmediately(targetValue);
      return;
    }

    fromValueRef.current = currentValueRef.current;
    targetValueRef.current = targetValue;
    startedAtMsRef.current = null;
    frameDelayCompletedRef.current = delayMs <= 0;
    setProgress(0);
    setIsRunning(true);
  }, [
    completeImmediately,
    delayMs,
    durationMs,
    reducedMotion,
    targetValue,
  ]);

  const stop = useCallback(() => {
    setIsRunning(false);
    startedAtMsRef.current = null;
  }, []);

  const restart = useCallback(() => {
    currentValueRef.current = startValue;
    setValue(startValue);
    setProgress(0);
    fromValueRef.current = startValue;
    startedAtMsRef.current = null;
    frameDelayCompletedRef.current = delayMs <= 0;

    if (reducedMotion || durationMs <= 0) {
      completeImmediately(targetValue);
      return;
    }

    setIsRunning(true);
  }, [
    completeImmediately,
    delayMs,
    durationMs,
    reducedMotion,
    startValue,
    targetValue,
  ]);

  const jumpTo = useCallback((nextValue: number) => {
    currentValueRef.current = nextValue;
    targetValueRef.current = nextValue;
    fromValueRef.current = nextValue;
    startedAtMsRef.current = null;
    setValue(nextValue);
    setProgress(1);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    targetValueRef.current = targetValue;

    if (!autoplay) {
      return;
    }

    if (reducedMotion || durationMs <= 0) {
      completeImmediately(targetValue);
      return;
    }

    start();
  }, [
    autoplay,
    completeImmediately,
    durationMs,
    reducedMotion,
    restartKey,
    start,
    targetValue,
  ]);

  useEffect(() => {
    if (!isRunning || paused) {
      return undefined;
    }

    const onTick: GsapTickerCallback = (time) => {
      const nowMs = time * 1000;

      if (startedAtMsRef.current === null) {
        startedAtMsRef.current = nowMs;
      }

      const elapsedSinceStart = nowMs - startedAtMsRef.current;

      if (!frameDelayCompletedRef.current) {
        if (elapsedSinceStart < delayMs) {
          return;
        }

        frameDelayCompletedRef.current = true;
        startedAtMsRef.current = nowMs;
      }

      const effectiveStart = startedAtMsRef.current ?? nowMs;
      const elapsedMs = Math.max(0, nowMs - effectiveStart);
      const rawProgress =
        durationMs <= 0 ? 1 : clamp(elapsedMs / durationMs, 0, 1);
      const easedProgress = easeOutCubic(rawProgress);

      const fromValue = fromValueRef.current;
      const toValue = targetValueRef.current;
      const nextValue = fromValue + (toValue - fromValue) * easedProgress;

      currentValueRef.current = nextValue;
      setValue(nextValue);
      setProgress(rawProgress);

      if (rawProgress >= 1) {
        currentValueRef.current = toValue;
        setValue(toValue);
        setProgress(1);
        setIsRunning(false);
        startedAtMsRef.current = null;
      }
    };

    addGsapTicker(onTick);

    return () => {
      removeGsapTicker(onTick);
    };
  }, [delayMs, durationMs, isRunning, paused]);

  useEffect(() => {
    if (reducedMotion) {
      completeImmediately(targetValue);
    }
  }, [completeImmediately, reducedMotion, targetValue]);

  const displayValue = useMemo(() => {
    if (formatter) {
      return formatter(value);
    }

    return formatNumber(value, locale, precision, prefix, suffix);
  }, [formatter, locale, precision, prefix, suffix, value]);

  return {
    value,
    displayValue,
    progress,
    isRunning,
    isComplete: progress >= 1 && !isRunning,
    start,
    stop,
    reset,
    restart,
    jumpTo,
  };
}

export default useLiveCounterTicker;
