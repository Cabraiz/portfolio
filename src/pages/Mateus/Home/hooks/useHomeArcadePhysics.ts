import { useCallback, useMemo } from "react";

import { getHomeArcadeProgress } from "../components/mobile/game/domain/homeArcade.helpers";
import {
  HOME_ARCADE_DEFAULT_WORLD_CONFIG,
  createHomeArcadePlayerHitbox,
  getHomeArcadeFloorY,
  getHomeArcadeGroundTop,
  getHomeArcadeScrollSpeed,
  isHomeArcadePlayerOnGround,
} from "../components/mobile/game/domain/homeArcade.constants";
import type {
  HomeArcadeCollisionBox,
  HomeArcadeControlState,
  HomeArcadeGameState,
  HomeArcadePlayerState,
  HomeArcadeWorldConfig,
} from "../components/mobile/game/domain/homeArcade.types";

export type UseHomeArcadePhysicsParams = Readonly<{
  game: Pick<HomeArcadeGameState, "player" | "timeLeft">;
  controls?: Pick<HomeArcadeControlState, "left" | "right" | "turbo">;
  world?: HomeArcadeWorldConfig;
}>;

export type UseHomeArcadePhysicsResult = Readonly<{
  groundTop: number;
  floorY: number;
  progress: number;
  scrollSpeed: number;
  playerHitbox: HomeArcadeCollisionBox;
  isOnGround: boolean;
  isAirborne: boolean;
  isInvulnerable: boolean;
  getProjectedPlayerState: (
    deltaSeconds: number,
  ) => Pick<HomeArcadePlayerState, "x" | "y" | "vy" | "size" | "invulnerableFor">;
  getProjectedPlayerHitbox: (deltaSeconds: number) => HomeArcadeCollisionBox;
}>;

export default function useHomeArcadePhysics({
  game,
  controls,
  world = HOME_ARCADE_DEFAULT_WORLD_CONFIG,
}: UseHomeArcadePhysicsParams): UseHomeArcadePhysicsResult {
  const groundTop = useMemo(() => {
    return getHomeArcadeGroundTop(world);
  }, [world]);

  const floorY = useMemo(() => {
    return getHomeArcadeFloorY(world);
  }, [world]);

  const scrollSpeed = useMemo(() => {
    return getHomeArcadeScrollSpeed(Boolean(controls?.turbo), {
      baseScrollSpeed: world.baseScrollSpeed,
      turboScrollSpeed: world.turboScrollSpeed,
    });
  }, [controls?.turbo, world.baseScrollSpeed, world.turboScrollSpeed]);

  const progress = useMemo(() => {
    return getHomeArcadeProgress(game.timeLeft, world.gameDurationSeconds);
  }, [game.timeLeft, world.gameDurationSeconds]);

  const playerHitbox = useMemo(() => {
    return createHomeArcadePlayerHitbox(game.player, world);
  }, [game.player, world]);

  const isOnGround = useMemo(() => {
    return isHomeArcadePlayerOnGround(game.player, world);
  }, [game.player, world]);

  const isAirborne = !isOnGround;

  const isInvulnerable = useMemo(() => {
    return (game.player.invulnerableFor ?? 0) > 0;
  }, [game.player.invulnerableFor]);

  const getProjectedPlayerState = useCallback(
    (deltaSeconds: number) => {
      const safeDelta = Math.max(0, deltaSeconds);
      const moveDirection =
        (controls?.left ? -1 : 0) + (controls?.right ? 1 : 0);

      let x =
        game.player.x + moveDirection * world.moveSpeed * safeDelta;
      let y = game.player.y;
      let vy = game.player.vy;
      let invulnerableFor = Math.max(
        0,
        (game.player.invulnerableFor ?? 0) - safeDelta,
      );

      const onGroundNow = isHomeArcadePlayerOnGround(game.player, world);

      if (!onGroundNow) {
        vy += world.gravity * safeDelta;
        y += vy * safeDelta;
      }

      if (y >= floorY) {
        y = floorY;
        vy = 0;
      }

      x = Math.min(world.playerMaxX, Math.max(world.playerMinX, x));

      return {
        x,
        y,
        vy,
        size: game.player.size,
        invulnerableFor,
      };
    },
    [
      controls?.left,
      controls?.right,
      floorY,
      game.player,
      world,
    ],
  );

  const getProjectedPlayerHitbox = useCallback(
    (deltaSeconds: number) => {
      const nextPlayer = getProjectedPlayerState(deltaSeconds);

      return createHomeArcadePlayerHitbox(
        {
          x: nextPlayer.x,
          y: nextPlayer.y,
          size: nextPlayer.size,
        },
        world,
      );
    },
    [getProjectedPlayerState, world],
  );

  return {
    groundTop,
    floorY,
    progress,
    scrollSpeed,
    playerHitbox,
    isOnGround,
    isAirborne,
    isInvulnerable,
    getProjectedPlayerState,
    getProjectedPlayerHitbox,
  };
}
