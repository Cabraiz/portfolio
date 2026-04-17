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

type GlobeTransitionPhase = "unwind" | "travel";

type LocalGlobeTransitionState = Readonly<{
  phase: GlobeTransitionPhase;
  fromFocus: GlobeFocus;
  toFocus: GlobeFocus;
  fromLocation: GlobeGeoPoint;
  toLocation: GlobeGeoPoint;
  fromOrbitAngle: number;
  toOrbitAngle: number;
  startedAt: number;
  durationMs: number;
  nextPhaseDurationMs?: number;
}> | null;

const INITIAL_SIZE: CanvasSize = {
  width: 0,
  height: 0,
};

/**
 * Velocidade da rotação contínua em idle.
 * Unidade: radianos por ms.
 */
const IDLE_SPIN_SPEED_RAD_PER_MS = 0.0001;

/**
 * Suavização do phi renderizado.
 */
const PHI_LERP = 0.082;

/**
 * Suavização do theta renderizado.
 */
const THETA_LERP = 0.12;

/**
 * Duração do retorno da rotação acumulada antes da viagem.
 */
const COMPACT_UNWIND_DURATION_MS = 440;
const DEFAULT_UNWIND_DURATION_MS = 520;

/**
 * Duração padrão da viagem entre projetos.
 */
const COMPACT_TRANSITION_DURATION_MS = 1225;
const DEFAULT_TRANSITION_DURATION_MS = 1040;

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

function getLocationLine(
  country: string,
  city: string | undefined,
  region: string | undefined
): string {
  const meta = formatMetaLabel(city, region);

  if (meta) {
    return meta;
  }

  return country;
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
 * Normaliza para a faixa [-PI, PI].
 * Útil para “devolver” a rotação acumulada pelo caminho coerente.
 */
function normalizeSignedAngle(angle: number): number {
  const normalized = normalizeAngle(angle);

  if (normalized > Math.PI) {
    return normalized - Math.PI * 2;
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

function areGeoPointsEqual(a: GlobeGeoPoint, b: GlobeGeoPoint): boolean {
  return Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001;
}

function useCanvasSize<T extends HTMLElement>(): [
  RefObject<T | null>,
  CanvasSize
] {
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

  /**
   * Foco-alvo lógico do projeto atual.
   */
  const targetFocus = useMemo(() => {
    return resolveGlobeFocus(resolveInitialFocusPoint(origin, location));
  }, [origin, location]);

  /**
   * Foco lógico atual.
   */
  const currentFocusRef = useRef<GlobeFocus>(targetFocus);

  /**
   * Phi efetivamente desenhado no canvas.
   */
  const renderedPhiRef = useRef<number>(targetFocus.phi);

  /**
   * Theta efetivamente desenhado no canvas.
   */
  const renderedThetaRef = useRef<number>(targetFocus.theta);

  /**
   * Spin contínuo acumulado enquanto o globo está em idle.
   */
  const idleSpinAngleRef = useRef<number>(0);

  /**
   * Offset transitório usado para “desenrolar” a rotação
   * antes de iniciar a viagem para o próximo país.
   */
  const unwindOrbitAngleRef = useRef<number>(0);

  /**
   * Timestamp do último frame para calcular delta time.
   */
  const lastFrameTimeRef = useRef<number | null>(null);

  /**
   * Localização geográfica interpolada.
   */
  const currentLocationRef = useRef<GlobeGeoPoint>(location);

  /**
   * Últimos valores estáveis de props.
   */
  const settledLocationRef = useRef<GlobeGeoPoint>(location);
  const settledOriginRef = useRef<GlobeGeoPoint>(origin);

  /**
   * Estado de transição entre projetos.
   */
  const transitionRef = useRef<LocalGlobeTransitionState>(null);

  /**
   * Refs sempre atualizados com o estado vivo das props.
   */
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

  /**
   * Espera o stage estabilizar antes de iniciar o cobe,
   * evitando nascer pequeno e depois crescer.
   */
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

  /**
   * Quando location/origin mudam:
   * 1) congela o spin acumulado
   * 2) faz unwind desse spin
   * 3) só depois viaja para o novo país
   */
  useEffect(() => {
    const previousLocation = settledLocationRef.current;
    const previousOrigin = settledOriginRef.current;

    const locationChanged = !areGeoPointsEqual(previousLocation, location);
    const originChanged = !areGeoPointsEqual(previousOrigin, origin);

    if (!locationChanged && !originChanged) {
      settledLocationRef.current = location;
      settledOriginRef.current = origin;
      return;
    }

    const nextFocus = resolveGlobeFocus(
      resolveInitialFocusPoint(origin, location)
    );

    if (!globeInstanceRef.current) {
      settledLocationRef.current = location;
      settledOriginRef.current = origin;
      currentLocationRef.current = location;
      currentFocusRef.current = nextFocus;
      renderedPhiRef.current = nextFocus.phi;
      renderedThetaRef.current = nextFocus.theta;
      idleSpinAngleRef.current = 0;
      unwindOrbitAngleRef.current = 0;
      return;
    }

    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const frozenIdleSpin = normalizeSignedAngle(idleSpinAngleRef.current);

    transitionRef.current = {
      phase: "unwind",
      fromFocus: currentFocusRef.current,
      toFocus: nextFocus,
      fromLocation: currentLocationRef.current,
      toLocation: location,
      fromOrbitAngle: frozenIdleSpin,
      toOrbitAngle: 0,
      startedAt: now,
      durationMs: compact
        ? COMPACT_UNWIND_DURATION_MS
        : DEFAULT_UNWIND_DURATION_MS,
      nextPhaseDurationMs: compact
        ? COMPACT_TRANSITION_DURATION_MS
        : DEFAULT_TRANSITION_DURATION_MS,
    };

    idleSpinAngleRef.current = 0;
    unwindOrbitAngleRef.current = frozenIdleSpin;

    settledLocationRef.current = location;
    settledOriginRef.current = origin;
  }, [compact, location, origin]);

  /**
   * Inicializa o cobe uma única vez.
   */
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
      settledOriginRef.current = origin;
      renderedPhiRef.current = targetFocus.phi;
      renderedThetaRef.current = targetFocus.theta;
      idleSpinAngleRef.current = 0;
      unwindOrbitAngleRef.current = 0;

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

  /**
   * Loop contínuo:
   * - mantém a instância viva
   * - acumula rotação contínua em idle
   * - ao trocar de projeto, faz unwind
   * - depois viaja para o novo país
   */
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

      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = now;
      }

      const deltaMs = Math.max(0, now - lastFrameTimeRef.current);
      lastFrameTimeRef.current = now;

      let nextLocation = currentLocationRef.current;
      let nextFocus = currentFocusRef.current;

      const activeTransition = transitionRef.current;

      if (activeTransition) {
        const rawT =
          (now - activeTransition.startedAt) / activeTransition.durationMs;
        const t = clamp(rawT, 0, 1);
        const easedT = easeInOutCubic(t);

        if (activeTransition.phase === "unwind") {
          nextLocation = activeTransition.fromLocation;
          nextFocus = activeTransition.fromFocus;

          unwindOrbitAngleRef.current = mix(
            activeTransition.fromOrbitAngle,
            activeTransition.toOrbitAngle,
            easedT
          );

          if (t >= 1) {
            unwindOrbitAngleRef.current = 0;

            transitionRef.current = {
              phase: "travel",
              fromFocus: activeTransition.fromFocus,
              toFocus: activeTransition.toFocus,
              fromLocation: activeTransition.fromLocation,
              toLocation: activeTransition.toLocation,
              fromOrbitAngle: 0,
              toOrbitAngle: 0,
              startedAt: now,
              durationMs:
                activeTransition.nextPhaseDurationMs ??
                DEFAULT_TRANSITION_DURATION_MS,
            };
          }
        } else {
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

          nextFocus = {
            phi: lerpAngle(
              activeTransition.fromFocus.phi,
              activeTransition.toFocus.phi,
              easedT
            ),
            theta: mix(
              activeTransition.fromFocus.theta,
              activeTransition.toFocus.theta,
              easedT
            ),
          };

          unwindOrbitAngleRef.current = 0;
          idleSpinAngleRef.current = 0;

          if (t >= 1) {
            transitionRef.current = null;
            nextLocation = activeTransition.toLocation;
            nextFocus = activeTransition.toFocus;
          }
        }
      } else {
        nextLocation = liveTargetLocation;
        nextFocus = resolveGlobeFocus(
          resolveInitialFocusPoint(liveOrigin, liveTargetLocation)
        );

        idleSpinAngleRef.current = normalizeSignedAngle(
          idleSpinAngleRef.current + deltaMs * IDLE_SPIN_SPEED_RAD_PER_MS
        );

        unwindOrbitAngleRef.current = 0;
      }

      currentLocationRef.current = nextLocation;
      currentFocusRef.current = nextFocus;

      const finalPhi = normalizeAngle(
        nextFocus.phi +
          idleSpinAngleRef.current +
          unwindOrbitAngleRef.current
      );

      renderedPhiRef.current = lerpAngle(
        renderedPhiRef.current,
        finalPhi,
        PHI_LERP
      );

      renderedThetaRef.current = mix(
        renderedThetaRef.current,
        nextFocus.theta,
        THETA_LERP
      );

      globeInstanceRef.current.update({
        width: Math.max(1, Math.round(liveCanvasSize.width * liveDpr)),
        height: Math.max(1, Math.round(liveCanvasSize.height * liveDpr)),
        phi: renderedPhiRef.current,
        theta: renderedThetaRef.current,
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
      lastFrameTimeRef.current = null;
    };
  }, [hasStableInitialStage, stageIsValid]);

  /**
   * Destroi a instância apenas quando o componente realmente desmonta.
   */
  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      globeInstanceRef.current?.destroy();
      globeInstanceRef.current = null;
      lastFrameTimeRef.current = null;
    };
  }, []);

  const locationLine = getLocationLine(country, city, region);

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

        <div className={styles.portfolioProjectWorldGlobeOverlay}>
          <span className={styles.portfolioProjectWorldGlobeOverlayCountry}>
            {country}
          </span>

          <span className={styles.portfolioProjectWorldGlobeOverlayLocation}>
            {locationLine}
          </span>
        </div>
      </div>
    </aside>
  );
}

const PortfolioProjectWorldGlobe = memo(
  PortfolioProjectWorldGlobeComponent
);

PortfolioProjectWorldGlobe.displayName = "PortfolioProjectWorldGlobe";

export default PortfolioProjectWorldGlobe;
