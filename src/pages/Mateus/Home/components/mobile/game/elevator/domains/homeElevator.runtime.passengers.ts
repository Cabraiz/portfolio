// src/pages/Mateus/Home/components/mobile/game/elevator/domains/homeElevator.runtime.passengers.ts

import {
	HOME_ELEVATOR_BASE_SPAWN_SECONDS,
	HOME_ELEVATOR_FLOOR_COUNT,
	HOME_ELEVATOR_MAX_PATIENCE_SECONDS,
	HOME_ELEVATOR_MAX_WAITING_PASSENGERS,
	HOME_ELEVATOR_MIN_PATIENCE_SECONDS,
	HOME_ELEVATOR_TOP_FLOOR,
} from "./homeElevator.constants";
import type {
	HomeElevatorDirection,
	HomeElevatorPassenger,
	HomeElevatorRuntimeState,
	HomeElevatorTickInput,
} from "./homeElevator.types";

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomFloor(exceptFloor?: number): number {
  if (HOME_ELEVATOR_FLOOR_COUNT <= 1) {
    return 0;
  }

  let floor = Math.floor(Math.random() * HOME_ELEVATOR_FLOOR_COUNT);

  if (exceptFloor === undefined) {
    return floor;
  }

  let guard = 0;
  while (floor === exceptFloor && guard < 8) {
    floor = Math.floor(Math.random() * HOME_ELEVATOR_FLOOR_COUNT);
    guard += 1;
  }

  if (floor === exceptFloor) {
    return exceptFloor === 0 ? HOME_ELEVATOR_TOP_FLOOR : 0;
  }

  return floor;
}

export function getDirection(fromFloor: number, toFloor: number): HomeElevatorDirection {
  if (toFloor > fromFloor) {
    return 1;
  }

  if (toFloor < fromFloor) {
    return -1;
  }

  return 0;
}

export function normalizeFloor(floor: number): number {
  return Math.round(clamp(floor, 0, HOME_ELEVATOR_TOP_FLOOR));
}

function createPassenger(serial: number, originFloor?: number): HomeElevatorPassenger {
  const origin = normalizeFloor(originFloor ?? randomFloor());
  const destination = randomFloor(origin);
  const distance = Math.abs(destination - origin);

  return {
    id: `elevator-passenger-${serial}-${Math.round(Math.random() * 100000)}`,
    originFloor: origin,
    destinationFloor: destination,
    patienceSeconds: randomBetween(
      HOME_ELEVATOR_MIN_PATIENCE_SECONDS + distance * 0.8,
      HOME_ELEVATOR_MAX_PATIENCE_SECONDS + distance * 1.6,
    ),
    waitedSeconds: 0,
    hue: Math.round(randomBetween(18, 210)),
  };
}

export function createInitialPassengers(): readonly HomeElevatorPassenger[] {
  return [
    createPassenger(1, 0),
    createPassenger(2, 3),
    createPassenger(3, 6),
    createPassenger(4, 8),
  ];
}

export function tickPassengerPatience(
  waiting: readonly HomeElevatorPassenger[],
  deltaSeconds: number,
): {
  waiting: readonly HomeElevatorPassenger[];
  missed: number;
} {
  let missed = 0;
  const nextWaiting: HomeElevatorPassenger[] = [];

  for (const passenger of waiting) {
    const waitedSeconds = passenger.waitedSeconds + deltaSeconds;

    if (waitedSeconds >= passenger.patienceSeconds) {
      missed += 1;
      continue;
    }

    nextWaiting.push({
      ...passenger,
      waitedSeconds,
    });
  }

  return {
    waiting: nextWaiting,
    missed,
  };
}

export function spawnPassengersIfNeeded(
  state: HomeElevatorRuntimeState,
  input: HomeElevatorTickInput,
): {
  waiting: readonly HomeElevatorPassenger[];
  serial: number;
  spawnTimerSeconds: number;
} {
  let waiting = [...state.waiting];
  let serial = state.serial;
  let spawnTimerSeconds = state.spawnTimerSeconds - input.deltaSeconds;

  if (input.forceSpawn) {
    spawnTimerSeconds = 0;
  }

  while (
    spawnTimerSeconds <= 0 &&
    waiting.length < HOME_ELEVATOR_MAX_WAITING_PASSENGERS
  ) {
    serial += 1;
    waiting.push(createPassenger(serial));

    const congestionRatio = clamp(
      waiting.length / HOME_ELEVATOR_MAX_WAITING_PASSENGERS,
      0,
      1,
    );
    spawnTimerSeconds += HOME_ELEVATOR_BASE_SPAWN_SECONDS + congestionRatio * 1.8;
  }

  return {
    waiting,
    serial,
    spawnTimerSeconds: Math.max(0.35, spawnTimerSeconds),
  };
}
