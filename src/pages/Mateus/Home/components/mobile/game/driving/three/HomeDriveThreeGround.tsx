// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeGround.tsx

import React, { useMemo } from "react";

import { hashVector } from "../domain/homeDrive.math";
import { isHomeDrivePositionBlockedByRoad } from "../domain/homeDrive.roadExclusion";
import { getHomeDriveThreeGroundBounds } from "./homeDriveThree.geometry";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";

const PATCH_GRID_SIZE = 14;
const PATCH_ROAD_CLEARANCE_SCALE = 0.18;

type GroundPatch = Readonly<{
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  rotationY: number;
  material: typeof HOME_DRIVE_THREE_MATERIALS.ground;
}>;

function HomeDriveGroundPatches() {
  const bounds = useMemo(() => getHomeDriveThreeGroundBounds(), []);

  const patches = useMemo<readonly GroundPatch[]>(() => {
    const patchWidth = bounds.width / PATCH_GRID_SIZE;
    const patchDepth = bounds.depth / PATCH_GRID_SIZE;

    return Array.from({ length: PATCH_GRID_SIZE * PATCH_GRID_SIZE }, (_, index) => {
      const xIndex = index % PATCH_GRID_SIZE;
      const zIndex = Math.floor(index / PATCH_GRID_SIZE);
      const seed = hashVector(xIndex, zIndex, 311);

      const x = bounds.center.x - bounds.width / 2 + patchWidth * (xIndex + 0.5);
      const z = bounds.center.z - bounds.depth / 2 + patchDepth * (zIndex + 0.5);

      const width = patchWidth * (0.72 + hashVector(xIndex, zIndex, 313) * 0.34);
      const depth = patchDepth * (0.72 + hashVector(xIndex, zIndex, 317) * 0.34);

      const patchRadius = Math.max(width, depth) * PATCH_ROAD_CLEARANCE_SCALE;

      if (
        isHomeDrivePositionBlockedByRoad(
          {
            x,
            z,
          },
          patchRadius,
        )
      ) {
        return null;
      }

      const material =
        seed > 0.58
          ? HOME_DRIVE_THREE_MATERIALS.groundPatchLight
          : HOME_DRIVE_THREE_MATERIALS.groundPatchDark;

      return {
        id: `ground-patch-${xIndex}-${zIndex}`,
        x,
        z,
        width,
        depth,
        rotationY: (hashVector(xIndex, zIndex, 319) - 0.5) * 0.7,
        material,
      };
    }).filter((patch): patch is GroundPatch => Boolean(patch));
  }, [bounds]);

  return (
    <>
      {patches.map((patch) => (
        <mesh
          key={patch.id}
          position={[patch.x, 0.012, patch.z]}
          rotation={[-Math.PI / 2, 0, patch.rotationY]}
          material={patch.material}
          renderOrder={1}
        >
          <planeGeometry args={[patch.width, patch.depth]} />
        </mesh>
      ))}
    </>
  );
}

export default function HomeDriveThreeGround() {
  const bounds = useMemo(() => getHomeDriveThreeGroundBounds(), []);

  return (
    <group>
      <mesh
        position={[bounds.center.x, 0, bounds.center.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={HOME_DRIVE_THREE_MATERIALS.ground}
      >
        <planeGeometry args={[bounds.width + 800, bounds.depth + 800, 24, 24]} />
      </mesh>

      <HomeDriveGroundPatches />
    </group>
  );
}
