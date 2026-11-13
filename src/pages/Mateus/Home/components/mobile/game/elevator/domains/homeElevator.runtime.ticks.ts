// src/pages/Mateus/Home/components/mobile/game/elevator/domains/homeElevator.runtime.ticks.ts

import {
	HOME_ELEVATOR_CAPACITY,
	HOME_ELEVATOR_DOOR_HOLD_SECONDS,
	HOME_ELEVATOR_DOOR_TRANSITION_SECONDS,
	HOME_ELEVATOR_IDLE_RECOVERY_PER_SECOND,
	HOME_ELEVATOR_MOVE_ENERGY_PER_SECOND,
	HOME_ELEVATOR_MOVE_SPEED_FLOORS_PER_SECOND,
	HOME_ELEVATOR_DOOR_ENERGY,
} from "./homeElevator.constants";
import type {
	HomeElevatorCabinState,
	HomeElevatorDoorState,
	HomeElevatorPassenger,
	HomeElevatorRuntimeState,
	HomeElevatorTickInput,
} from "./homeElevator.types";
import {
	clamp,
	getDirection,
	normalizeFloor,
} from "./homeElevator.runtime.passengers";

export function tickCabinMovement(
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

export function tickDoors(
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

export function resolveCurrentFloorExchange(
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

export function findBestNextTarget(
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

export function maybeAutoOpen(cabin: HomeElevatorCabinState, waiting: readonly HomeElevatorPassenger[]): HomeElevatorCabinState {
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

export function tickEnergy(
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
