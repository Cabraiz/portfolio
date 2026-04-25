import { useCallback, useMemo } from "react";

import {
  createHomeArcadeCoinHitbox,
  createHomeArcadeHazardHitbox,
} from "../components/mobile/game/domain/homeArcade.helpers";
import {
  HOME_ARCADE_DEFAULT_WORLD_CONFIG,
  createHomeArcadePlayerHitbox,
  intersectsHomeArcadeBoxes,
} from "../components/mobile/game/domain/homeArcade.constants";
import type {
  HomeArcadeCoinState,
  HomeArcadeCollisionBox,
  HomeArcadeGameState,
  HomeArcadeHazardState,
  HomeArcadeWorldConfig,
} from "../components/mobile/game/domain/homeArcade.types";

export type UseHomeArcadeCollisionsParams = Readonly<{
  game: Pick<HomeArcadeGameState, "player" | "coins" | "hazards">;
  world?: HomeArcadeWorldConfig;
}>;

export type UseHomeArcadeCollisionsResult = Readonly<{
  playerHitbox: HomeArcadeCollisionBox;
  collidingCoins: readonly HomeArcadeCoinState[];
  collidingHazards: readonly HomeArcadeHazardState[];
  hasCoinCollision: boolean;
  hasHazardCollision: boolean;
  nearestCoin: HomeArcadeCoinState | null;
  nearestHazard: HomeArcadeHazardState | null;
  distanceToNearestCoin: number | null;
  distanceToNearestHazard: number | null;
  getCoinHitbox: (
    coin: Pick<HomeArcadeCoinState, "x" | "y" | "size">,
  ) => HomeArcadeCollisionBox;
  getHazardHitbox: (
    hazard: Pick<HomeArcadeHazardState, "x" | "y" | "width" | "height">,
  ) => HomeArcadeCollisionBox;
  wouldCollideWithCoinBox: (box: HomeArcadeCollisionBox) => boolean;
  wouldCollideWithHazardBox: (box: HomeArcadeCollisionBox) => boolean;
}>;

function getCenterDistance(
  a: HomeArcadeCollisionBox,
  b: HomeArcadeCollisionBox,
): number {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;

  return Math.hypot(ax - bx, ay - by);
}

export default function useHomeArcadeCollisions({
  game,
  world = HOME_ARCADE_DEFAULT_WORLD_CONFIG,
}: UseHomeArcadeCollisionsParams): UseHomeArcadeCollisionsResult {
  const playerHitbox = useMemo(() => {
    return createHomeArcadePlayerHitbox(game.player, world);
  }, [game.player, world]);

  const getCoinHitbox = useCallback(
    (coin: Pick<HomeArcadeCoinState, "x" | "y" | "size">) => {
      return createHomeArcadeCoinHitbox(coin);
    },
    [],
  );

  const getHazardHitbox = useCallback(
    (hazard: Pick<HomeArcadeHazardState, "x" | "y" | "width" | "height">) => {
      return createHomeArcadeHazardHitbox(hazard);
    },
    [],
  );

  const collidingCoins = useMemo(() => {
    return game.coins.filter((coin) => {
      return intersectsHomeArcadeBoxes(playerHitbox, getCoinHitbox(coin));
    });
  }, [game.coins, getCoinHitbox, playerHitbox]);

  const collidingHazards = useMemo(() => {
    return game.hazards.filter((hazard) => {
      return intersectsHomeArcadeBoxes(playerHitbox, getHazardHitbox(hazard));
    });
  }, [game.hazards, getHazardHitbox, playerHitbox]);

  const nearestCoin = useMemo(() => {
    if (!game.coins.length) {
      return null;
    }

    let winner: HomeArcadeCoinState | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    game.coins.forEach((coin) => {
      const distance = getCenterDistance(playerHitbox, getCoinHitbox(coin));

      if (distance < bestDistance) {
        bestDistance = distance;
        winner = coin;
      }
    });

    return winner;
  }, [game.coins, getCoinHitbox, playerHitbox]);

  const nearestHazard = useMemo(() => {
    if (!game.hazards.length) {
      return null;
    }

    let winner: HomeArcadeHazardState | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    game.hazards.forEach((hazard) => {
      const distance = getCenterDistance(playerHitbox, getHazardHitbox(hazard));

      if (distance < bestDistance) {
        bestDistance = distance;
        winner = hazard;
      }
    });

    return winner;
  }, [game.hazards, getHazardHitbox, playerHitbox]);

  const distanceToNearestCoin = useMemo(() => {
    if (!nearestCoin) {
      return null;
    }

    return getCenterDistance(playerHitbox, getCoinHitbox(nearestCoin));
  }, [getCoinHitbox, nearestCoin, playerHitbox]);

  const distanceToNearestHazard = useMemo(() => {
    if (!nearestHazard) {
      return null;
    }

    return getCenterDistance(playerHitbox, getHazardHitbox(nearestHazard));
  }, [getHazardHitbox, nearestHazard, playerHitbox]);

  const wouldCollideWithCoinBox = useCallback(
    (box: HomeArcadeCollisionBox) => {
      return game.coins.some((coin) => {
        return intersectsHomeArcadeBoxes(box, getCoinHitbox(coin));
      });
    },
    [game.coins, getCoinHitbox],
  );

  const wouldCollideWithHazardBox = useCallback(
    (box: HomeArcadeCollisionBox) => {
      return game.hazards.some((hazard) => {
        return intersectsHomeArcadeBoxes(box, getHazardHitbox(hazard));
      });
    },
    [game.hazards, getHazardHitbox],
  );

  return {
    playerHitbox,
    collidingCoins,
    collidingHazards,
    hasCoinCollision: collidingCoins.length > 0,
    hasHazardCollision: collidingHazards.length > 0,
    nearestCoin,
    nearestHazard,
    distanceToNearestCoin,
    distanceToNearestHazard,
    getCoinHitbox,
    getHazardHitbox,
    wouldCollideWithCoinBox,
    wouldCollideWithHazardBox,
  };
}
