// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeCrashFx.tsx

import { useFrame } from "@react-three/fiber";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CircleGeometry,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  Vector3,
} from "three";

import {
  getHomeDriveImpactIntensity,
  normalizeHomeDriveImpactState,
  type HomeDriveRuntimeImpactState,
} from "../domain/homeDrive.impact";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState, HomeDriveVector2 } from "../domain/homeDrive.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveRuntimeWithOptionalImpact = HomeDriveRuntimeState & {
  impact?: Partial<HomeDriveRuntimeImpactState>;
};

export type HomeDriveThreeCrashFxProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  enabled?: boolean;
  maxParticles?: number;
  maxShockwaves?: number;
}>;

type CrashParticleKind = "spark" | "dust" | "debris";

type CrashParticle = {
  active: boolean;
  kind: CrashParticleKind;
  position: Vector3;
  velocity: Vector3;
  ageSeconds: number;
  lifeSeconds: number;
  size: number;
  spinRad: number;
  spinVelocityRadps: number;
};

type CrashShockwave = {
  active: boolean;
  position: Vector3;
  ageSeconds: number;
  lifeSeconds: number;
  radiusMeters: number;
  intensity: number;
};

const DEFAULT_MAX_PARTICLES = 96;
const DEFAULT_MAX_SHOCKWAVES = 8;

const PARTICLE_RENDER_Y = 0.15;
const SHOCKWAVE_RENDER_Y = 0.055;

const PLAYER_COLLISION_FX_COOLDOWN_SECONDS = 0.045;
const TRAFFIC_COLLISION_FX_WINDOW_SECONDS = 0.16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashNumber(value: number): number {
  const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;

  return raw - Math.floor(raw);
}

function getRuntimeImpact(
  runtime: HomeDriveRuntimeState,
): HomeDriveRuntimeImpactState {
  const runtimeWithImpact = runtime as HomeDriveRuntimeWithOptionalImpact;

  return normalizeHomeDriveImpactState(runtimeWithImpact.impact);
}

function getPlayerCrashPosition(runtime: HomeDriveRuntimeState): Vector3 {
  return new Vector3(
    runtime.car.position.x,
    PARTICLE_RENDER_Y,
    runtime.car.position.z,
  );
}

function getHeadingForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getImpactNormalFromRuntime(
  runtime: HomeDriveRuntimeState,
  impact: HomeDriveRuntimeImpactState,
): HomeDriveVector2 {
  const recoilLength = Math.hypot(
    impact.recoilVelocity.x,
    impact.recoilVelocity.z,
  );

  if (recoilLength > 0.0001) {
    return {
      x: impact.recoilVelocity.x / recoilLength,
      z: impact.recoilVelocity.z / recoilLength,
    };
  }

  const forward = getHeadingForwardVector(runtime.car.headingRad);

  return {
    x: -forward.x,
    z: -forward.z,
  };
}

function getNextFreeParticleIndex(
  particles: CrashParticle[],
  cursorRef: React.MutableRefObject<number>,
): number {
  for (let offset = 0; offset < particles.length; offset += 1) {
    const index = (cursorRef.current + offset) % particles.length;

    if (!particles[index].active) {
      cursorRef.current = (index + 1) % particles.length;

      return index;
    }
  }

  const fallbackIndex = cursorRef.current % particles.length;
  cursorRef.current = (fallbackIndex + 1) % particles.length;

  return fallbackIndex;
}

function getNextFreeShockwaveIndex(
  shockwaves: CrashShockwave[],
  cursorRef: React.MutableRefObject<number>,
): number {
  for (let offset = 0; offset < shockwaves.length; offset += 1) {
    const index = (cursorRef.current + offset) % shockwaves.length;

    if (!shockwaves[index].active) {
      cursorRef.current = (index + 1) % shockwaves.length;

      return index;
    }
  }

  const fallbackIndex = cursorRef.current % shockwaves.length;
  cursorRef.current = (fallbackIndex + 1) % shockwaves.length;

  return fallbackIndex;
}

function createParticlePool(count: number): CrashParticle[] {
  return Array.from({ length: count }, () => ({
    active: false,
    kind: "dust",
    position: new Vector3(),
    velocity: new Vector3(),
    ageSeconds: 0,
    lifeSeconds: 0,
    size: 1,
    spinRad: 0,
    spinVelocityRadps: 0,
  }));
}

function createShockwavePool(count: number): CrashShockwave[] {
  return Array.from({ length: count }, () => ({
    active: false,
    position: new Vector3(),
    ageSeconds: 0,
    lifeSeconds: 0,
    radiusMeters: 1,
    intensity: 0,
  }));
}

function spawnParticle(
  particles: CrashParticle[],
  cursorRef: React.MutableRefObject<number>,
  kind: CrashParticleKind,
  origin: Vector3,
  normal: HomeDriveVector2,
  intensity: number,
  seed: number,
): void {
  const index = getNextFreeParticleIndex(particles, cursorRef);
  const particle = particles[index];

  const sideSeed = hashNumber(seed + 11.17) * 2 - 1;
  const speedSeed = hashNumber(seed + 19.73);
  const liftSeed = hashNumber(seed + 23.91);
  const lifeSeed = hashNumber(seed + 31.49);
  const sizeSeed = hashNumber(seed + 37.83);

  const tangent = {
    x: normal.z,
    z: -normal.x,
  };

  const outwardStrength =
    kind === "spark"
      ? 8 + speedSeed * 18
      : kind === "debris"
        ? 4 + speedSeed * 9
        : 2 + speedSeed * 5;

  const sideStrength =
    kind === "spark"
      ? sideSeed * 7.5
      : kind === "debris"
        ? sideSeed * 3.8
        : sideSeed * 2.6;

  const lift =
    kind === "spark"
      ? 1.2 + liftSeed * 2.7
      : kind === "debris"
        ? 0.6 + liftSeed * 1.7
        : 0.08 + liftSeed * 0.55;

  particle.active = true;
  particle.kind = kind;
  particle.position.copy(origin);
  particle.position.x += tangent.x * sideSeed * 0.45;
  particle.position.z += tangent.z * sideSeed * 0.45;
  particle.position.y += kind === "spark" ? 0.35 : 0.08;

  particle.velocity.set(
    (normal.x * outwardStrength + tangent.x * sideStrength) * intensity,
    lift * intensity,
    (normal.z * outwardStrength + tangent.z * sideStrength) * intensity,
  );

  particle.ageSeconds = 0;
  particle.lifeSeconds =
    kind === "spark"
      ? 0.18 + lifeSeed * 0.22
      : kind === "debris"
        ? 0.34 + lifeSeed * 0.42
        : 0.48 + lifeSeed * 0.58;

  particle.size =
    kind === "spark"
      ? 0.08 + sizeSeed * 0.16
      : kind === "debris"
        ? 0.11 + sizeSeed * 0.21
        : 0.28 + sizeSeed * 0.42;

  particle.spinRad = hashNumber(seed + 41.7) * Math.PI * 2;
  particle.spinVelocityRadps = (hashNumber(seed + 43.2) * 2 - 1) * 14;
}

function spawnShockwave(
  shockwaves: CrashShockwave[],
  cursorRef: React.MutableRefObject<number>,
  origin: Vector3,
  intensity: number,
): void {
  const index = getNextFreeShockwaveIndex(shockwaves, cursorRef);
  const shockwave = shockwaves[index];

  shockwave.active = true;
  shockwave.position.copy(origin);
  shockwave.position.y = SHOCKWAVE_RENDER_Y;
  shockwave.ageSeconds = 0;
  shockwave.lifeSeconds = 0.22 + intensity * 0.28;
  shockwave.radiusMeters = 2.6 + intensity * 5.8;
  shockwave.intensity = intensity;
}

function spawnCrashBurst(
  particles: CrashParticle[],
  particleCursorRef: React.MutableRefObject<number>,
  shockwaves: CrashShockwave[],
  shockwaveCursorRef: React.MutableRefObject<number>,
  origin: Vector3,
  normal: HomeDriveVector2,
  intensityInput: number,
  seedBase: number,
): void {
  const intensity = clamp(intensityInput, 0.18, 1.6);

  const sparkCount = Math.round(clamp(10 + intensity * 22, 8, 34));
  const dustCount = Math.round(clamp(8 + intensity * 18, 6, 28));
  const debrisCount = Math.round(clamp(4 + intensity * 8, 2, 14));

  for (let index = 0; index < sparkCount; index += 1) {
    spawnParticle(
      particles,
      particleCursorRef,
      "spark",
      origin,
      normal,
      intensity,
      seedBase + index * 3.17,
    );
  }

  for (let index = 0; index < dustCount; index += 1) {
    spawnParticle(
      particles,
      particleCursorRef,
      "dust",
      origin,
      normal,
      intensity,
      seedBase + 100 + index * 5.31,
    );
  }

  for (let index = 0; index < debrisCount; index += 1) {
    spawnParticle(
      particles,
      particleCursorRef,
      "debris",
      origin,
      normal,
      intensity,
      seedBase + 200 + index * 7.73,
    );
  }

  spawnShockwave(shockwaves, shockwaveCursorRef, origin, intensity);
}

function tickParticles(
  particles: CrashParticle[],
  deltaSeconds: number,
): void {
  const safeDeltaSeconds = clamp(deltaSeconds, 0, 0.05);

  for (const particle of particles) {
    if (!particle.active) {
      continue;
    }

    particle.ageSeconds += safeDeltaSeconds;

    if (particle.ageSeconds >= particle.lifeSeconds) {
      particle.active = false;
      continue;
    }

    particle.velocity.y -= 9.8 * safeDeltaSeconds;

    const damping =
      particle.kind === "spark"
        ? Math.exp(-3.2 * safeDeltaSeconds)
        : particle.kind === "debris"
          ? Math.exp(-4.6 * safeDeltaSeconds)
          : Math.exp(-2.1 * safeDeltaSeconds);

    particle.velocity.multiplyScalar(damping);

    particle.position.x += particle.velocity.x * safeDeltaSeconds;
    particle.position.y += particle.velocity.y * safeDeltaSeconds;
    particle.position.z += particle.velocity.z * safeDeltaSeconds;

    if (particle.position.y < PARTICLE_RENDER_Y) {
      particle.position.y = PARTICLE_RENDER_Y;
      particle.velocity.y *= particle.kind === "debris" ? -0.18 : -0.04;
      particle.velocity.x *= 0.7;
      particle.velocity.z *= 0.7;
    }

    particle.spinRad += particle.spinVelocityRadps * safeDeltaSeconds;
    particle.spinVelocityRadps *= Math.exp(-5.4 * safeDeltaSeconds);
  }
}

function tickShockwaves(
  shockwaves: CrashShockwave[],
  deltaSeconds: number,
): void {
  const safeDeltaSeconds = clamp(deltaSeconds, 0, 0.05);

  for (const shockwave of shockwaves) {
    if (!shockwave.active) {
      continue;
    }

    shockwave.ageSeconds += safeDeltaSeconds;

    if (shockwave.ageSeconds >= shockwave.lifeSeconds) {
      shockwave.active = false;
    }
  }
}

function getParticleAlpha(particle: CrashParticle): number {
  const lifeRatio = clamp(particle.ageSeconds / particle.lifeSeconds, 0, 1);

  if (particle.kind === "spark") {
    return Math.pow(1 - lifeRatio, 1.8);
  }

  if (particle.kind === "debris") {
    return Math.pow(1 - lifeRatio, 1.4) * 0.9;
  }

  return Math.sin((1 - lifeRatio) * Math.PI) * 0.38;
}

function getShockwaveAlpha(shockwave: CrashShockwave): number {
  const lifeRatio = clamp(shockwave.ageSeconds / shockwave.lifeSeconds, 0, 1);

  return Math.pow(1 - lifeRatio, 1.6) * clamp(shockwave.intensity, 0, 1);
}

function syncParticleMesh(
  mesh: InstancedMesh | null,
  particles: CrashParticle[],
  dummy: Object3D,
  kind: CrashParticleKind,
): void {
  if (!mesh) {
    return;
  }

  let visibleIndex = 0;

  for (const particle of particles) {
    if (!particle.active || particle.kind !== kind) {
      continue;
    }

    const alpha = getParticleAlpha(particle);
    const scale =
      particle.kind === "spark"
        ? particle.size * (0.55 + alpha * 0.75)
        : particle.kind === "debris"
          ? particle.size
          : particle.size * (0.8 + (1 - alpha) * 1.35);

    dummy.position.copy(particle.position);
    dummy.rotation.set(-Math.PI / 2, 0, particle.spinRad);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();

    mesh.setMatrixAt(visibleIndex, dummy.matrix);
    visibleIndex += 1;
  }

  for (let index = visibleIndex; index < mesh.count; index += 1) {
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0.0001, 0.0001, 0.0001);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
}

function syncShockwaveMesh(
  mesh: InstancedMesh | null,
  shockwaves: CrashShockwave[],
  dummy: Object3D,
): void {
  if (!mesh) {
    return;
  }

  let visibleIndex = 0;

  for (const shockwave of shockwaves) {
    if (!shockwave.active) {
      continue;
    }

    const lifeRatio = clamp(shockwave.ageSeconds / shockwave.lifeSeconds, 0, 1);
    const alpha = getShockwaveAlpha(shockwave);
    const radius = shockwave.radiusMeters * (0.28 + lifeRatio * 0.95);

    dummy.position.copy(shockwave.position);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.set(radius * (0.8 + alpha * 0.2), radius, radius);
    dummy.updateMatrix();

    mesh.setMatrixAt(visibleIndex, dummy.matrix);
    visibleIndex += 1;
  }

  for (let index = visibleIndex; index < mesh.count; index += 1) {
    dummy.position.set(0, -9999, 0);
    dummy.scale.set(0.0001, 0.0001, 0.0001);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
}

function createSparkMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: "#ffd075",
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
}

function createDustMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: "#9a876e",
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: DoubleSide,
  });
}

function createDebrisMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: "#313338",
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: DoubleSide,
  });
}

function createShockwaveMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: "#f7f0d0",
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
}

function disposeGeometry(geometry: BufferGeometry): void {
  geometry.dispose();
}

function disposeMaterial(material: Material): void {
  material.dispose();
}

function HomeDriveThreeCrashFx({
  runtimeRef,
  trafficRef,
  enabled = true,
  maxParticles = DEFAULT_MAX_PARTICLES,
  maxShockwaves = DEFAULT_MAX_SHOCKWAVES,
}: HomeDriveThreeCrashFxProps) {
  const sparkMeshRef = useRef<InstancedMesh>(null);
  const dustMeshRef = useRef<InstancedMesh>(null);
  const debrisMeshRef = useRef<InstancedMesh>(null);
  const shockwaveMeshRef = useRef<InstancedMesh>(null);

  const dummy = useMemo(() => new Object3D(), []);

  const particlesRef = useRef<CrashParticle[]>(
    createParticlePool(Math.max(16, maxParticles)),
  );
  const shockwavesRef = useRef<CrashShockwave[]>(
    createShockwavePool(Math.max(2, maxShockwaves)),
  );

  const particleCursorRef = useRef(0);
  const shockwaveCursorRef = useRef(0);

  const lastPlayerImpactSerialRef = useRef(-1);
  const lastPlayerImpactAtRef = useRef(Number.NEGATIVE_INFINITY);
  const lastTrafficCollisionByVehicleIdRef = useRef<Map<string, number>>(
    new Map(),
  );

  const sparkGeometry = useMemo(() => new PlaneGeometry(1, 0.28), []);
  const dustGeometry = useMemo(() => new CircleGeometry(1, 12), []);
  const debrisGeometry = useMemo(() => new PlaneGeometry(1, 0.62), []);
  const shockwaveGeometry = useMemo(() => new RingGeometry(0.74, 1, 34), []);

  const sparkMaterial = useMemo(() => createSparkMaterial(), []);
  const dustMaterial = useMemo(() => createDustMaterial(), []);
  const debrisMaterial = useMemo(() => createDebrisMaterial(), []);
  const shockwaveMaterial = useMemo(() => createShockwaveMaterial(), []);

  const sparkCapacity = maxParticles;
  const dustCapacity = maxParticles;
  const debrisCapacity = Math.max(8, Math.floor(maxParticles * 0.5));
  const shockwaveCapacity = maxShockwaves;

  useLayoutEffect(() => {
    sparkMeshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    dustMeshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    debrisMeshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    shockwaveMeshRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useEffect(() => {
    return () => {
      disposeGeometry(sparkGeometry);
      disposeGeometry(dustGeometry);
      disposeGeometry(debrisGeometry);
      disposeGeometry(shockwaveGeometry);

      disposeMaterial(sparkMaterial);
      disposeMaterial(dustMaterial);
      disposeMaterial(debrisMaterial);
      disposeMaterial(shockwaveMaterial);
    };
  }, [
    debrisGeometry,
    debrisMaterial,
    dustGeometry,
    dustMaterial,
    shockwaveGeometry,
    shockwaveMaterial,
    sparkGeometry,
    sparkMaterial,
  ]);

  useFrame((_, deltaSeconds) => {
    if (!enabled) {
      return;
    }

    const runtime = runtimeRef.current;
    const impact = getRuntimeImpact(runtime);
    const particles = particlesRef.current;
    const shockwaves = shockwavesRef.current;

    const playerIntensity = getHomeDriveImpactIntensity(impact);
    const hasNewPlayerImpact =
      impact.serial !== lastPlayerImpactSerialRef.current ||
      impact.lastCollisionAt > lastPlayerImpactAtRef.current;

    if (
      hasNewPlayerImpact &&
      playerIntensity > 0.08 &&
      impact.elapsedSinceImpactSeconds <= PLAYER_COLLISION_FX_COOLDOWN_SECONDS
    ) {
      const origin = getPlayerCrashPosition(runtime);
      const normal = getImpactNormalFromRuntime(runtime, impact);

      spawnCrashBurst(
        particles,
        particleCursorRef,
        shockwaves,
        shockwaveCursorRef,
        origin,
        normal,
        clamp(playerIntensity * 1.32, 0.18, 1.6),
        impact.lastCollisionAt * 1000 + impact.serial * 17,
      );

      lastPlayerImpactSerialRef.current = impact.serial;
      lastPlayerImpactAtRef.current = impact.lastCollisionAt;
    }

    if (trafficRef) {
      const traffic = trafficRef.current;
      const collisionCache = lastTrafficCollisionByVehicleIdRef.current;

      for (const vehicle of traffic.vehicles) {
        if (!Number.isFinite(vehicle.lastCollisionAt)) {
          continue;
        }

        const previousCollisionAt = collisionCache.get(vehicle.id);

        if (
          previousCollisionAt === vehicle.lastCollisionAt ||
          traffic.elapsedSeconds - vehicle.lastCollisionAt >
            TRAFFIC_COLLISION_FX_WINDOW_SECONDS
        ) {
          continue;
        }

        collisionCache.set(vehicle.id, vehicle.lastCollisionAt);

        const impactSpeed = Math.hypot(
          vehicle.impactVelocity.x,
          vehicle.impactVelocity.z,
        );

        const vehicleIntensity = clamp(
          0.18 + impactSpeed / 18 + vehicle.damage * 0.18,
          0.18,
          1.45,
        );

        const normal =
          impactSpeed > 0.001
            ? {
                x: vehicle.impactVelocity.x / impactSpeed,
                z: vehicle.impactVelocity.z / impactSpeed,
              }
            : {
                x: Math.sin(vehicle.headingRad + Math.PI),
                z: Math.cos(vehicle.headingRad + Math.PI),
              };

        const origin = new Vector3(
          vehicle.position.x + vehicle.impactOffset.x,
          PARTICLE_RENDER_Y,
          vehicle.position.z + vehicle.impactOffset.z,
        );

        spawnCrashBurst(
          particles,
          particleCursorRef,
          shockwaves,
          shockwaveCursorRef,
          origin,
          normal,
          vehicleIntensity,
          vehicle.lastCollisionAt * 1000 + vehicle.variant * 29,
        );
      }
    }

    tickParticles(particles, deltaSeconds);
    tickShockwaves(shockwaves, deltaSeconds);

    syncParticleMesh(sparkMeshRef.current, particles, dummy, "spark");
    syncParticleMesh(dustMeshRef.current, particles, dummy, "dust");
    syncParticleMesh(debrisMeshRef.current, particles, dummy, "debris");
    syncShockwaveMesh(shockwaveMeshRef.current, shockwaves, dummy);
  });

  return (
    <group renderOrder={35}>
      <instancedMesh
        ref={shockwaveMeshRef}
        args={[shockwaveGeometry, shockwaveMaterial, shockwaveCapacity]}
        frustumCulled={false}
        renderOrder={35}
      />

      <instancedMesh
        ref={dustMeshRef}
        args={[dustGeometry, dustMaterial, dustCapacity]}
        frustumCulled={false}
        renderOrder={36}
      />

      <instancedMesh
        ref={debrisMeshRef}
        args={[debrisGeometry, debrisMaterial, debrisCapacity]}
        frustumCulled={false}
        renderOrder={37}
      />

      <instancedMesh
        ref={sparkMeshRef}
        args={[sparkGeometry, sparkMaterial, sparkCapacity]}
        frustumCulled={false}
        renderOrder={38}
      />
    </group>
  );
}

export default memo(HomeDriveThreeCrashFx);
