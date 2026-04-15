import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import createGlobe from "cobe";

import styles from "./PortfolioProjectWorldGlobe.module.css";

import {
  DEFAULT_ARC_COLOR,
  DEFAULT_BASE_COLOR,
  DEFAULT_GLOW_COLOR,
  DEFAULT_ORIGIN,
  DEFAULT_TARGET_RING_COLOR,
  MIN_VALID_STAGE_HEIGHT,
  MIN_VALID_STAGE_WIDTH,
} from "../../domain/worldGlobe/worldGlobe.constants";
import { buildArcModels } from "../../domain/worldGlobe/worldGlobe.arcs";
import {
  resolveGlobeFocus,
  resolveInitialFocusPoint,
} from "../../domain/worldGlobe/worldGlobe.focus";
import { buildMarkerModels } from "../../domain/worldGlobe/worldGlobe.markers";
import type {
  CanvasSize,
  GlobeFocus,
  GlobeGeoPoint,
  GlobeTransitionState,
} from "../../domain/worldGlobe/worldGlobe.types";

export type PortfolioProjectWorldGlobeProps = Readonly<{
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;

  projectName?: string;
  country: string;
  city?: string;
  region?: string;

  location: GlobeGeoPoint;
  origin?: GlobeGeoPoint;

  showHeader?: boolean;
  showFooterCard?: boolean;
  showConnectionArc?: boolean;
  compact?: boolean;
  decorative?: boolean;
}>;

const INITIAL_SIZE: CanvasSize = {
  width: 0,
  height: 0,
};

/**
 * Velocidade do giro contínuo.
 *
 * Aumente para girar mais rápido.
 * Diminua para girar mais devagar.
 */
const AUTO_ROTATE_SPEED = 0.0024;

/**
 * Suavização do phi orbital.
 *
 * Quanto maior, mais rápido encosta no alvo.
 * Quanto menor, mais macio.
 */
const ORBITAL_PHI_LERP = 0.075;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function formatMetaLabel(
  city: string | undefined,
  region: string | undefined
): string {
  if (city && region) {
    return `${city} • ${region}`;
  }

  if (city) {
    return city;
  }

  if (region) {
    return region;
  }

  return "";
}

function getDevicePixelRatio(): number {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, 2);
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;

  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}

/**
 * Interpola ângulos respeitando o caminho mais curto.
 */
function lerpAngle(from: number, to: number, t: number): number {
  const fullTurn = Math.PI * 2;
  let delta = (to - from) % fullTurn;

  if (delta > Math.PI) {
    delta -= fullTurn;
  } else if (delta < -Math.PI) {
    delta += fullTurn;
  }

  return normalizeAngle(from + delta * t);
}

function useCanvasSize<T extends HTMLElement>(): [RefObject<T | null>, CanvasSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<CanvasSize>(INITIAL_SIZE);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let frameId = 0;

    const updateSize = () => {
      const nextWidth = Math.max(0, Math.round(element.clientWidth));
      const nextHeight = Math.max(0, Math.round(element.clientHeight));

      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateSize);
    });

    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return [ref, size];
}

function PortfolioProjectWorldGlobeComponent({
  className,
  eyebrow = "World focus",
  title = "Portfolio interativo",
  subtitle = "Projeto vinculado a território",
  projectName,
  country,
  city,
  region,
  location,
  origin = DEFAULT_ORIGIN,
  showHeader = true,
  showFooterCard = true,
  showConnectionArc = true,
  compact = false,
  decorative = true,
}: PortfolioProjectWorldGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeInstanceRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  const [stageRef, canvasSize] = useCanvasSize<HTMLDivElement>();
  const [isReady, setIsReady] = useState(false);
  const [hasStableInitialStage, setHasStableInitialStage] = useState(false);

  const stageIsValid =
    canvasSize.width >= MIN_VALID_STAGE_WIDTH &&
    canvasSize.height >= MIN_VALID_STAGE_HEIGHT;

  const resolvedScale = compact ? 1.08 : 1.02;

  const targetFocus = useMemo(() => {
    return resolveGlobeFocus(resolveInitialFocusPoint(origin, location));
  }, [origin, location]);

  /**
   * Foco base calculado pela lógica do destino.
   * Este é o foco "real" antes do giro orbital contínuo.
   */
  const currentFocusRef = useRef<GlobeFocus>(targetFocus);

  /**
   * Phi efetivamente desenhado no canvas.
   * Fica separado para permitir suavização do giro contínuo.
   */
  const renderedPhiRef = useRef<number>(targetFocus.phi);

  /**
   * Offset acumulado do giro automático.
   * Ele nunca substitui o foco do destino;
   * apenas orbita suavemente em torno dele.
   */
  const orbitOffsetRef = useRef<number>(0);

  const currentLocationRef = useRef<GlobeGeoPoint>(location);
  const settledLocationRef = useRef<GlobeGeoPoint>(location);
  const transitionRef = useRef<GlobeTransitionState>(null);

  const latestLocationRef = useRef<GlobeGeoPoint>(location);
  const latestOriginRef = useRef<GlobeGeoPoint>(origin);
  const latestCompactRef = useRef<boolean>(compact);
  const latestShowConnectionArcRef = useRef<boolean>(showConnectionArc);
  const latestCanvasSizeRef = useRef<CanvasSize>(canvasSize);
  const latestScaleRef = useRef<number>(resolvedScale);

  useEffect(() => {
    latestLocationRef.current = location;
    latestOriginRef.current = origin;
    latestCompactRef.current = compact;
    latestShowConnectionArcRef.current = showConnectionArc;
    latestCanvasSizeRef.current = canvasSize;
    latestScaleRef.current = resolvedScale;
  }, [
    canvasSize,
    compact,
    location,
    origin,
    resolvedScale,
    showConnectionArc,
  ]);

  useEffect(() => {
    if (hasStableInitialStage || !stageIsValid) {
      return;
    }

    let rafA = 0;
    let rafB = 0;

    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        setHasStableInitialStage(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, [hasStableInitialStage, stageIsValid]);

  useEffect(() => {
    const previousLocation = settledLocationRef.current;

    const locationChanged =
      Math.abs(previousLocation.lat - location.lat) > 0.0001 ||
      Math.abs(previousLocation.lng - location.lng) > 0.0001;

    if (!locationChanged) {
      settledLocationRef.current = location;
      currentLocationRef.current = location;
      currentFocusRef.current = targetFocus;
      return;
    }

    if (!globeInstanceRef.current) {
      settledLocationRef.current = location;
      currentLocationRef.current = location;
      currentFocusRef.current = targetFocus;
      renderedPhiRef.current = targetFocus.phi;
      return;
    }

    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    transitionRef.current = {
      fromFocus: currentFocusRef.current,
      toFocus: targetFocus,
      fromLocation: currentLocationRef.current,
      toLocation: location,
      startedAt: now,
      durationMs: compact ? 1225 : 1040,
    };

    settledLocationRef.current = location;
  }, [compact, location, targetFocus]);

  useEffect(() => {
    if (!stageIsValid || !hasStableInitialStage) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = getDevicePixelRatio();
    const internalWidth = Math.max(1, Math.round(canvasSize.width * dpr));
    const internalHeight = Math.max(1, Math.round(canvasSize.height * dpr));

    if (canvas.width !== internalWidth) {
      canvas.width = internalWidth;
    }

    if (canvas.height !== internalHeight) {
      canvas.height = internalHeight;
    }

    if (!globeInstanceRef.current) {
      currentFocusRef.current = targetFocus;
      currentLocationRef.current = location;
      settledLocationRef.current = location;
      renderedPhiRef.current = targetFocus.phi;

      globeInstanceRef.current = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: internalWidth,
        height: internalHeight,
        phi: targetFocus.phi,
        theta: targetFocus.theta,
        dark: 1,
        diffuse: 1.16,
        mapSamples: 22000,
        mapBrightness: 6.0,
        scale: resolvedScale,
        opacity: 1,
        baseColor: [...DEFAULT_BASE_COLOR],
        markerColor: [...DEFAULT_TARGET_RING_COLOR],
        glowColor: [...DEFAULT_GLOW_COLOR],
        offset: [0, 0] as [number, number],
        markerElevation: compact ? 0.024 : 0.021,
        arcColor: [...DEFAULT_ARC_COLOR],
        arcWidth: compact ? 1.38 : 1.22,
        arcHeight: compact ? 0.28 : 0.24,
        markers: buildMarkerModels(origin, location, compact),
        arcs: buildArcModels(origin, location, showConnectionArc),
      });

      setIsReady(true);
      return;
    }

    globeInstanceRef.current.update({
      width: internalWidth,
      height: internalHeight,
      scale: resolvedScale,
    });
  }, [
    canvasSize.height,
    canvasSize.width,
    compact,
    hasStableInitialStage,
    location,
    origin,
    resolvedScale,
    showConnectionArc,
    stageIsValid,
    targetFocus,
  ]);

  useEffect(() => {
    if (!stageIsValid || !hasStableInitialStage || !globeInstanceRef.current) {
      return;
    }

    let destroyed = false;

    const animate = () => {
      if (destroyed || !globeInstanceRef.current) {
        return;
      }

      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const liveOrigin = latestOriginRef.current;
      const liveTargetLocation = latestLocationRef.current;
      const liveCompact = latestCompactRef.current;
      const liveShowConnectionArc = latestShowConnectionArcRef.current;
      const liveCanvasSize = latestCanvasSizeRef.current;
      const liveScale = latestScaleRef.current;
      const liveDpr = getDevicePixelRatio();

      let nextLocation = currentLocationRef.current;
      let nextFocus = currentFocusRef.current;

      const activeTransition = transitionRef.current;

      if (activeTransition) {
        const rawT =
          (now - activeTransition.startedAt) / activeTransition.durationMs;
        const t = clamp(rawT, 0, 1);
        const easedT = easeInOutCubic(t);

        nextLocation = {
          lat: mix(
            activeTransition.fromLocation.lat,
            activeTransition.toLocation.lat,
            easedT
          ),
          lng: mix(
            activeTransition.fromLocation.lng,
            activeTransition.toLocation.lng,
            easedT
          ),
        };

        /**
         * Foco sempre no destinatário final.
         * A linha e os pontos podem interpolar,
         * mas a câmera base continua mirando o destino real.
         */
        nextFocus = resolveGlobeFocus(
          resolveInitialFocusPoint(liveOrigin, activeTransition.toLocation)
        );

        if (t >= 1) {
          transitionRef.current = null;
          nextLocation = activeTransition.toLocation;
          nextFocus = resolveGlobeFocus(
            resolveInitialFocusPoint(liveOrigin, activeTransition.toLocation)
          );
        }
      } else {
        nextLocation = liveTargetLocation;
        nextFocus = resolveGlobeFocus(
          resolveInitialFocusPoint(liveOrigin, liveTargetLocation)
        );
      }

      currentLocationRef.current = nextLocation;
      currentFocusRef.current = nextFocus;

      /**
       * Giro contínuo:
       * o mundo continua vivo mesmo quando o foco já está resolvido.
       */
      orbitOffsetRef.current = normalizeAngle(
        orbitOffsetRef.current + AUTO_ROTATE_SPEED
      );

      /**
       * Phi orbital = foco do destino + giro contínuo acumulado.
       */
      const orbitalPhi = normalizeAngle(
        nextFocus.phi + orbitOffsetRef.current
      );

      /**
       * Suaviza o phi renderizado para evitar trancos.
       */
      renderedPhiRef.current = lerpAngle(
        renderedPhiRef.current,
        orbitalPhi,
        ORBITAL_PHI_LERP
      );

      globeInstanceRef.current.update({
        width: Math.max(1, Math.round(liveCanvasSize.width * liveDpr)),
        height: Math.max(1, Math.round(liveCanvasSize.height * liveDpr)),
        phi: renderedPhiRef.current,
        theta: nextFocus.theta,
        scale: liveScale,
        markers: buildMarkerModels(liveOrigin, nextLocation, liveCompact),
        arcs: buildArcModels(
          liveOrigin,
          nextLocation,
          liveShowConnectionArc
        ),
      });

      animationFrameIdRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = window.requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [hasStableInitialStage, stageIsValid]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      globeInstanceRef.current?.destroy();
      globeInstanceRef.current = null;
    };
  }, []);

  const footerLabel = country;
  const footerTitle = projectName?.trim() || country;
  const footerMeta = formatMetaLabel(city, region);

  return (
    <aside
      className={joinClasses(
        styles.portfolioProjectWorldGlobe,
        compact && styles.isCompact,
        className
      )}
      aria-hidden={decorative ? "true" : undefined}
    >
      <div className={styles.portfolioProjectWorldGlobeBackdrop} />

      {showHeader ? (
        <header className={styles.portfolioProjectWorldGlobeHeader}>
          <span className={styles.portfolioProjectWorldGlobeEyebrow}>
            {eyebrow}
          </span>

          <strong className={styles.portfolioProjectWorldGlobeTitle}>
            {title}
          </strong>

          <span className={styles.portfolioProjectWorldGlobeSubtitle}>
            {subtitle}
          </span>
        </header>
      ) : null}

      <div
        ref={stageRef}
        className={styles.portfolioProjectWorldGlobeStage}
        data-ready={isReady}
      >
        <div className={styles.portfolioProjectWorldGlobeAura} />
        <div className={styles.portfolioProjectWorldGlobeScanline} />

        <canvas
          ref={canvasRef}
          className={styles.portfolioProjectWorldGlobeCanvas}
          aria-label={`Globo focado em ${country}`}
        />
      </div>

      {showFooterCard ? (
        <div className={styles.portfolioProjectWorldGlobeInfoCard}>
          <span className={styles.portfolioProjectWorldGlobeInfoLabel}>
            {footerLabel}
          </span>

          <strong className={styles.portfolioProjectWorldGlobeInfoTitle}>
            {footerTitle}
          </strong>

          {footerMeta ? (
            <span className={styles.portfolioProjectWorldGlobeInfoMeta}>
              {footerMeta}
            </span>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

const PortfolioProjectWorldGlobe = memo(
  PortfolioProjectWorldGlobeComponent
);

PortfolioProjectWorldGlobe.displayName = "PortfolioProjectWorldGlobe";

export default PortfolioProjectWorldGlobe;
