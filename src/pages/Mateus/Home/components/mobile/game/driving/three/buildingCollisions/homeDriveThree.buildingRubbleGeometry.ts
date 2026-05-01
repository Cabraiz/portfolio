// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingRubbleGeometry.ts

import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  TetrahedronGeometry,
} from "three";

export type HomeDriveThreeBuildingRubbleGeometrySet = Readonly<{
  concreteBoulder: BufferGeometry;
  concreteRock: BufferGeometry;
  smallStone: BufferGeometry;
  plasterShard: BufferGeometry;
  brokenSlab: BufferGeometry;
  dustMound: BufferGeometry;
  rebarPiece: BufferGeometry;
}>;

export function createHomeDriveThreeBuildingRubbleGeometries(): HomeDriveThreeBuildingRubbleGeometrySet {
  const concreteBoulder = new DodecahedronGeometry(0.5, 1);
  const concreteRock = new IcosahedronGeometry(0.5, 1);
  const smallStone = new TetrahedronGeometry(0.5, 1);
  const plasterShard = new BoxGeometry(1, 1, 1, 1, 1, 1);
  const brokenSlab = new BoxGeometry(1, 1, 1, 1, 1, 1);
  const dustMound = new DodecahedronGeometry(0.5, 0);
  const rebarPiece = new CylinderGeometry(0.5, 0.5, 1, 8, 1, false);

  concreteBoulder.computeVertexNormals();
  concreteRock.computeVertexNormals();
  smallStone.computeVertexNormals();
  plasterShard.computeVertexNormals();
  brokenSlab.computeVertexNormals();
  dustMound.computeVertexNormals();
  rebarPiece.computeVertexNormals();

  return {
    concreteBoulder,
    concreteRock,
    smallStone,
    plasterShard,
    brokenSlab,
    dustMound,
    rebarPiece,
  };
}

export function disposeHomeDriveThreeBuildingRubbleGeometries(
  geometries: HomeDriveThreeBuildingRubbleGeometrySet,
): void {
  geometries.concreteBoulder.dispose();
  geometries.concreteRock.dispose();
  geometries.smallStone.dispose();
  geometries.plasterShard.dispose();
  geometries.brokenSlab.dispose();
  geometries.dustMound.dispose();
  geometries.rebarPiece.dispose();
}
