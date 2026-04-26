// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeCameraRig.tsx

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import type { HomeDriveThreeCameraConfig } from "./homeDriveThree.types";

export type HomeDriveThreeCameraRigProps = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
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

    const sin = Math.sin(car.headingRad);
    const cos = Math.cos(car.headingRad);

    const speedFactor = Math.min(Math.abs(car.speedMps) / 32, 1);
    const bobOffset =
      Math.sin(runtime.elapsedSeconds * 6.4) * speedFactor * 0.035;
    const rollOffset = -car.steerAngleRad * 0.18;

    const cameraPosition = cameraPositionRef.current;
    const lookTarget = lookTargetRef.current;

    cameraPosition.set(
      car.position.x,
      resolvedConfig.heightMeters + bobOffset,
      car.position.z,
    );

    lookTarget.set(
      car.position.x + sin * resolvedConfig.lookAheadMeters,
      resolvedConfig.heightMeters + resolvedConfig.pitchOffsetMeters,
      car.position.z + cos * resolvedConfig.lookAheadMeters,
    );

    camera.position.lerp(cameraPosition, 0.5);
    camera.lookAt(lookTarget);

    /*
      lookAt recalcula a rotação; o roll precisa ser aplicado depois.
      Não acumule além disso em state React.
    */
    camera.rotation.z += rollOffset;
  });

  return null;
}
