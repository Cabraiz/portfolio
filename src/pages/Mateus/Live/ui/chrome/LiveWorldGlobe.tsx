// src/pages/Mateus/Live/ui/chrome/LiveWorldGlobe.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";

import styles from "./LiveWorldGlobe.module.css";

import {
  DEFAULT_ARC_COLOR,
  DEFAULT_BASE_COLOR,
  DEFAULT_GLOW_COLOR,
  DEFAULT_MARKER_COLOR,
  DEFAULT_MARKERS,
  DEFAULT_TARGET,
  DEFAULT_TARGET_COLOR,
  INITIAL_SIZE,
  formatCoordinate,
  joinClassNames,
  lerp,
  lerpAngle,
  normalizeAngle,
  pointKey,
  resolveGlobeFocus,
  resolvePointColor,
  toLocationTuple,
  type CanvasSize,
  type LiveWorldGlobeArcModel,
  type LiveWorldGlobeMarkerModel,
  type LiveWorldGlobePoint,
} from "./LiveWorldGlobe.model";

export type { LiveWorldGlobePoint } from "./LiveWorldGlobe.model";

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

    const isCompactViewport = canvasSize.width < 560;
    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, isCompactViewport ? 1 : 1.5)
        : 1;

    const internalWidth = Math.round(canvasSize.width * dpr);
    const internalHeight = Math.round(canvasSize.height * dpr);

    canvas.width = internalWidth;
    canvas.height = internalHeight;

    let frame = 0;
    let animationFrameId = 0;
    let destroyed = false;
    let lastRenderedAt = 0;
    const minimumFrameInterval = 1000 / 30;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: internalWidth,
      height: internalHeight,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 14000,
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

    const animate = (now: number) => {
      if (destroyed) {
        return;
      }

      const elapsed =
        lastRenderedAt === 0 ? minimumFrameInterval : now - lastRenderedAt;
      if (elapsed < minimumFrameInterval) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      lastRenderedAt = now - (elapsed % minimumFrameInterval);
      const frameStep = elapsed / (1000 / 60);
      frame += frameStep;

      orbitOffsetRef.current = normalizeAngle(
        orbitOffsetRef.current + autoRotateSpeed * frameStep
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

      animationFrameId = window.requestAnimationFrame(animate);
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
