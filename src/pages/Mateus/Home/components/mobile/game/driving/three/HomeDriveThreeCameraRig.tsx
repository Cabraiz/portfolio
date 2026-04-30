// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeCameraRig.tsx

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import { normalizeHomeDriveImpactState } from "../domain/homeDrive.impact";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import type { HomeDriveThreeCameraConfig } from "./homeDriveThree.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeCameraRigProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  config?: Partial<HomeDriveThreeCameraConfig>;
}>;

const DEFAULT_CAMERA_CONFIG: HomeDriveThreeCameraConfig = {
  heightMeters: 2.48,
  lookAheadMeters: 72,
  pitchOffsetMeters: -2.38,
  fov: 68,
  near: 0.1,
  far: 3600,
};

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
  }, [camera, resolvedConfig.far, resolvedConfig.fov, resolvedConfig.near]);

  useFrame(() => {
    const runtime = runtimeRef.current;
    const { car } = runtime;
    const impact = normalizeHomeDriveImpactState(runtime.impact);

    const sin = Math.sin(car.headingRad);
    const cos = Math.cos(car.headingRad);

    const speedRatio = Math.min(Math.abs(car.speedMps) / 42, 1);
    const speedEase = speedRatio * speedRatio * (3 - 2 * speedRatio);

    const shake = Math.min(2.15, Math.max(0, impact.cameraShake));
    const impulse = Math.min(18.5, Math.max(0, impact.collisionImpulse));

    const bobOffset =
      Math.sin(runtime.elapsedSeconds * 6.8) * speedEase * 0.032;

    const speedLowering = speedEase * 0.08;
    const dynamicLookAhead = resolvedConfig.lookAheadMeters + speedEase * 14;

    const shakeX =
      Math.sin(runtime.elapsedSeconds * 78.0) *
      shake *
      (0.13 + impulse * 0.01);

    const shakeY =
      Math.cos(runtime.elapsedSeconds * 67.0) *
      shake *
      (0.07 + impulse * 0.006);

    const shakeZ =
      Math.sin(runtime.elapsedSeconds * 91.0) *
      shake *
      (0.12 + impulse * 0.009);

    const crashLean =
      impact.visualRollRad * 0.18 +
      Math.sin(runtime.elapsedSeconds * 47.0) * shake * 0.05;

    const rollOffset = -car.steerAngleRad * 0.16 + crashLean;
    const pitchKick = impact.visualPitchRad * 0.32 - shake * 0.023;

    const cameraPosition = cameraPositionRef.current;
    const lookTarget = lookTargetRef.current;

    cameraPosition.set(
      car.position.x + shakeX,
      resolvedConfig.heightMeters - speedLowering + bobOffset + shakeY,
      car.position.z + shakeZ,
    );

    lookTarget.set(
      car.position.x + sin * dynamicLookAhead,
      resolvedConfig.heightMeters +
        resolvedConfig.pitchOffsetMeters +
        speedEase * 0.18 +
        shakeY * 0.28 +
        pitchKick,
      car.position.z + cos * dynamicLookAhead,
    );

    camera.position.lerp(cameraPosition, 0.56);
    camera.lookAt(lookTarget);
    camera.rotation.z += rollOffset;
  });

  return null;
}
