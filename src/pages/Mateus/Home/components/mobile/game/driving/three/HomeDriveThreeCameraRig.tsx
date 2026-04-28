// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeCameraRig.tsx

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import type { HomeDriveThreeCameraConfig } from "./homeDriveThree.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveRuntimeImpactState = Readonly<{
  cameraShake: number;
  collisionImpulse: number;
  lastCollisionAt: number;
}>;

type HomeDriveRuntimeWithImpact = HomeDriveRuntimeState & {
  impact?: HomeDriveRuntimeImpactState;
};

export type HomeDriveThreeCameraRigProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  config?: Partial<HomeDriveThreeCameraConfig>;
}>;

const DEFAULT_CAMERA_CONFIG: HomeDriveThreeCameraConfig = {
  heightMeters: 4.2,
  lookAheadMeters: 72,
  pitchOffsetMeters: -3.8,
  fov: 62,
  near: 0.1,
  far: 3600,
};

function getRuntimeImpact(
  runtime: HomeDriveRuntimeState,
): HomeDriveRuntimeImpactState {
  const runtimeWithImpact = runtime as HomeDriveRuntimeWithImpact;

  return (
    runtimeWithImpact.impact ?? {
      cameraShake: 0,
      collisionImpulse: 0,
      lastCollisionAt: -999,
    }
  );
}

export default function HomeDriveThreeCameraRig({
  runtimeRef,
  config,
}: HomeDriveThreeCameraRigProps) {
  const { camera } = useThree();

  const cameraPositionRef = useRef(new Vector3());
  const lookTargetRef = useRef(new Vector3());

  const resolvedConfig = useMemo<HomeDriveThreeCameraConfig>(() => {
    return {
      ...DEFAULT_CAMERA_CONFIG,
      ...config,
    };
  }, [config]);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }

    camera.fov = resolvedConfig.fov;
    camera.near = resolvedConfig.near;
    camera.far = resolvedConfig.far;
    camera.updateProjectionMatrix();
  }, [
    camera,
    resolvedConfig.far,
    resolvedConfig.fov,
    resolvedConfig.near,
  ]);

  useFrame(() => {
    const runtime = runtimeRef.current;
    const { car } = runtime;
    const impact = getRuntimeImpact(runtime);

    const sin = Math.sin(car.headingRad);
    const cos = Math.cos(car.headingRad);

    const speedFactor = Math.min(Math.abs(car.speedMps) / 32, 1);
    const shake = Math.min(1.15, Math.max(0, impact.cameraShake));
    const impulse = Math.min(9.5, Math.max(0, impact.collisionImpulse));

    const bobOffset =
      Math.sin(runtime.elapsedSeconds * 6.4) * speedFactor * 0.035;

    const shakeX =
      Math.sin(runtime.elapsedSeconds * 63.0) * shake * (0.16 + impulse * 0.012);
    const shakeY =
      Math.cos(runtime.elapsedSeconds * 57.0) * shake * (0.1 + impulse * 0.008);
    const shakeZ =
      Math.sin(runtime.elapsedSeconds * 49.0) * shake * (0.12 + impulse * 0.008);

    const rollOffset =
      -car.steerAngleRad * 0.18 +
      Math.sin(runtime.elapsedSeconds * 41.0) * shake * 0.035;

    const cameraPosition = cameraPositionRef.current;
    const lookTarget = lookTargetRef.current;

    cameraPosition.set(
      car.position.x + shakeX,
      resolvedConfig.heightMeters + bobOffset + shakeY,
      car.position.z + shakeZ,
    );

    lookTarget.set(
      car.position.x + sin * resolvedConfig.lookAheadMeters,
      resolvedConfig.heightMeters + resolvedConfig.pitchOffsetMeters + shakeY * 0.35,
      car.position.z + cos * resolvedConfig.lookAheadMeters,
    );

    camera.position.lerp(cameraPosition, 0.5);
    camera.lookAt(lookTarget);

    /*
      lookAt recalcula a rotação; o roll precisa ser aplicado depois.
      O impacto adiciona uma vibração curta sem depender de React state.
    */
    camera.rotation.z += rollOffset;
  });

  return null;
}
