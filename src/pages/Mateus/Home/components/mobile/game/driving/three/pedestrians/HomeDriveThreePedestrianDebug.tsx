// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianDebug.tsx

import React, { memo } from "react";

import type { HomeDrivePedestrianRuntimeState } from "../../domain/pedestrians";
import { HOME_DRIVE_THREE_PEDESTRIAN_DEBUG_MATERIALS } from "./homeDriveThree.pedestrianMaterials";

export type HomeDriveThreePedestrianDebugProps = Readonly<{
  pedestrians: HomeDrivePedestrianRuntimeState;
  enabled?: boolean;
  maxZones?: number;
}>;

function getZoneHeadingRad(
  from: Readonly<{ x: number; z: number }>,
  to: Readonly<{ x: number; z: number }>,
): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

function HomeDriveThreePedestrianDebug({
  pedestrians,
  enabled = false,
  maxZones = 120,
}: HomeDriveThreePedestrianDebugProps) {
  if (!enabled) {
    return null;
  }

  return (
    <group renderOrder={8}>
      {pedestrians.zones.slice(0, maxZones).map((zone) => {
        const headingRad = getZoneHeadingRad(zone.from, zone.to);

        return (
          <group key={zone.id}>
            <mesh
              material={HOME_DRIVE_THREE_PEDESTRIAN_DEBUG_MATERIALS.sidewalk}
              position={[zone.center.x, 0.035, zone.center.z]}
              rotation={[-Math.PI / 2, 0, -headingRad]}
              renderOrder={8}
            >
              <planeGeometry args={[zone.widthMeters, zone.lengthMeters]} />
            </mesh>

            <mesh
              material={HOME_DRIVE_THREE_PEDESTRIAN_DEBUG_MATERIALS.zoneCenter}
              position={[zone.center.x, 0.14, zone.center.z]}
              renderOrder={9}
            >
              <sphereGeometry args={[0.18, 8, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default memo(HomeDriveThreePedestrianDebug);
