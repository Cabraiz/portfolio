import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import {
  HOME_DRIVE_CAMERA_TOKENS,
  clampNumber,
  getViewportKind,
  roundNumber,
  roundPixel,
  toPx,
  type HomeDriveViewportKind,
} from "../components/mobile/game/driving/domain/homeDriveCamera.tokens";

export type HomeDriveViewportSnapshot = Readonly<{
  layoutWidth: number;
  layoutHeight: number;

  visualWidth: number;
  visualHeight: number;
  visualOffsetTop: number;
  visualOffsetLeft: number;

  stageWidth: number;
  stageHeight: number;

  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;

  visualViewportBottomGap: number;
  reducedVisualViewportPx: number;
}>;

export type HomeDriveViewportFlags = Readonly<{
  kind: HomeDriveViewportKind;
  isNarrow: boolean;
  isCompact: boolean;
  isShort: boolean;
  isVeryShort: boolean;
  isTall: boolean;
  hasReducedVisualViewport: boolean;
  hasSystemBottomInsetRisk: boolean;
}>;

export type HomeDriveCameraValues = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  visualWidth: number;
  visualHeight: number;
  stageWidth: number;
  stageHeight: number;
  aspectRatio: number;

  bottomSafeZonePx: number;
  systemBottomInsetPx: number;

  cockpitWidthPx: number;
  cockpitHeightPx: number;
  cockpitBottomPx: number;

  steeringWidthPx: number;
  steeringBottomPx: number;

  speedometerSizePx: number;
  speedometerXpx: number;
  speedometerYpx: number;
}>;

export type HomeDriveViewportCssVars = CSSProperties &
  Readonly<{
    "--home-drive-camera-width-px": string;
    "--home-drive-camera-height-px": string;
    "--home-drive-visual-width-px": string;
    "--home-drive-visual-height-px": string;
    "--home-drive-stage-width-px": string;
    "--home-drive-stage-height-px": string;

    "--home-drive-bottom-safe-zone": string;
    "--home-drive-system-bottom-inset": string;

    "--home-drive-cockpit-width": string;
    "--home-drive-cockpit-height": string;
    "--home-drive-cockpit-bottom": string;

    "--home-drive-steering-width": string;
    "--home-drive-steering-bottom": string;

    "--home-drive-speedometer-size": string;
    "--home-drive-speedometer-x": string;
    "--home-drive-speedometer-y": string;
  }>;

export type HomeDriveViewportProfile = Readonly<{
  snapshot: HomeDriveViewportSnapshot;
  flags: HomeDriveViewportFlags;
  values: HomeDriveCameraValues;
  cssVars: HomeDriveViewportCssVars;
}>;

export type UseHomeDriveViewportProfileOptions = Readonly<{
  /*
    Passe o ref do container real do jogo quando for ligar no HomeDriveViewport.
    Se não passar, o hook usa visualViewport/window.
  */
  stageRef?: RefObject<HTMLElement | null>;
}>;

function canUseDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getInitialSnapshot(): HomeDriveViewportSnapshot {
  const { design } = HOME_DRIVE_CAMERA_TOKENS;

  return {
    layoutWidth: design.width,
    layoutHeight: design.height,

    visualWidth: design.width,
    visualHeight: design.height,
    visualOffsetTop: 0,
    visualOffsetLeft: 0,

    stageWidth: design.width,
    stageHeight: design.height,

    screenWidth: design.width,
    screenHeight: design.height,
    devicePixelRatio: 1,

    visualViewportBottomGap: 0,
    reducedVisualViewportPx: 0,
  };
}

function readStageRect(stageElement?: HTMLElement | null): {
  width: number;
  height: number;
} {
  if (!stageElement) {
    return {
      width: 0,
      height: 0,
    };
  }

  const rect = stageElement.getBoundingClientRect();

  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };
}

function readViewportSnapshot(
  stageElement?: HTMLElement | null,
): HomeDriveViewportSnapshot {
  if (!canUseDOM()) {
    return getInitialSnapshot();
  }

  const visualViewport = window.visualViewport ?? null;

  const layoutWidth = Math.max(1, window.innerWidth || 1);
  const layoutHeight = Math.max(1, window.innerHeight || 1);

  const visualWidth = Math.max(1, visualViewport?.width ?? layoutWidth);
  const visualHeight = Math.max(1, visualViewport?.height ?? layoutHeight);
  const visualOffsetTop = Math.max(0, visualViewport?.offsetTop ?? 0);
  const visualOffsetLeft = Math.max(0, visualViewport?.offsetLeft ?? 0);

  const stageRect = readStageRect(stageElement);
  const stageWidth = stageRect.width > 0 ? stageRect.width : visualWidth;
  const stageHeight = stageRect.height > 0 ? stageRect.height : visualHeight;

  const screenWidth = Math.max(1, window.screen?.width ?? layoutWidth);
  const screenHeight = Math.max(1, window.screen?.height ?? layoutHeight);
  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);

  const visualViewportBottomGap = clampNumber(
    layoutHeight - (visualOffsetTop + visualHeight),
    0,
    160,
  );

  const reducedVisualViewportPx = clampNumber(
    layoutHeight - visualHeight,
    0,
    220,
  );

  return {
    layoutWidth: roundPixel(layoutWidth),
    layoutHeight: roundPixel(layoutHeight),

    visualWidth: roundPixel(visualWidth),
    visualHeight: roundPixel(visualHeight),
    visualOffsetTop: roundPixel(visualOffsetTop),
    visualOffsetLeft: roundPixel(visualOffsetLeft),

    stageWidth: roundPixel(stageWidth),
    stageHeight: roundPixel(stageHeight),

    screenWidth: roundPixel(screenWidth),
    screenHeight: roundPixel(screenHeight),
    devicePixelRatio: roundNumber(devicePixelRatio, 2),

    visualViewportBottomGap: roundPixel(visualViewportBottomGap),
    reducedVisualViewportPx: roundPixel(reducedVisualViewportPx),
  };
}

function buildFlags(
  width: number,
  height: number,
  snapshot: HomeDriveViewportSnapshot,
): HomeDriveViewportFlags {
  const { thresholds } = HOME_DRIVE_CAMERA_TOKENS;

  const isNarrow = width <= thresholds.narrowWidth;
  const isCompact = width <= thresholds.compactWidth;
  const isShort = height <= thresholds.shortHeight;
  const isVeryShort = height <= thresholds.veryShortHeight;
  const isTall = height >= thresholds.tallHeight;

  const hasReducedVisualViewport =
    snapshot.reducedVisualViewportPx >= thresholds.reducedVisualViewportPx;

  const hasSystemBottomInsetRisk =
    snapshot.visualViewportBottomGap >= thresholds.systemBottomInsetPx;

  return {
    kind: getViewportKind(width, height),
    isNarrow,
    isCompact,
    isShort,
    isVeryShort,
    isTall,
    hasReducedVisualViewport,
    hasSystemBottomInsetRisk,
  };
}

function buildCameraValues(
  snapshot: HomeDriveViewportSnapshot,
  flags: HomeDriveViewportFlags,
): HomeDriveCameraValues {
  const tokens = HOME_DRIVE_CAMERA_TOKENS;

  const viewportWidth = Math.max(1, snapshot.stageWidth);
  const viewportHeight = Math.max(1, snapshot.stageHeight);
  const aspectRatio = viewportWidth / viewportHeight;

  const systemBottomInsetPx = clampNumber(
    snapshot.visualViewportBottomGap,
    0,
    tokens.bottomSafeZone.maxPx,
  );

  const bottomSafeZonePx = clampNumber(
    tokens.bottomSafeZone.basePx +
      systemBottomInsetPx +
      (flags.isShort ? tokens.bottomSafeZone.extraWhenShortPx : 0),
    tokens.bottomSafeZone.minPx,
    tokens.bottomSafeZone.maxPx,
  );

  let cockpitWidthMultiplier = tokens.cockpit.widthMultiplier;

  if (flags.isNarrow) {
    cockpitWidthMultiplier += tokens.cockpit.widthMultiplierNarrowBonus;
  }

  if (flags.isTall) {
    cockpitWidthMultiplier += tokens.cockpit.widthMultiplierTallBonus;
  }

  if (flags.isShort) {
    cockpitWidthMultiplier -= tokens.cockpit.widthMultiplierShortPenalty;
  }

  const cockpitWidthPx = clampNumber(
    viewportWidth * cockpitWidthMultiplier,
    tokens.cockpit.minWidthPx,
    tokens.cockpit.maxWidthPx,
  );

  const cockpitHeightPx = cockpitWidthPx / tokens.cockpit.aspectRatio;

  const cockpitBaseBottomPx = clampNumber(
    cockpitWidthPx * tokens.cockpit.bottomRatio,
    tokens.cockpit.bottomMinPx,
    tokens.cockpit.bottomMaxPx,
  );

  const cockpitSystemLiftPx = clampNumber(
    systemBottomInsetPx * tokens.cockpit.bottomSystemInsetLiftRatio,
    0,
    tokens.cockpit.bottomSystemInsetLiftMaxPx,
  );

  const cockpitBottomPx =
    -cockpitBaseBottomPx +
    (flags.isShort ? tokens.cockpit.bottomShortLiftPx : 0) -
    (flags.isTall ? tokens.cockpit.bottomTallDropPx : 0) +
    cockpitSystemLiftPx;

  const steeringWidthPx = clampNumber(
    viewportWidth * tokens.steering.widthMultiplier,
    tokens.steering.minWidthPx,
    tokens.steering.maxWidthPx,
  );

  const steeringSystemDropPx = clampNumber(
    systemBottomInsetPx * tokens.steering.bottomSystemInsetDropRatio,
    0,
    tokens.steering.bottomSystemInsetDropMaxPx,
  );

  const steeringBottomPx =
    -clampNumber(
      viewportHeight * tokens.steering.bottomHeightRatio,
      tokens.steering.bottomMinPx,
      tokens.steering.bottomMaxPx,
    ) -
    (flags.isShort ? tokens.steering.bottomShortDropPx : 0) -
    steeringSystemDropPx;

  const speedometerSizePx = clampNumber(
    Math.min(
      viewportWidth * tokens.speedometer.sizeWidthRatio,
      viewportHeight * tokens.speedometer.sizeHeightRatio,
    ),
    tokens.speedometer.minSizePx,
    tokens.speedometer.maxSizePx,
  );

  const speedometerLeftShiftPx = clampNumber(
    viewportWidth * tokens.speedometer.leftShiftWidthRatio,
    tokens.speedometer.leftShiftMinPx,
    tokens.speedometer.leftShiftMaxPx,
  );

  const speedometerXpx = viewportWidth / 2 - speedometerLeftShiftPx;

  const speedometerYpx = Math.max(
    clampNumber(
      viewportHeight * tokens.speedometer.bottomHeightRatio,
      tokens.speedometer.bottomMinPx,
      tokens.speedometer.bottomMaxPx,
    ),
    bottomSafeZonePx + tokens.speedometer.bottomSafeOffsetPx,
  );

  return {
    viewportWidth: roundPixel(viewportWidth),
    viewportHeight: roundPixel(viewportHeight),
    visualWidth: roundPixel(snapshot.visualWidth),
    visualHeight: roundPixel(snapshot.visualHeight),
    stageWidth: roundPixel(snapshot.stageWidth),
    stageHeight: roundPixel(snapshot.stageHeight),
    aspectRatio: roundNumber(aspectRatio, 4),

    bottomSafeZonePx: roundPixel(bottomSafeZonePx),
    systemBottomInsetPx: roundPixel(systemBottomInsetPx),

    cockpitWidthPx: roundPixel(cockpitWidthPx),
    cockpitHeightPx: roundPixel(cockpitHeightPx),
    cockpitBottomPx: roundPixel(cockpitBottomPx),

    steeringWidthPx: roundPixel(steeringWidthPx),
    steeringBottomPx: roundPixel(steeringBottomPx),

    speedometerSizePx: roundPixel(speedometerSizePx),
    speedometerXpx: roundPixel(speedometerXpx),
    speedometerYpx: roundPixel(speedometerYpx),
  };
}

function buildCssVars(values: HomeDriveCameraValues): HomeDriveViewportCssVars {
  return {
    "--home-drive-camera-width-px": toPx(values.viewportWidth),
    "--home-drive-camera-height-px": toPx(values.viewportHeight),
    "--home-drive-visual-width-px": toPx(values.visualWidth),
    "--home-drive-visual-height-px": toPx(values.visualHeight),
    "--home-drive-stage-width-px": toPx(values.stageWidth),
    "--home-drive-stage-height-px": toPx(values.stageHeight),

    "--home-drive-bottom-safe-zone": toPx(values.bottomSafeZonePx),
    "--home-drive-system-bottom-inset": toPx(values.systemBottomInsetPx),

    "--home-drive-cockpit-width": toPx(values.cockpitWidthPx),
    "--home-drive-cockpit-height": toPx(values.cockpitHeightPx),
    "--home-drive-cockpit-bottom": toPx(values.cockpitBottomPx),

    "--home-drive-steering-width": toPx(values.steeringWidthPx),
    "--home-drive-steering-bottom": toPx(values.steeringBottomPx),

    "--home-drive-speedometer-size": toPx(values.speedometerSizePx),
    "--home-drive-speedometer-x": toPx(values.speedometerXpx),
    "--home-drive-speedometer-y": toPx(values.speedometerYpx),
  };
}

function buildProfile(snapshot: HomeDriveViewportSnapshot): HomeDriveViewportProfile {
  const width = Math.max(1, snapshot.stageWidth);
  const height = Math.max(1, snapshot.stageHeight);

  const flags = buildFlags(width, height, snapshot);
  const values = buildCameraValues(snapshot, flags);
  const cssVars = buildCssVars(values);

  return {
    snapshot,
    flags,
    values,
    cssVars,
  };
}

export function useHomeDriveViewportProfile(
  options: UseHomeDriveViewportProfileOptions = {},
): HomeDriveViewportProfile {
  const { stageRef } = options;

  const [snapshot, setSnapshot] = useState<HomeDriveViewportSnapshot>(() => {
    return readViewportSnapshot(stageRef?.current ?? null);
  });

  useEffect(() => {
    if (!canUseDOM()) {
      return undefined;
    }

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | undefined;

    const measure = () => {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(() => {
        setSnapshot(readViewportSnapshot(stageRef?.current ?? null));
      });
    };

    measure();

    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("orientationchange", measure, { passive: true });

    const visualViewport = window.visualViewport ?? null;

    visualViewport?.addEventListener("resize", measure, { passive: true });
    visualViewport?.addEventListener("scroll", measure, { passive: true });

    if (typeof ResizeObserver !== "undefined" && stageRef?.current) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(stageRef.current);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);

      visualViewport?.removeEventListener("resize", measure);
      visualViewport?.removeEventListener("scroll", measure);

      resizeObserver?.disconnect();
    };
  }, [stageRef]);

  return useMemo(() => {
    return buildProfile(snapshot);
  }, [snapshot]);
}

export default useHomeDriveViewportProfile;
