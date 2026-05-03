// src/pages/Mateus/Home/components/mobile/game/elevator/domain/homeElevator.runtime.ts

import {
  HOME_ELEVATOR_BASE_SPAWN_SECONDS,
  HOME_ELEVATOR_CAPACITY,
  HOME_ELEVATOR_DELIVERY_SCORE,
  HOME_ELEVATOR_DOOR_HOLD_SECONDS,
  HOME_ELEVATOR_DOOR_TRANSITION_SECONDS,
  HOME_ELEVATOR_FLOOR_COUNT,
  HOME_ELEVATOR_IDLE_RECOVERY_PER_SECOND,
  HOME_ELEVATOR_INITIAL_ENERGY,
  HOME_ELEVATOR_MAX_PATIENCE_SECONDS,
  HOME_ELEVATOR_MAX_WAITING_PASSENGERS,
  HOME_ELEVATOR_MIN_PATIENCE_SECONDS,
  HOME_ELEVATOR_MISSED_PENALTY,
  HOME_ELEVATOR_MOVE_ENERGY_PER_SECOND,
  HOME_ELEVATOR_MOVE_SPEED_FLOORS_PER_SECOND,
  HOME_ELEVATOR_STREAK_BONUS,
  HOME_ELEVATOR_TOP_FLOOR,
  HOME_ELEVATOR_DOOR_ENERGY,
} from "./homeElevator.constants";
import type {
  HomeElevatorCabinState,
  HomeElevatorDirection,
  HomeElevatorDoorState,
  HomeElevatorFloorSnapshot,
  HomeElevatorPassenger,
  HomeElevatorRuntimeSnapshot,
  HomeElevatorRuntimeState,
  HomeElevatorTickInput,
} from "./homeElevator.types";

function clamp(value: number, min: number, max: number): number {
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

function getDirection(fromFloor: number, toFloor: number): HomeElevatorDirection {
  if (toFloor > fromFloor) {
    return 1;
  }

  if (toFloor < fromFloor) {
    return -1;
  }

  return 0;
}

function normalizeFloor(floor: number): number {
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

function createInitialPassengers(): readonly HomeElevatorPassenger[] {
  return [
    createPassenger(1, 0),
    createPassenger(2, 3),
    createPassenger(3, 6),
    createPassenger(4, 8),
  ];
}

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

function tickPassengerPatience(
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

function spawnPassengersIfNeeded(
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

function tickCabinMovement(
  cabin: HomeElevatorCabinState,
  deltaSeconds: number,
): HomeElevatorCabinState {
  if (cabin.doorState !== "closed") {
    return cabin;
  }

  const targetFloor = normalizeFloor(cabin.targetFloor);
  const distance = targetFloor - cabin.yFloor;

  if (Math.abs(distance) <= 0.002) {
    const currentFloor = normalizeFloor(targetFloor);

    return {
      ...cabin,
      yFloor: currentFloor,
      currentFloor,
      targetFloor: currentFloor,
      direction: 0,
    };
  }

  const direction = getDirection(cabin.yFloor, targetFloor);
  const step = HOME_ELEVATOR_MOVE_SPEED_FLOORS_PER_SECOND * deltaSeconds;
  const nextY =
    Math.abs(distance) <= step ? targetFloor : cabin.yFloor + direction * step;
  const currentFloor = normalizeFloor(nextY);

  return {
    ...cabin,
    yFloor: nextY,
    currentFloor,
    direction,
  };
}

function tickDoors(
  cabin: HomeElevatorCabinState,
  input: HomeElevatorTickInput,
): HomeElevatorCabinState {
  let doorState: HomeElevatorDoorState = cabin.doorState;
  let doorTimerSeconds = cabin.doorTimerSeconds;

  if (input.requestDoorToggle) {
    if (doorState === "closed" && Math.abs(cabin.yFloor - cabin.currentFloor) < 0.02) {
      doorState = "opening";
      doorTimerSeconds = HOME_ELEVATOR_DOOR_TRANSITION_SECONDS;
    } else if (doorState === "open") {
      doorState = "closing";
      doorTimerSeconds = HOME_ELEVATOR_DOOR_TRANSITION_SECONDS;
    }
  }

  if (doorState === "closed") {
    return {
      ...cabin,
      doorState,
      doorTimerSeconds,
    };
  }

  doorTimerSeconds -= input.deltaSeconds;

  if (doorTimerSeconds > 0) {
    return {
      ...cabin,
      doorState,
      doorTimerSeconds,
    };
  }

  switch (doorState) {
    case "opening":
      return {
        ...cabin,
        doorState: "open",
        doorTimerSeconds: HOME_ELEVATOR_DOOR_HOLD_SECONDS,
      };
    case "open":
      return {
        ...cabin,
        doorState: "closing",
        doorTimerSeconds: HOME_ELEVATOR_DOOR_TRANSITION_SECONDS,
      };
    case "closing":
      return {
        ...cabin,
        doorState: "closed",
        doorTimerSeconds: 0,
      };
    default:
      return {
        ...cabin,
        doorTimerSeconds: 0,
      };
  }
}

function resolveCurrentFloorExchange(
  cabin: HomeElevatorCabinState,
  waiting: readonly HomeElevatorPassenger[],
): {
  cabin: HomeElevatorCabinState;
  waiting: readonly HomeElevatorPassenger[];
  delivered: number;
} {
  if (cabin.doorState !== "open") {
    return {
      cabin,
      waiting,
      delivered: 0,
    };
  }

  const currentFloor = normalizeFloor(cabin.currentFloor);
  const remainingOnboard: HomeElevatorPassenger[] = [];
  let delivered = 0;

  for (const passenger of cabin.onboard) {
    if (passenger.destinationFloor === currentFloor) {
      delivered += 1;
      continue;
    }

    remainingOnboard.push(passenger);
  }

  const nextWaiting: HomeElevatorPassenger[] = [];
  const nextOnboard = [...remainingOnboard];

  for (const passenger of waiting) {
    const canBoard =
      passenger.originFloor === currentFloor &&
      nextOnboard.length < HOME_ELEVATOR_CAPACITY;

    if (canBoard) {
      nextOnboard.push(passenger);
      continue;
    }

    nextWaiting.push(passenger);
  }

  return {
    cabin: {
      ...cabin,
      onboard: nextOnboard,
    },
    waiting: nextWaiting,
    delivered,
  };
}

function findBestNextTarget(
  cabin: HomeElevatorCabinState,
  waiting: readonly HomeElevatorPassenger[],
): number {
  if (cabin.onboard.length > 0) {
    const direction = cabin.direction || getDirection(cabin.currentFloor, cabin.onboard[0]?.destinationFloor ?? cabin.currentFloor);
    const candidates = cabin.onboard
      .map((passenger) => passenger.destinationFloor)
      .filter((floor) => direction === 0 || getDirection(cabin.currentFloor, floor) === direction);

    if (candidates.length > 0) {
      return candidates.reduce((best, floor) =>
        Math.abs(floor - cabin.currentFloor) < Math.abs(best - cabin.currentFloor)
          ? floor
          : best,
      );
    }

    return cabin.onboard[0]?.destinationFloor ?? cabin.currentFloor;
  }

  if (waiting.length > 0) {
    return waiting.reduce((best, passenger) =>
      Math.abs(passenger.originFloor - cabin.currentFloor) <
      Math.abs(best - cabin.currentFloor)
        ? passenger.originFloor
        : best,
    waiting[0]?.originFloor ?? cabin.currentFloor);
  }

  return cabin.currentFloor;
}

function maybeAutoOpen(cabin: HomeElevatorCabinState, waiting: readonly HomeElevatorPassenger[]): HomeElevatorCabinState {
  if (
    cabin.doorState !== "closed" ||
    Math.abs(cabin.yFloor - cabin.currentFloor) > 0.02 ||
    cabin.currentFloor !== cabin.targetFloor
  ) {
    return cabin;
  }

  const hasDropoff = cabin.onboard.some(
    (passenger) => passenger.destinationFloor === cabin.currentFloor,
  );
  const hasPickup = waiting.some(
    (passenger) => passenger.originFloor === cabin.currentFloor,
  );

  if (!hasDropoff && !hasPickup) {
    return cabin;
  }

  return {
    ...cabin,
    doorState: "opening",
    doorTimerSeconds: HOME_ELEVATOR_DOOR_TRANSITION_SECONDS,
  };
}

function tickEnergy(
  state: HomeElevatorRuntimeState,
  cabin: HomeElevatorCabinState,
  input: HomeElevatorTickInput,
  delivered: number,
  missed: number,
): number {
  const isMoving = Math.abs(cabin.targetFloor - cabin.yFloor) > 0.02;
  const isDoorActive = cabin.doorState === "opening" || cabin.doorState === "closing";
  const recovery = !isMoving && cabin.doorState === "closed"
    ? HOME_ELEVATOR_IDLE_RECOVERY_PER_SECOND * input.deltaSeconds
    : 0;
  const moveCost = isMoving
    ? HOME_ELEVATOR_MOVE_ENERGY_PER_SECOND * input.deltaSeconds
    : 0;
  const doorCost = isDoorActive ? HOME_ELEVATOR_DOOR_ENERGY * input.deltaSeconds : 0;
  const deliveryRecovery = delivered * 1.65;
  const missedCost = missed * 2.4;

  return clamp(
    state.energy - moveCost - doorCost - missedCost + recovery + deliveryRecovery,
    0,
    100,
  );
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
