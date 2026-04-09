// src/pages/Mateus/Live/ui/chrome/LiveWorldGlobe.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";

import styles from "./LiveWorldGlobe.module.css";

type GlobeRgbColor = readonly [number, number, number];
type GlobeMutableRgbColor = [number, number, number];
type GlobeMutableLatLngTuple = [number, number];

type LiveWorldGlobeMarkerModel = {
  location: GlobeMutableLatLngTuple;
  size: number;
  color: GlobeMutableRgbColor;
};

type LiveWorldGlobeArcModel = {
  from: GlobeMutableLatLngTuple;
  to: GlobeMutableLatLngTuple;
  color: GlobeMutableRgbColor;
};

type CanvasSize = Readonly<{
  width: number;
  height: number;
}>;

export type LiveWorldGlobePoint = Readonly<{
  id?: string;
  label: string;
  country?: string;
  region?: string;
  lat: number;
  lng: number;
  size?: number;
  color?: GlobeRgbColor;
}>;

export type LiveWorldGlobeProps = Readonly<{
  className?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  target?: LiveWorldGlobePoint | null;
  origin?: LiveWorldGlobePoint | null;
  markers?: readonly LiveWorldGlobePoint[];
  autoRotateSpeed?: number;
  showArcToTarget?: boolean;
}>;

const DEFAULT_BASE_COLOR: GlobeRgbColor = [0.094, 0.133, 0.212];
const DEFAULT_GLOW_COLOR: GlobeRgbColor = [0.165, 0.847, 0.945];
const DEFAULT_MARKER_COLOR: GlobeRgbColor = [0.243, 0.929, 0.925];
const DEFAULT_TARGET_COLOR: GlobeRgbColor = [0.557, 0.906, 0.992];
const DEFAULT_ARC_COLOR: GlobeRgbColor = [0.302, 0.984, 0.878];

const DEFAULT_TARGET: LiveWorldGlobePoint = {
  id: "brazil",
  label: "Brasil",
  country: "Brasil",
  region: "América do Sul",
  lat: -14.235,
  lng: -51.9253,
  size: 0.09,
  color: DEFAULT_TARGET_COLOR,
};

const DEFAULT_MARKERS: readonly LiveWorldGlobePoint[] = [
  DEFAULT_TARGET,
  {
    id: "usa",
    label: "Estados Unidos",
    country: "Estados Unidos",
    region: "América do Norte",
    lat: 37.0902,
    lng: -95.7129,
    size: 0.048,
    color: [0.349, 0.592, 0.992],
  },
  {
    id: "portugal",
    label: "Portugal",
    country: "Portugal",
    region: "Europa",
    lat: 39.3999,
    lng: -8.2245,
    size: 0.042,
    color: [0.753, 0.639, 0.992],
  },
  {
    id: "japan",
    label: "Japão",
    country: "Japão",
    region: "Ásia",
    lat: 36.2048,
    lng: 138.2529,
    size: 0.044,
    color: [0.992, 0.58, 0.8],
  },
];

const INITIAL_SIZE: CanvasSize = {
  width: 0,
  height: 0,
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;

  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function lerpAngle(current: number, target: number, amount: number): number {
  let delta = target - current;

  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }

  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  return current + delta * amount;
}

function resolvePointColor(
  color: GlobeRgbColor | undefined,
  fallback: GlobeRgbColor
): GlobeMutableRgbColor {
  const [r, g, b] = color ?? fallback;
  return [r, g, b];
}

function toLocationTuple(
  point: Pick<LiveWorldGlobePoint, "lat" | "lng">
): GlobeMutableLatLngTuple {
  return [point.lat, point.lng];
}

function pointKey(point: LiveWorldGlobePoint): string {
  return point.id ?? `${point.label}-${point.lat}-${point.lng}`;
}

function formatCoordinate(
  value: number,
  positive: string,
  negative: string
): string {
  const suffix = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(1)}° ${suffix}`;
}

function resolveGlobeFocus(
  point: LiveWorldGlobePoint | null | undefined
): Readonly<{
  phi: number;
  theta: number;
}> {
  if (!point) {
    return {
      phi: 0.72,
      theta: 0.24,
    };
  }

  const phi = normalizeAngle(degToRad(-point.lng) + Math.PI / 2);
  const theta = clamp(degToRad(-point.lat) * 0.72, -0.75, 0.75);

  return {
    phi,
    theta,
  };
}

export default function LiveWorldGlobe({
  className,
  compact = false,
  title = "Presença global",
  subtitle = "Globo vivo para apontar o país ou região do projeto em spotlight.",
  eyebrow = "world focus",
  target = DEFAULT_TARGET,
  origin = null,
  markers,
  autoRotateSpeed = 0.0024,
  showArcToTarget = true,
}: LiveWorldGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>(INITIAL_SIZE);
  const [isReady, setIsReady] = useState(false);

  const resolvedTarget = target ?? DEFAULT_TARGET;

  const targetFocus = useMemo(() => {
    return resolveGlobeFocus(resolvedTarget);
  }, [resolvedTarget]);

  const phiRef = useRef<number>(targetFocus.phi);
  const thetaRef = useRef<number>(targetFocus.theta);
  const focusPhiRef = useRef<number>(targetFocus.phi);
  const focusThetaRef = useRef<number>(targetFocus.theta);
  const orbitOffsetRef = useRef<number>(0);

  useEffect(() => {
    focusPhiRef.current = targetFocus.phi;
    focusThetaRef.current = targetFocus.theta;
    orbitOffsetRef.current = 0;
  }, [targetFocus]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(1, Math.round(element.clientWidth));
      const nextHeight = Math.max(1, Math.round(element.clientHeight));

      setCanvasSize((current) => {
        if (
          current.width === nextWidth &&
          current.height === nextHeight
        ) {
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
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const resolvedPoints = useMemo(() => {
    const source = markers && markers.length > 0 ? markers : DEFAULT_MARKERS;
    const unique = new Map<string, LiveWorldGlobePoint>();

    source.forEach((point) => {
      unique.set(pointKey(point), point);
    });

    unique.set(pointKey(resolvedTarget), {
      ...resolvedTarget,
      size: resolvedTarget.size ?? 0.09,
      color: resolvedTarget.color ?? DEFAULT_TARGET_COLOR,
    });

    return Array.from(unique.values());
  }, [markers, resolvedTarget]);

  const markerModels = useMemo<LiveWorldGlobeMarkerModel[]>(() => {
    const targetId = pointKey(resolvedTarget);

    return resolvedPoints.map((point) => {
      const isTarget = pointKey(point) === targetId;

      return {
        location: toLocationTuple(point),
        size: point.size ?? (isTarget ? 0.09 : 0.04),
        color: resolvePointColor(
          point.color,
          isTarget ? DEFAULT_TARGET_COLOR : DEFAULT_MARKER_COLOR
        ),
      };
    });
  }, [resolvedPoints, resolvedTarget]);

  const arcModels = useMemo<LiveWorldGlobeArcModel[]>(() => {
    if (!showArcToTarget || !origin) {
      return [];
    }

    const isSameTarget =
      Math.abs(origin.lat - resolvedTarget.lat) < 0.0001 &&
      Math.abs(origin.lng - resolvedTarget.lng) < 0.0001;

    if (isSameTarget) {
      return [];
    }

    return [
      {
        from: toLocationTuple(origin),
        to: toLocationTuple(resolvedTarget),
        color: resolvePointColor(DEFAULT_ARC_COLOR, DEFAULT_ARC_COLOR),
      },
    ];
  }, [origin, resolvedTarget, showArcToTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || canvasSize.width <= 0 || canvasSize.height <= 0) {
      return;
    }

    setIsReady(false);

    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;

    const internalWidth = Math.round(canvasSize.width * dpr);
    const internalHeight = Math.round(canvasSize.height * dpr);

    canvas.width = internalWidth;
    canvas.height = internalHeight;

    let frame = 0;
    let animationFrameId = 0;
    let destroyed = false;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: internalWidth,
      height: internalHeight,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 18000,
      mapBrightness: 5.8,
      scale: 0.98,
      opacity: 1,
      baseColor: resolvePointColor(DEFAULT_BASE_COLOR, DEFAULT_BASE_COLOR),
      markerColor: resolvePointColor(DEFAULT_MARKER_COLOR, DEFAULT_MARKER_COLOR),
      glowColor: resolvePointColor(DEFAULT_GLOW_COLOR, DEFAULT_GLOW_COLOR),
      offset: [0, 0] as [number, number],
      markerElevation: 0.018,
      arcColor: resolvePointColor(DEFAULT_ARC_COLOR, DEFAULT_ARC_COLOR),
      arcWidth: 0.7,
      arcHeight: 0.22,
      markers: markerModels,
      arcs: arcModels,
    });

    const animate = () => {
      frame += 1;

      orbitOffsetRef.current = normalizeAngle(
        orbitOffsetRef.current + autoRotateSpeed
      );

      const orbitalPhi = normalizeAngle(
        focusPhiRef.current + orbitOffsetRef.current
      );

      const nextPhi = normalizeAngle(
        orbitalPhi + Math.sin(frame * 0.0085) * 0.06
      );
      const nextTheta =
        focusThetaRef.current + Math.sin(frame * 0.0055) * 0.015;

      phiRef.current = lerpAngle(phiRef.current, nextPhi, 0.075);
      thetaRef.current = lerp(thetaRef.current, nextTheta, 0.06);

      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        markers: markerModels,
        arcs: arcModels,
      });

      if (!destroyed) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    setIsReady(true);
    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(animationFrameId);
      globe.destroy();
      setIsReady(false);
    };
  }, [
    arcModels,
    autoRotateSpeed,
    canvasSize.height,
    canvasSize.width,
    markerModels,
  ]);

  const locationLabel = resolvedTarget.country ?? resolvedTarget.label;
  const regionLabel = resolvedTarget.region ?? "região monitorada";
  const coordinateLabel = `${formatCoordinate(
    resolvedTarget.lat,
    "N",
    "S"
  )} · ${formatCoordinate(resolvedTarget.lng, "L", "O")}`;

  return (
    <section
      className={joinClassNames(
        styles.root,
        compact && styles.rootCompact,
        className
      )}
      aria-label="Globo 3D de localização dos projetos"
    >
      <header className={styles.header}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div className={styles.stageShell}>
        <div
          ref={stageRef}
          className={styles.stage}
          data-ready={isReady}
        >
          <div className={styles.stageGlow} aria-hidden="true" />

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-label={`Globo focado em ${locationLabel}`}
          />

          <div className={styles.stageOverlay} aria-hidden="true" />

          <div className={styles.floatingCard}>
            <span className={styles.floatingEyebrow}>foco atual</span>
            <strong className={styles.floatingTitle}>{locationLabel}</strong>
            <span className={styles.floatingMeta}>{regionLabel}</span>
          </div>

          {!isReady ? (
            <div className={styles.loadingBadge}>Preparando globo</div>
          ) : null}
        </div>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoTop}>
          <div className={styles.infoMain}>
            <span className={styles.infoEyebrow}>destino</span>
            <strong className={styles.targetName}>{resolvedTarget.label}</strong>
            <span className={styles.targetMeta}>
              {locationLabel} · {coordinateLabel}
            </span>
          </div>

          <div className={styles.statusPill}>
            {isReady ? "WebGL ativo" : "Inicializando"}
          </div>
        </div>

        <div className={styles.pillRow}>
          <span className={styles.pill}>Rotação viva</span>
          <span className={styles.pill}>{resolvedPoints.length} pontos</span>
          {origin ? <span className={styles.pill}>Trajeto ligado</span> : null}
        </div>
      </div>
    </section>
  );
}
