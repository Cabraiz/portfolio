// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildingSigns.tsx

import { memo, useEffect, useMemo } from "react";
import { DoubleSide } from "three";

import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import {
	type HomeDriveMutableRef,
	type HomeDriveBuildingSignInstance,
	DEFAULT_MAX_SOURCE_BUILDINGS,
	DEFAULT_MAX_VISIBLE_SIGNS,
	DEFAULT_VISIBLE_RADIUS_METERS,
	createBuildingSignInstance,
	selectSignBuildings,
} from "./HomeDriveThreeBuildingSigns.instances";

export type HomeDriveThreeBuildingSignsProps = Readonly<{
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  maxSourceBuildings?: number;
  maxVisibleSigns?: number;
  visibleRadiusMeters?: number;
}>;

function HomeDriveThreeBuildingSigns({
  runtimeRef,
  maxSourceBuildings = DEFAULT_MAX_SOURCE_BUILDINGS,
  maxVisibleSigns = DEFAULT_MAX_VISIBLE_SIGNS,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
}: HomeDriveThreeBuildingSignsProps) {
  const signs = useMemo(() => {
    const buildings = getHomeDriveBuildings({
      maxBuildings: maxSourceBuildings,
    });

    const selectedBuildings = selectSignBuildings(
      buildings,
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleSigns,
    );

    return selectedBuildings
      .map(createBuildingSignInstance)
      .filter((sign): sign is HomeDriveBuildingSignInstance => Boolean(sign));
  }, [maxSourceBuildings, maxVisibleSigns, runtimeRef, visibleRadiusMeters]);

  useEffect(() => {
    return () => {
      signs.forEach((sign) => {
        sign.texture.dispose();
      });
    };
  }, [signs]);

  if (signs.length <= 0) {
    return null;
  }

  return (
    <group renderOrder={29}>
      {signs.map((sign) => (
        <mesh
          key={sign.id}
          position={sign.position}
          rotation={[0, sign.rotationYRad, 0]}
          scale={[sign.widthMeters, sign.heightMeters, 1]}
          renderOrder={sign.renderOrder}
          frustumCulled
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={sign.texture}
            transparent
            depthWrite={false}
            toneMapped={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingSigns);
