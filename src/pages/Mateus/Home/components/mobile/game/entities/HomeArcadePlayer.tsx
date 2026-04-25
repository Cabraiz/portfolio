import React, { useMemo, type CSSProperties } from "react";

import {
  HOME_ARCADE_COLORS,
  HOME_ARCADE_TOKENS,
} from "../homeArcade.tokens";
import { getHomeArcadeSprite } from "../homeArcade.sprites";
import { getHomeArcadeFloorY } from "../domain/homeArcade.constants";
import type {
  HomeArcadePhase,
  HomeArcadePlayerState,
} from "../domain/homeArcade.types";

export type HomeArcadePlayerProps = Readonly<{
  portraitSrc: string;
  portraitAlt?: string;
  player: Pick<HomeArcadePlayerState, "x" | "y" | "size" | "invulnerableFor">;
  phase: HomeArcadePhase;
  arenaHeight?: number;
  groundHeight?: number;
  className?: string;
}>;

export default function HomeArcadePlayer({
  portraitSrc,
  portraitAlt = "Mateus Cabral",
  player,
  phase,
  arenaHeight = HOME_ARCADE_TOKENS.arena.heightPx,
  groundHeight = HOME_ARCADE_TOKENS.arena.groundHeightPx,
  className,
}: HomeArcadePlayerProps) {
  const floorY = useMemo(() => {
    return getHomeArcadeFloorY({
      ...HOME_ARCADE_TOKENS.world,
      arenaHeight,
      groundHeight,
      gameDurationSeconds: HOME_ARCADE_TOKENS.world.gameDurationSeconds,
      baseScrollSpeed: HOME_ARCADE_TOKENS.world.baseScrollSpeed,
      turboScrollSpeed: HOME_ARCADE_TOKENS.world.turboScrollSpeed,
      maxFrameDeltaSeconds: HOME_ARCADE_TOKENS.world.maxFrameDeltaSeconds,
      gravity: HOME_ARCADE_TOKENS.player.gravity,
      jumpVelocity: HOME_ARCADE_TOKENS.player.jumpVelocity,
      moveSpeed: HOME_ARCADE_TOKENS.player.moveSpeed,
      playerSize: player.size,
      playerMinX: HOME_ARCADE_TOKENS.player.minXPx,
      playerMaxX: HOME_ARCADE_TOKENS.player.maxXPx,
      playerHitboxInset: HOME_ARCADE_TOKENS.player.hitboxInsetPx,
      distanceFactor: HOME_ARCADE_TOKENS.world.distanceFactor,
    });
  }, [arenaHeight, groundHeight, player.size]);

  const isAirborne = player.y < floorY - 1;

  const isBlinking =
    (player.invulnerableFor ?? 0) > 0 &&
    Math.floor((player.invulnerableFor ?? 0) * 14) % 2 === 0;

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: `${player.x}px`,
      top: `${player.y}px`,
      width: `${player.size}px`,
      height: `${player.size}px`,
      zIndex: 4,
      pointerEvents: "none",
    };
  }, [player.size, player.x, player.y]);

  const trailStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: "-28%",
      top: "18%",
      width: "120%",
      height: "120%",
      objectFit: "contain",
      opacity: phase === "playing" ? (isAirborne ? 0.82 : 0.54) : 0.32,
      filter: "blur(0.4px)",
      transform: isAirborne
        ? "translateX(-8px) scale(1.05)"
        : "translateX(-4px) scale(0.98)",
      transition: "opacity 120ms ease, transform 120ms ease",
      userSelect: "none",
      WebkitUserDrag: "none",
    };
  }, [isAirborne, phase]);

  const shellStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: "18px",
      overflow: "hidden",
      border:
        (player.invulnerableFor ?? 0) > 0
          ? `2px solid ${HOME_ARCADE_COLORS.playerInvulnerableBorder}`
          : `2px solid ${HOME_ARCADE_COLORS.playerBorder}`,
      background: HOME_ARCADE_COLORS.playerBackground,
      boxShadow:
        (player.invulnerableFor ?? 0) > 0
          ? "0 0 0 3px rgba(255, 88, 176, 0.18), 0 20px 30px rgba(0,0,0,0.26), 0 0 30px rgba(255, 88, 176, 0.18)"
          : "0 20px 30px rgba(0,0,0,0.26), 0 0 24px rgba(255, 210, 75, 0.18)",
      transform:
        phase === "playing" && isAirborne
          ? "rotate(-6deg) scale(1.02)"
          : "rotate(0deg) scale(1)",
      opacity: isBlinking ? 0.42 : 1,
      transition:
        "opacity 80ms linear, transform 120ms ease, box-shadow 120ms ease",
      boxSizing: "border-box",
    };
  }, [isAirborne, isBlinking, phase, player.invulnerableFor]);

  const imageStyle = useMemo<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center top",
      display: "block",
      userSelect: "none",
      WebkitUserDrag: "none",
      transform: isAirborne ? "scale(1.02)" : "scale(1)",
      transition: "transform 120ms ease",
    };
  }, [isAirborne]);

  const glossStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.00) 22%, rgba(255,255,255,0.00) 58%, rgba(0,0,0,0.16) 100%)",
    };
  }, []);

  return (
    <div className={className} style={rootStyle} aria-hidden="true">
      <img
        src={getHomeArcadeSprite("playerTrail")}
        alt=""
        style={trailStyle}
        draggable={false}
      />

      <div style={shellStyle}>
        <img
          src={portraitSrc}
          alt={portraitAlt}
          style={imageStyle}
          draggable={false}
        />
        <div style={glossStyle} />
      </div>
    </div>
  );
}
