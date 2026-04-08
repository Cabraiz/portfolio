// src/pages/Mateus/Live/hooks/useLiveReducedMotion.ts

import { useCallback, useEffect, useMemo, useState } from "react";

type UseLiveReducedMotionParams = Readonly<{
  defaultValue?: boolean;
  initialOverride?: boolean | null;
  respectSystemPreference?: boolean;
}>;

type UseLiveReducedMotionResult = Readonly<{
  prefersReducedMotion: boolean;
  reducedMotion: boolean;
  motionEnabled: boolean;
  reducedMotionOverride: boolean | null;
  enableMotion: () => void;
  disableMotion: () => void;
  clearOverride: () => void;
  setReducedMotionOverride: (nextValue: boolean | null) => void;
}>;

function getInitialPreference(defaultValue: boolean): boolean {
  if (
    typeof globalThis.matchMedia !== "function" ||
    typeof window === "undefined"
  ) {
    return defaultValue;
  }

  return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLiveReducedMotion({
  defaultValue = false,
  initialOverride = null,
  respectSystemPreference = true,
}: UseLiveReducedMotionParams = {}): UseLiveReducedMotionResult {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    getInitialPreference(defaultValue),
  );
  const [reducedMotionOverride, setReducedMotionOverrideState] = useState<
    boolean | null
  >(initialOverride);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = globalThis.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);

      return () => {
        mediaQuery.removeEventListener("change", updatePreference);
      };
    }

    mediaQuery.addListener(updatePreference);

    return () => {
      mediaQuery.removeListener(updatePreference);
    };
  }, []);

  const reducedMotion = useMemo(() => {
    if (reducedMotionOverride !== null) {
      return reducedMotionOverride;
    }

    if (!respectSystemPreference) {
      return defaultValue;
    }

    return prefersReducedMotion;
  }, [
    defaultValue,
    prefersReducedMotion,
    reducedMotionOverride,
    respectSystemPreference,
  ]);

  const enableMotion = useCallback(() => {
    setReducedMotionOverrideState(false);
  }, []);

  const disableMotion = useCallback(() => {
    setReducedMotionOverrideState(true);
  }, []);

  const clearOverride = useCallback(() => {
    setReducedMotionOverrideState(null);
  }, []);

  const setReducedMotionOverride = useCallback((nextValue: boolean | null) => {
    setReducedMotionOverrideState(nextValue);
  }, []);

  return {
    prefersReducedMotion,
    reducedMotion,
    motionEnabled: !reducedMotion,
    reducedMotionOverride,
    enableMotion,
    disableMotion,
    clearOverride,
    setReducedMotionOverride,
  };
}

export default useLiveReducedMotion;
