import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type JSX,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import styles from "./HomeGameStage.module.css";

type CssVars = CSSProperties &
  Readonly<Record<`--${string}`, string | number | undefined>>;

type HomeGameOrbit = Readonly<{
  x?: number;
  y?: number;
  scale?: number;
  delayMs?: number;
  durationMs?: number;
}>;

export type HomeGameStageCollectible = Readonly<{
  id?: string;
  label: string;
  ariaLabel?: string;
  icon?: ReactNode;
  href?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  orbit?: HomeGameOrbit;
}>;

export type HomeGameStageProps = Readonly<{
  isOpen: boolean;
  imageSrc: string;
  imageAlt?: string;
  collectibles?: readonly HomeGameStageCollectible[];
  onClose: () => void;
  onComplete?: (collectedIds: readonly string[]) => void;
  className?: string;
}>;

type Ripple = Readonly<{
  id: string;
  x: number;
  y: number;
  size: number;
}>;

const ORBIT_PRESETS: readonly Required<HomeGameOrbit>[] = [
  { x: 17, y: 25, scale: 1, delayMs: 0, durationMs: 6200 },
  { x: 83, y: 28, scale: 1.08, delayMs: 850, durationMs: 7000 },
  { x: 50, y: 17, scale: 0.96, delayMs: 1200, durationMs: 6600 },
  { x: 22, y: 73, scale: 0.94, delayMs: 1500, durationMs: 7600 },
  { x: 79, y: 74, scale: 1.02, delayMs: 400, durationMs: 6800 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildTargetRel(
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"],
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>["rel"],
): string | undefined {
  if (rel) {
    return rel;
  }

  if (target === "_blank") {
    return "noreferrer noopener";
  }

  return undefined;
}

function createRippleId(): string {
  return `home-game-ripple-${Math.random().toString(36).slice(2, 11)}`;
}

function GlyphCircle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" opacity="0.94" />
    </svg>
  );
}

function GlyphDiamond(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5L20.5 12 12 20.5 3.5 12 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 7.2L16.8 12 12 16.8 7.2 12 12 7.2Z" fill="currentColor" />
    </svg>
  );
}

function GlyphTriangle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.2L20.1 18.2H3.9L12 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.8" r="2.15" fill="currentColor" />
    </svg>
  );
}

function defaultCollectibles(): readonly HomeGameStageCollectible[] {
  return [
    {
      id: "contact-orbit-a",
      label: "Orbit A",
      ariaLabel: "Primeiro artefato",
      icon: <GlyphCircle />,
    },
    {
      id: "contact-orbit-b",
      label: "Orbit B",
      ariaLabel: "Segundo artefato",
      icon: <GlyphDiamond />,
    },
    {
      id: "contact-orbit-c",
      label: "Orbit C",
      ariaLabel: "Terceiro artefato",
      icon: <GlyphTriangle />,
    },
  ] as const;
}

export default function HomeGameStage({
  isOpen,
  imageSrc,
  imageAlt = "Mateus Cabral",
  collectibles = [],
  onClose,
  onComplete,
  className,
}: HomeGameStageProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const rippleTimeoutsRef = useRef<number[]>([]);

  const [collectedIds, setCollectedIds] = useState<readonly string[]>([]);
  const [ripples, setRipples] = useState<readonly Ripple[]>([]);

  const resolvedCollectibles = useMemo(() => {
    const source =
      collectibles.length > 0 ? collectibles : defaultCollectibles();

    return source.map((item, index) => {
      const preset = ORBIT_PRESETS[index % ORBIT_PRESETS.length];

      return {
        ...item,
        id: item.id ?? `home-game-item-${index}`,
        icon:
          item.icon ??
          (index % 3 === 0 ? (
            <GlyphCircle />
          ) : index % 3 === 1 ? (
            <GlyphDiamond />
          ) : (
            <GlyphTriangle />
          )),
        orbit: {
          x: item.orbit?.x ?? preset.x,
          y: item.orbit?.y ?? preset.y,
          scale: item.orbit?.scale ?? preset.scale,
          delayMs: item.orbit?.delayMs ?? preset.delayMs,
          durationMs: item.orbit?.durationMs ?? preset.durationMs,
        },
      };
    });
  }, [collectibles]);

  const collectedSet = useMemo(() => {
    return new Set(collectedIds);
  }, [collectedIds]);

  const progress =
    resolvedCollectibles.length > 0
      ? collectedIds.length / resolvedCollectibles.length
      : 0;

  const stageVars = useMemo<CssVars>(() => {
    return {
      "--game-progress": progress.toFixed(4),
    };
  }, [progress]);

  const clearRippleTimeouts = useCallback(() => {
    rippleTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });

    rippleTimeoutsRef.current = [];
  }, []);

  const emitRipple = useCallback((clientX: number, clientY: number) => {
    const arena = arenaRef.current;
    if (!arena) {
      return;
    }

    const rect = arena.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ripple: Ripple = {
      id: createRippleId(),
      x,
      y,
      size: 152,
    };

    setRipples((current) => [...current, ripple]);

    const timeoutId = window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id));
    }, 920);

    rippleTimeoutsRef.current.push(timeoutId);
  }, []);

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const arena = arenaRef.current;
    if (!arena) {
      return;
    }

    const rect = arena.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);

    arena.style.setProperty("--pointer-x", ((x - 0.5) * 2).toFixed(3));
    arena.style.setProperty("--pointer-y", ((y - 0.5) * 2).toFixed(3));
    arena.style.setProperty("--pointer-glow-x", `${(x * 100).toFixed(2)}%`);
    arena.style.setProperty("--pointer-glow-y", `${(y * 100).toFixed(2)}%`);
  }, []);

  const resetPointer = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena) {
      return;
    }

    arena.style.setProperty("--pointer-x", "0");
    arena.style.setProperty("--pointer-y", "0");
    arena.style.setProperty("--pointer-glow-x", "50%");
    arena.style.setProperty("--pointer-glow-y", "50%");
  }, []);

  const resetGame = useCallback(() => {
    setCollectedIds([]);
    setRipples([]);
    resetPointer();
  }, [resetPointer]);

  const handleArenaPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      updatePointer(event.clientX, event.clientY);
    },
    [updatePointer],
  );

  const handleCollect = useCallback(
    (
      item: (typeof resolvedCollectibles)[number],
      event: ReactPointerEvent<HTMLButtonElement | HTMLAnchorElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const targetNode = event.currentTarget;
      const rect = targetNode.getBoundingClientRect();

      emitRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);

      const alreadyCollected = collectedSet.has(item.id);

      if (!alreadyCollected) {
        setCollectedIds((current) => [...current, item.id]);
        return;
      }

      if (!item.href) {
        return;
      }

      const nextTarget = item.target ?? "_blank";
      window.open(item.href, nextTarget, "noopener,noreferrer");
    },
    [collectedSet, emitRipple, resolvedCollectibles],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCollectedIds([]);
    setRipples([]);
    resetPointer();
  }, [isOpen, resetPointer]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (resolvedCollectibles.length === 0) {
      return;
    }

    if (collectedIds.length !== resolvedCollectibles.length) {
      return;
    }

    onComplete?.(collectedIds);
  }, [collectedIds, isOpen, onComplete, resolvedCollectibles.length]);

  useEffect(() => {
    return () => {
      clearRippleTimeouts();
    };
  }, [clearRippleTimeouts]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={[styles.overlay, className].filter(Boolean).join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive mobile game"
    >
      <div className={styles.backdrop} />

      <div
        ref={arenaRef}
        className={styles.stage}
        style={stageVars}
        onPointerMove={handleArenaPointerMove}
        onPointerLeave={resetPointer}
      >
        <div className={styles.ambient}>
          <div className={styles.ambientGlow} />
          <div className={styles.ambientGrid} />
          <div className={styles.ambientDust} />
          <div className={styles.ambientVignette} />
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={resetGame}
            aria-label="Reiniciar jogo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18.5 9.5A7 7 0 1 0 19 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M19.2 4.8v5.2h-5.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Fechar jogo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.coreZone}>
          <div className={styles.coreHalo} />
          <div className={styles.coreRing} />
          <div className={styles.coreRingSecondary} />
          <div className={styles.coreProgress} />

          <div className={styles.portraitShell}>
            <img
              src={imageSrc}
              alt={imageAlt}
              className={styles.portrait}
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <div className={styles.portraitGlass} />
          </div>

          <div
            className={[
              styles.completionBloom,
              progress >= 1 ? styles.completionBloomActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>

        <div className={styles.collectiblesLayer}>
          {resolvedCollectibles.map((item, index) => {
            const isCollected = collectedSet.has(item.id);
            const orbit = item.orbit;
            const itemVars: CssVars = {
              "--item-x": `${orbit.x}%`,
              "--item-y": `${orbit.y}%`,
              "--item-scale": orbit.scale,
              "--item-delay": `${orbit.delayMs}ms`,
              "--item-duration": `${orbit.durationMs}ms`,
              "--item-index": index,
            };

            const commonClassName = [
              styles.collectible,
              isCollected ? styles.collectibleCollected : "",
            ]
              .filter(Boolean)
              .join(" ");

            const commonChildren = (
              <>
                <span className={styles.collectibleAura} />
                <span className={styles.collectibleCore}>
                  <span className={styles.collectibleIcon}>{item.icon}</span>
                </span>
              </>
            );

            if (item.href) {
              return (
                <div key={item.id} className={commonClassName} style={itemVars}>
                  <a
                    href={item.href}
                    target={item.target ?? "_blank"}
                    rel={buildTargetRel(item.target, item.rel)}
                    aria-label={item.ariaLabel ?? item.label}
                    className={styles.collectibleAction}
                    onPointerDown={(event) => handleCollect(item, event)}
                  >
                    {commonChildren}
                  </a>
                </div>
              );
            }

            return (
              <div key={item.id} className={commonClassName} style={itemVars}>
                <button
                  type="button"
                  aria-label={item.ariaLabel ?? item.label}
                  className={styles.collectibleAction}
                  onPointerDown={(event) => handleCollect(item, event)}
                >
                  {commonChildren}
                </button>
              </div>
            );
          })}
        </div>

        {ripples.map((ripple) => {
          const rippleVars: CssVars = {
            "--ripple-x": `${ripple.x}px`,
            "--ripple-y": `${ripple.y}px`,
            "--ripple-size": `${ripple.size}px`,
          };

          return (
            <span
              key={ripple.id}
              className={styles.ripple}
              style={rippleVars}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}
