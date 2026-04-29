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

/*
  Camera baixa, mais próxima de carro comum.

  Antes:
  - heightMeters: 4.2
  - lookAheadMeters: 72
  - pitchOffsetMeters: -3.8
  - fov: 62

  Isso dava sensação de veículo alto/ônibus.
*/
const DEFAULT_CAMERA_CONFIG: HomeDriveThreeCameraConfig = {
  heightMeters: 2.65,
  lookAheadMeters: 64,
  pitchOffsetMeters: -2.45,
  fov: 66,
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
    const impact = normalizeHomeDriveImpactState(runtime.impact);

    const sin = Math.sin(car.headingRad);
    const cos = Math.cos(car.headingRad);

    const speedFactor = Math.min(Math.abs(car.speedMps) / 32, 1);
    const shake = Math.min(2.15, Math.max(0, impact.cameraShake));
    const impulse = Math.min(18.5, Math.max(0, impact.collisionImpulse));

    /*
      Bob menor porque a câmera agora está mais baixa.
      Se deixar alto demais, parece que o carro está pulando.
    */
    const bobOffset =
      Math.sin(runtime.elapsedSeconds * 6.4) * speedFactor * 0.025;

    const shakeX =
      Math.sin(runtime.elapsedSeconds * 78.0) *
      shake *
      (0.14 + impulse * 0.011);

    const shakeY =
      Math.cos(runtime.elapsedSeconds * 67.0) *
      shake *
      (0.08 + impulse * 0.007);

    const shakeZ =
      Math.sin(runtime.elapsedSeconds * 91.0) *
      shake *
      (0.13 + impulse * 0.01);

    const crashLean =
      impact.visualRollRad * 0.18 +
      Math.sin(runtime.elapsedSeconds * 47.0) * shake * 0.052;

    const rollOffset = -car.steerAngleRad * 0.18 + crashLean;
    const pitchKick = impact.visualPitchRad * 0.34 - shake * 0.025;

    const cameraPosition = cameraPositionRef.current;
    const lookTarget = lookTargetRef.current;

    cameraPosition.set(
      car.position.x + shakeX,
      resolvedConfig.heightMeters + bobOffset + shakeY,
      car.position.z + shakeZ,
    );

    lookTarget.set(
      car.position.x + sin * resolvedConfig.lookAheadMeters,
      resolvedConfig.heightMeters +
        resolvedConfig.pitchOffsetMeters +
        shakeY * 0.3 +
        pitchKick,
      car.position.z + cos * resolvedConfig.lookAheadMeters,
    );

    /*
      Lerp um pouco mais firme para a câmera baixa não atrasar demais.
      Se ficar dura, volte para 0.5.
    */
    camera.position.lerp(cameraPosition, 0.58);
    camera.lookAt(lookTarget);

    /*
      lookAt recalcula a rotação; o roll precisa ser aplicado depois.
      O impacto adiciona uma vibração curta sem depender de React state.
    */
    camera.rotation.z += rollOffset;
  });

  return null;
}
