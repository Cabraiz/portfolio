import type {
  HomeDriveCarState,
  HomeDriveVector2,
} from "./homeDrive.types";
import type {
  HomeDriveTrafficCollisionEvent,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficVehicle,
} from "./homeDrive.traffic.types";

export type HomeDriveTrafficCollisionOptions = Readonly<{
  playerRadiusMeters?: number;
  cooldownSeconds?: number;
  minImpactSpeedMps?: number;
}>;

export type HomeDriveTrafficCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  traffic: HomeDriveTrafficRuntimeState;
  events: readonly HomeDriveTrafficCollisionEvent[];
  cameraShake: number;
  collisionImpulse: number;
}>;

const DEFAULT_PLAYER_RADIUS_METERS = 1.62;
const DEFAULT_COLLISION_COOLDOWN_SECONDS = 0.42;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 1.4;

const MAX_VEHICLE_IMPACT_OFFSET_METERS = 3.2;
const MAX_VEHICLE_IMPACT_VELOCITY_MPS = 18;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDistance(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function clampVectorMagnitude(
  vector: Readonly<{ x: number; z: number }>,
  maxMagnitude: number,
): Readonly<{ x: number; z: number }> {
  const magnitude = Math.hypot(vector.x, vector.z);

  if (magnitude <= maxMagnitude || magnitude <= 0.000001) {
    return vector;
  }

  const scale = maxMagnitude / magnitude;

  return {
    x: vector.x * scale,
    z: vector.z * scale,
  };
}

function getSafeNormal(
  from: HomeDriveVector2,
  to: HomeDriveVector2,
  fallbackHeadingRad: number,
): Readonly<{ x: number; z: number }> {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= 0.000001) {
    return {
      x: -Math.sin(fallbackHeadingRad),
      z: -Math.cos(fallbackHeadingRad),
    };
  }

  return {
    x: dx / distance,
    z: dz / distance,
  };
}

function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  vehicle: HomeDriveTrafficVehicle,
): number {
  return Math.abs(car.speedMps - vehicle.speedMps);
}

function createCollisionEvent(
  car: HomeDriveCarState,
  vehicle: HomeDriveTrafficVehicle,
  normal: Readonly<{ x: number; z: number }>,
  impulse: number,
  occurredAt: number,
): HomeDriveTrafficCollisionEvent {
  return {
    id: `collision-${vehicle.id}-${Math.round(occurredAt * 1000)}`,
    vehicleId: vehicle.id,
    position: {
      x: (car.position.x + vehicle.position.x) / 2,
      z: (car.position.z + vehicle.position.z) / 2,
    },
    normal,
    relativeSpeedMps: getRelativeImpactSpeedMps(car, vehicle),
    impulse,
    occurredAt,
  };
}

function resolveVehicleImpact(
  vehicle: HomeDriveTrafficVehicle,
  normalFromVehicleToPlayer: Readonly<{ x: number; z: number }>,
  impulse: number,
  occurredAt: number,
): HomeDriveTrafficVehicle {
  const nextImpactOffset = clampVectorMagnitude(
    {
      x:
        vehicle.impactOffset.x -
        normalFromVehicleToPlayer.x * impulse * 0.14,
      z:
        vehicle.impactOffset.z -
        normalFromVehicleToPlayer.z * impulse * 0.14,
    },
    MAX_VEHICLE_IMPACT_OFFSET_METERS,
  );

  const nextImpactVelocity = clampVectorMagnitude(
    {
      x:
        vehicle.impactVelocity.x -
        normalFromVehicleToPlayer.x * impulse * 2.4,
      z:
        vehicle.impactVelocity.z -
        normalFromVehicleToPlayer.z * impulse * 2.4,
    },
    MAX_VEHICLE_IMPACT_VELOCITY_MPS,
  );

  return {
    ...vehicle,

    /*
      Intencional: colisão não reduz speedMps nem cruiseSpeedMps.
      O bug dos NPCs parados vinha daqui: cada encostada degradava
      a velocidade real usada pelo roteador.
    */
    damage: clamp(vehicle.damage + impulse * 0.12, 0, 1),
    impactOffset: nextImpactOffset,
    impactVelocity: nextImpactVelocity,
    visualRollRad:
      -Math.sign(normalFromVehicleToPlayer.x + normalFromVehicleToPlayer.z) *
      Math.min(0.22, impulse * 0.025),
    lastCollisionAt: occurredAt,
  };
}

function resolvePlayerImpact(
  car: HomeDriveCarState,
  normalFromVehicleToPlayer: Readonly<{ x: number; z: number }>,
  overlapMeters: number,
  impulse: number,
): HomeDriveCarState {
  const pushDistance = Math.min(3.8, overlapMeters * 0.72 + impulse * 0.08);

  return {
    ...car,
    position: {
      x: car.position.x + normalFromVehicleToPlayer.x * pushDistance,
      z: car.position.z + normalFromVehicleToPlayer.z * pushDistance,
    },
    speedMps:
      car.speedMps > 0
        ? -Math.min(5.8, Math.max(1.8, car.speedMps * 0.24))
        : car.speedMps * 0.35,
    steerAngleRad: car.steerAngleRad * 0.32,
  };
}

export function resolveHomeDriveTrafficCollisions(
  car: HomeDriveCarState,
  traffic: HomeDriveTrafficRuntimeState,
  nowSeconds: number,
  options: HomeDriveTrafficCollisionOptions = {},
): HomeDriveTrafficCollisionResolution {
  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const cooldownSeconds =
    options.cooldownSeconds ?? DEFAULT_COLLISION_COOLDOWN_SECONDS;
  const minImpactSpeedMps =
    options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;

  let resolvedCar = car;
  let maxImpulse = 0;
  const events: HomeDriveTrafficCollisionEvent[] = [];

  const resolvedVehicles = traffic.vehicles.map((vehicle) => {
    if (nowSeconds - vehicle.lastCollisionAt < cooldownSeconds) {
      return vehicle;
    }

    const distance = getDistance(resolvedCar.position, vehicle.position);
    const collisionDistance =
      playerRadiusMeters + vehicle.collisionRadiusMeters;

    if (distance >= collisionDistance) {
      return vehicle;
    }

    const relativeSpeedMps = getRelativeImpactSpeedMps(resolvedCar, vehicle);

    if (
      relativeSpeedMps < minImpactSpeedMps &&
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      return vehicle;
    }

    const overlapMeters = collisionDistance - distance;
    const normal = getSafeNormal(
      vehicle.position,
      resolvedCar.position,
      resolvedCar.headingRad,
    );

    const impulse = clamp(
      overlapMeters * 1.2 + relativeSpeedMps * 0.32,
      0.65,
      9.5,
    );

    maxImpulse = Math.max(maxImpulse, impulse);

    const event = createCollisionEvent(
      resolvedCar,
      vehicle,
      normal,
      impulse,
      nowSeconds,
    );

    events.push(event);

    resolvedCar = resolvePlayerImpact(
      resolvedCar,
      normal,
      overlapMeters,
      impulse,
    );

    return resolveVehicleImpact(vehicle, normal, impulse, nowSeconds);
  });

  const nextTraffic = {
    ...traffic,
    vehicles: resolvedVehicles,
    lastCollisionAt:
      events.length > 0 ? nowSeconds : traffic.lastCollisionAt,
  };

  return {
    car: resolvedCar,
    traffic: nextTraffic,
    events,
    cameraShake: clamp(maxImpulse * 0.12, 0, 1.15),
    collisionImpulse: maxImpulse,
  };
}

export function hasHomeDriveTrafficCollision(
  car: HomeDriveCarState,
  traffic: HomeDriveTrafficRuntimeState,
  options: HomeDriveTrafficCollisionOptions = {},
): boolean {
  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;

  return traffic.vehicles.some((vehicle) => {
    const distance = getDistance(car.position, vehicle.position);

    return distance < playerRadiusMeters + vehicle.collisionRadiusMeters;
  });
}
