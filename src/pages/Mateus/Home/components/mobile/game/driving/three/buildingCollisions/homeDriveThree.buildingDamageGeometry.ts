// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingDamageGeometry.ts

import {
  BoxGeometry,
  CylinderGeometry,
  PlaneGeometry,
  type BufferGeometry,
} from "three";

export type HomeDriveThreeBuildingDamageGeometrySet = Readonly<{
  facadePlane: PlaneGeometry;
  chunkBox: BoxGeometry;
  debrisBox: BoxGeometry;
  rebarCylinder: CylinderGeometry;
}>;

export function createHomeDriveThreeBuildingDamageGeometries(): HomeDriveThreeBuildingDamageGeometrySet {
  return {
    facadePlane: new PlaneGeometry(1, 1),
    chunkBox: new BoxGeometry(1, 1, 1, 2, 1, 1),
    debrisBox: new BoxGeometry(1, 1, 1, 1, 1, 1),
    rebarCylinder: new CylinderGeometry(1, 1, 1, 8, 1),
  };
}

export function disposeHomeDriveThreeBuildingDamageGeometries(
  geometries: HomeDriveThreeBuildingDamageGeometrySet,
): void {
  Object.values(geometries).forEach((geometry: BufferGeometry) => {
    geometry.dispose();
  });
}
