// src/pages/Mateus/Home/components/mobile/game/elevator/domain/homeElevator.types.ts

export type HomeElevatorDoorState = "closed" | "opening" | "open" | "closing";

export type HomeElevatorDirection = -1 | 0 | 1;

export type HomeElevatorPassenger = Readonly<{
  id: string;
  originFloor: number;
  destinationFloor: number;
  patienceSeconds: number;
  waitedSeconds: number;
  hue: number;
}>;

export type HomeElevatorCabinState = Readonly<{
  yFloor: number;
  currentFloor: number;
  targetFloor: number;
  direction: HomeElevatorDirection;
  doorState: HomeElevatorDoorState;
  doorTimerSeconds: number;
  onboard: readonly HomeElevatorPassenger[];
}>;

export type HomeElevatorRuntimeState = Readonly<{
  elapsedSeconds: number;
  score: number;
  delivered: number;
  missed: number;
  streak: number;
  energy: number;
  spawnTimerSeconds: number;
  serial: number;
  cabin: HomeElevatorCabinState;
  waiting: readonly HomeElevatorPassenger[];
}>;

export type HomeElevatorTickInput = Readonly<{
  deltaSeconds: number;
  selectedTargetFloor?: number;
  requestDoorToggle?: boolean;
  forceSpawn?: boolean;
}>;

export type HomeElevatorFloorSnapshot = Readonly<{
  floor: number;
  waitingCount: number;
  upCount: number;
  downCount: number;
  minPatienceRatio: number;
}>;

export type HomeElevatorRuntimeSnapshot = Readonly<{
  floorSnapshots: readonly HomeElevatorFloorSnapshot[];
  nextStopFloors: readonly number[];
  hasWaitingAtCurrentFloor: boolean;
  hasDropoffAtCurrentFloor: boolean;
}>;
