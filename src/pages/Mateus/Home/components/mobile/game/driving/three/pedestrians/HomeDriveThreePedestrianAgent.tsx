// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianAgent.tsx

import React, { memo, useMemo } from "react";

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { useHomeDriveThreePedestrianPose } from "./HomeDriveThreePedestrianAnimator";
import HomeDriveThreePedestrianPropsLayer from "./HomeDriveThreePedestrianProps";
import {
  getHomeDriveThreePedestrianProceduralProfile,
  getHomeDriveThreePedestrianRenderOrder,
} from "./homeDriveThree.pedestrianAssets";
import {
  getHomeDriveThreePedestrianClothingMaterials,
  getHomeDriveThreePedestrianHairMaterial,
  getHomeDriveThreePedestrianSkinMaterial,
} from "./homeDriveThree.pedestrianMaterials";

export type HomeDriveThreePedestrianAgentProps = Readonly<{
  agent: HomeDrivePedestrianAgent;
  visible?: boolean;
}>;

function getHairScaleVariant(variant: number): readonly [number, number, number] {
  const normalized = Math.abs(variant) % 4;

  if (normalized === 0) {
    return [1.08, 0.48, 1.0];
  }

  if (normalized === 1) {
    return [0.9, 0.28, 0.92];
  }

  if (normalized === 2) {
    return [1.18, 0.62, 1.12];
  }

  return [0.76, 0.22, 0.78];
}

function HomeDriveThreePedestrianAgent({
  agent,
  visible = true,
}: HomeDriveThreePedestrianAgentProps) {
  const profile = useMemo(() => {
    return getHomeDriveThreePedestrianProceduralProfile(agent);
  }, [agent]);

  const pose = useHomeDriveThreePedestrianPose(agent);
  const skinMaterial = getHomeDriveThreePedestrianSkinMaterial(
    agent.appearance.skinToneKey,
  );
  const clothingMaterials = getHomeDriveThreePedestrianClothingMaterials(
    agent.appearance.clothingPaletteKey,
  );
  const hairMaterial = getHomeDriveThreePedestrianHairMaterial(
    agent.appearance.hairVariant,
  );
  const renderOrder = getHomeDriveThreePedestrianRenderOrder(agent);
  const hairScale = getHairScaleVariant(agent.appearance.hairVariant);

  if (!visible) {
    return null;
  }

  return (
    <group
      position={[agent.position.x, pose.bobY, agent.position.z]}
      rotation={[0, agent.headingRad, 0]}
      renderOrder={renderOrder}
    >
      <group
        rotation={[pose.torsoPitchRad, 0, pose.torsoRollRad]}
        position={[0, 0, 0]}
      >
        <mesh
          material={clothingMaterials.shirt}
          position={[0, profile.hipY + profile.torsoHeightMeters * 0.45, 0]}
          renderOrder={renderOrder}
        >
          <boxGeometry
            args={[
              profile.torsoWidthMeters,
              profile.torsoHeightMeters,
              profile.torsoDepthMeters,
            ]}
          />
        </mesh>

        <mesh
          material={clothingMaterials.pants}
          position={[0, profile.hipY - profile.legLengthMeters * 0.08, 0]}
          renderOrder={renderOrder}
        >
          <boxGeometry
            args={[
              profile.hipWidthMeters,
              profile.torsoHeightMeters * 0.28,
              profile.torsoDepthMeters * 0.9,
            ]}
          />
        </mesh>

        <group
          position={[0, profile.headY, 0]}
          rotation={[pose.headPitchRad, pose.headYawRad, 0]}
        >
          <mesh material={skinMaterial} renderOrder={renderOrder + 1}>
            <sphereGeometry args={[profile.headRadiusMeters, 14, 12]} />
          </mesh>

          <mesh
            material={hairMaterial}
            position={[0, profile.headRadiusMeters * 0.58, -profile.headRadiusMeters * 0.03]}
            scale={hairScale}
            renderOrder={renderOrder + 2}
          >
            <sphereGeometry args={[profile.headRadiusMeters * 0.92, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          </mesh>
        </group>

        <group
          position={[profile.torsoWidthMeters * 0.56, profile.shoulderY, 0]}
          rotation={[pose.leftArmPitchRad, 0, pose.leftArmSideRad]}
        >
          <mesh
            material={skinMaterial}
            position={[0, -profile.armLengthMeters * 0.28, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.armRadiusMeters, profile.armLengthMeters * 0.55, 5, 8]} />
          </mesh>
          <mesh
            material={skinMaterial}
            position={[0, -profile.armLengthMeters * 0.76, 0]}
            rotation={[pose.leftForearmPitchRad, 0, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.armRadiusMeters * 0.92, profile.armLengthMeters * 0.38, 5, 8]} />
          </mesh>
        </group>

        <group
          position={[-profile.torsoWidthMeters * 0.56, profile.shoulderY, 0]}
          rotation={[pose.rightArmPitchRad, 0, pose.rightArmSideRad]}
        >
          <mesh
            material={skinMaterial}
            position={[0, -profile.armLengthMeters * 0.28, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.armRadiusMeters, profile.armLengthMeters * 0.55, 5, 8]} />
          </mesh>
          <mesh
            material={skinMaterial}
            position={[0, -profile.armLengthMeters * 0.76, 0]}
            rotation={[pose.rightForearmPitchRad, 0, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.armRadiusMeters * 0.92, profile.armLengthMeters * 0.38, 5, 8]} />
          </mesh>
        </group>

        <group
          position={[profile.hipWidthMeters * 0.24, profile.hipY, 0]}
          rotation={[pose.leftLegPitchRad, 0, 0]}
        >
          <mesh
            material={clothingMaterials.pants}
            position={[0, -profile.legLengthMeters * 0.42, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.legRadiusMeters, profile.legLengthMeters * 0.78, 5, 8]} />
          </mesh>
          <mesh
            material={clothingMaterials.shoes}
            position={[0, -profile.legLengthMeters * 0.86, profile.footLengthMeters * 0.2]}
            rotation={[pose.leftFootPitchRad, 0, 0]}
            renderOrder={renderOrder + 1}
          >
            <boxGeometry
              args={[
                profile.footWidthMeters,
                profile.legRadiusMeters * 0.84,
                profile.footLengthMeters,
              ]}
            />
          </mesh>
        </group>

        <group
          position={[-profile.hipWidthMeters * 0.24, profile.hipY, 0]}
          rotation={[pose.rightLegPitchRad, 0, 0]}
        >
          <mesh
            material={clothingMaterials.pants}
            position={[0, -profile.legLengthMeters * 0.42, 0]}
            renderOrder={renderOrder}
          >
            <capsuleGeometry args={[profile.legRadiusMeters, profile.legLengthMeters * 0.78, 5, 8]} />
          </mesh>
          <mesh
            material={clothingMaterials.shoes}
            position={[0, -profile.legLengthMeters * 0.86, profile.footLengthMeters * 0.2]}
            rotation={[pose.rightFootPitchRad, 0, 0]}
            renderOrder={renderOrder + 1}
          >
            <boxGeometry
              args={[
                profile.footWidthMeters,
                profile.legRadiusMeters * 0.84,
                profile.footLengthMeters,
              ]}
            />
          </mesh>
        </group>

        <HomeDriveThreePedestrianPropsLayer agent={agent} profile={profile} />
      </group>
    </group>
  );
}

export default memo(HomeDriveThreePedestrianAgent);
