// src/pages/Mateus/Home/components/mobile/game/elevator/domain/homeElevator.runtime.ts

import {
	HOME_ELEVATOR_BASE_SPAWN_SECONDS,
	HOME_ELEVATOR_DELIVERY_SCORE,
	HOME_ELEVATOR_FLOOR_COUNT,
	HOME_ELEVATOR_INITIAL_ENERGY,
	HOME_ELEVATOR_MISSED_PENALTY,
	HOME_ELEVATOR_STREAK_BONUS,
} from "./homeElevator.constants";
import type {
	HomeElevatorFloorSnapshot,
	HomeElevatorRuntimeSnapshot,
	HomeElevatorRuntimeState,
	HomeElevatorTickInput,
} from "./homeElevator.types";
import {
	clamp,
	getDirection,
	normalizeFloor,
	createInitialPassengers,
	tickPassengerPatience,
	spawnPassengersIfNeeded,
} from "./homeElevator.runtime.passengers";
import {
	tickCabinMovement,
	tickDoors,
	resolveCurrentFloorExchange,
	findBestNextTarget,
	maybeAutoOpen,
	tickEnergy,
} from "./homeElevator.runtime.ticks";

export function createHomeElevatorInitialState(): HomeElevatorRuntimeState {
  return {
    elapsedSeconds: 0,
    score: 0,
    delivered: 0,
    missed: 0,
    streak: 0,
    energy: HOME_ELEVATOR_INITIAL_ENERGY,
    spawnTimerSeconds: HOME_ELEVATOR_BASE_SPAWN_SECONDS * 0.55,
    serial: 4,
    cabin: {
      yFloor: 0,
      currentFloor: 0,
      targetFloor: 0,
      direction: 0,
      doorState: "closed",
      doorTimerSeconds: 0,
      onboard: [],
    },
    waiting: createInitialPassengers(),
  };
}

export function tickHomeElevatorRuntime(
  state: HomeElevatorRuntimeState,
  input: HomeElevatorTickInput,
): HomeElevatorRuntimeState {
  const deltaSeconds = clamp(input.deltaSeconds, 0, 0.08);
  const sanitizedInput: HomeElevatorTickInput = {
    ...input,
    deltaSeconds,
  };

  const spawnResult = spawnPassengersIfNeeded(state, sanitizedInput);
  const patienceResult = tickPassengerPatience(spawnResult.waiting, deltaSeconds);

  let cabin = state.cabin;

  if (typeof input.selectedTargetFloor === "number") {
    const nextTarget = normalizeFloor(input.selectedTargetFloor);

    cabin = {
      ...cabin,
      targetFloor: nextTarget,
      direction:
        cabin.doorState === "closed"
          ? getDirection(cabin.yFloor, nextTarget)
          : cabin.direction,
    };
  } else if (
    cabin.doorState === "closed" &&
    Math.abs(cabin.yFloor - cabin.targetFloor) <= 0.02
  ) {
    const bestTarget = findBestNextTarget(cabin, patienceResult.waiting);

    cabin = {
      ...cabin,
      targetFloor: bestTarget,
      direction: getDirection(cabin.yFloor, bestTarget),
    };
  }

  cabin = tickDoors(cabin, sanitizedInput);
  cabin = tickCabinMovement(cabin, deltaSeconds);
  cabin = maybeAutoOpen(cabin, patienceResult.waiting);

  const exchange = resolveCurrentFloorExchange(cabin, patienceResult.waiting);
  cabin = exchange.cabin;

  const delivered = exchange.delivered;
  const missed = patienceResult.missed;
  const streak = delivered > 0 ? state.streak + delivered : missed > 0 ? 0 : state.streak;
  const scoreGain =
    delivered * HOME_ELEVATOR_DELIVERY_SCORE +
    Math.max(0, streak - 1) * delivered * HOME_ELEVATOR_STREAK_BONUS;
  const scorePenalty = missed * HOME_ELEVATOR_MISSED_PENALTY;

  return {
    elapsedSeconds: state.elapsedSeconds + deltaSeconds,
    score: Math.max(0, state.score + scoreGain - scorePenalty),
    delivered: state.delivered + delivered,
    missed: state.missed + missed,
    streak,
    energy: tickEnergy(state, cabin, sanitizedInput, delivered, missed),
    spawnTimerSeconds: spawnResult.spawnTimerSeconds,
    serial: spawnResult.serial,
    cabin,
    waiting: exchange.waiting,
  };
}

export function getHomeElevatorRuntimeSnapshot(
  state: HomeElevatorRuntimeState,
): HomeElevatorRuntimeSnapshot {
  const floorSnapshots: HomeElevatorFloorSnapshot[] = [];

  for (let floor = 0; floor < HOME_ELEVATOR_FLOOR_COUNT; floor += 1) {
    const waiting = state.waiting.filter(
      (passenger) => passenger.originFloor === floor,
    );
    const patienceRatios = waiting.map((passenger) =>
      clamp(1 - passenger.waitedSeconds / passenger.patienceSeconds, 0, 1),
    );

    floorSnapshots.push({
      floor,
      waitingCount: waiting.length,
      upCount: waiting.filter(
        (passenger) => passenger.destinationFloor > passenger.originFloor,
      ).length,
      downCount: waiting.filter(
        (passenger) => passenger.destinationFloor < passenger.originFloor,
      ).length,
      minPatienceRatio:
        patienceRatios.length > 0 ? Math.min(...patienceRatios) : 1,
    });
  }

  const nextStopFloors = Array.from(
    new Set([
      ...state.cabin.onboard.map((passenger) => passenger.destinationFloor),
      ...state.waiting.map((passenger) => passenger.originFloor),
    ]),
  ).sort(
    (a, b) =>
      Math.abs(a - state.cabin.currentFloor) -
      Math.abs(b - state.cabin.currentFloor),
  );

  return {
    floorSnapshots,
    nextStopFloors,
    hasWaitingAtCurrentFloor: state.waiting.some(
      (passenger) => passenger.originFloor === state.cabin.currentFloor,
    ),
    hasDropoffAtCurrentFloor: state.cabin.onboard.some(
      (passenger) => passenger.destinationFloor === state.cabin.currentFloor,
    ),
  };
}
