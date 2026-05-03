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
import { getHomeDriveThreePedestrianImpactVisual } from "./homeDriveThree.pedestrianImpactVisual";



export type HomeDriveThreePedestrianDetailLevel = "full" | "medium";



export type HomeDriveThreePedestrianAgentProps = Readonly<{

  agent: HomeDrivePedestrianAgent;

  visible?: boolean;

  detailLevel?: HomeDriveThreePedestrianDetailLevel;

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



function HomeDriveThreePedestrianProxy({

  agent,

}: Readonly<{

  agent: HomeDrivePedestrianAgent;

}>) {

  const profile = useMemo(() => {

    return getHomeDriveThreePedestrianProceduralProfile(agent);

  }, [agent.appearance.outfitVariant, agent.role]);



  const clothingMaterials = getHomeDriveThreePedestrianClothingMaterials(

    agent.appearance.clothingPaletteKey,

  );

  const skinMaterial = getHomeDriveThreePedestrianSkinMaterial(

    agent.appearance.skinToneKey,

  );

  const renderOrder = getHomeDriveThreePedestrianRenderOrder(agent);
  const impactVisual = getHomeDriveThreePedestrianImpactVisual(agent);



  return (

    <group

      position={[agent.position.x, impactVisual.yOffsetMeters, agent.position.z]}

      rotation={[
        impactVisual.pitchRad,
        agent.headingRad + impactVisual.yawRad,
        impactVisual.rollRad,
      ]}

      renderOrder={renderOrder}

    >

      <mesh

        material={clothingMaterials.shirt}

        position={[0, profile.hipY + profile.torsoHeightMeters * 0.34, 0]}

        renderOrder={renderOrder}

      >

        <capsuleGeometry

          args={[

            Math.max(profile.torsoWidthMeters * 0.36, 0.11),

            profile.torsoHeightMeters * 0.82,

            3,

            6,

          ]}

        />

      </mesh>



      <mesh

        material={skinMaterial}

        position={[0, profile.headY, 0]}

        renderOrder={renderOrder + 1}

      >

        <sphereGeometry args={[profile.headRadiusMeters * 0.82, 8, 6]} />

      </mesh>

    </group>

  );

}



function HomeDriveThreePedestrianDetailed({

  agent,

  detailLevel,

}: Readonly<{

  agent: HomeDrivePedestrianAgent;

  detailLevel: HomeDriveThreePedestrianDetailLevel;

}>) {

  const profile = useMemo(() => {

    return getHomeDriveThreePedestrianProceduralProfile(agent);

  }, [agent.appearance.outfitVariant, agent.role]);



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

  const renderFullDetail = detailLevel === "full";
  const impactVisual = getHomeDriveThreePedestrianImpactVisual(agent);
  const renderPose = impactVisual.suppressesLocomotionPose
    ? {
        ...pose,
        bobY: 0,
        torsoPitchRad: 0,
        torsoRollRad: 0,
        headPitchRad: 0,
        headYawRad: 0,
        leftArmPitchRad: 0,
        leftArmSideRad: 0,
        leftForearmPitchRad: 0,
        rightArmPitchRad: 0,
        rightArmSideRad: 0,
        rightForearmPitchRad: 0,
        leftLegPitchRad: 0,
        leftFootPitchRad: 0,
        rightLegPitchRad: 0,
        rightFootPitchRad: 0,
      }
    : pose;



  return (

    <group

      position={[
        agent.position.x,
        impactVisual.suppressesLocomotionPose
          ? impactVisual.yOffsetMeters
          : renderPose.bobY + impactVisual.yOffsetMeters,
        agent.position.z,
      ]}

      rotation={[
        impactVisual.pitchRad,
        agent.headingRad + impactVisual.yawRad,
        impactVisual.rollRad,
      ]}

      renderOrder={renderOrder}

    >

      <group

        rotation={[renderPose.torsoPitchRad, 0, renderPose.torsoRollRad]}

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

          rotation={[renderPose.headPitchRad, renderPose.headYawRad, 0]}

        >

          <mesh material={skinMaterial} renderOrder={renderOrder + 1}>

            <sphereGeometry

              args={[

                profile.headRadiusMeters,

                renderFullDetail ? 14 : 10,

                renderFullDetail ? 12 : 8,

              ]}

            />

          </mesh>



          {renderFullDetail ? (

            <mesh

              material={hairMaterial}

              position={[

                0,

                profile.headRadiusMeters * 0.58,

                -profile.headRadiusMeters * 0.03,

              ]}

              scale={hairScale}

              renderOrder={renderOrder + 2}

            >

              <sphereGeometry

                args={[

                  profile.headRadiusMeters * 0.92,

                  14,

                  8,

                  0,

                  Math.PI * 2,

                  0,

                  Math.PI * 0.58,

                ]}

              />

            </mesh>

          ) : null}

        </group>



        {renderFullDetail ? (

          <>

            <group

              position={[profile.torsoWidthMeters * 0.56, profile.shoulderY, 0]}

              rotation={[renderPose.leftArmPitchRad, 0, renderPose.leftArmSideRad]}

            >

              <mesh

                material={skinMaterial}

                position={[0, -profile.armLengthMeters * 0.28, 0]}

                renderOrder={renderOrder}

              >

                <capsuleGeometry

                  args={[

                    profile.armRadiusMeters,

                    profile.armLengthMeters * 0.55,

                    4,

                    6,

                  ]}

                />

              </mesh>

              <mesh

                material={skinMaterial}

                position={[0, -profile.armLengthMeters * 0.76, 0]}

                rotation={[renderPose.leftForearmPitchRad, 0, 0]}

                renderOrder={renderOrder}

              >

                <capsuleGeometry

                  args={[

                    profile.armRadiusMeters * 0.92,

                    profile.armLengthMeters * 0.38,

                    4,

                    6,

                  ]}

                />

              </mesh>

            </group>



            <group

              position={[-profile.torsoWidthMeters * 0.56, profile.shoulderY, 0]}

              rotation={[renderPose.rightArmPitchRad, 0, renderPose.rightArmSideRad]}

            >

              <mesh

                material={skinMaterial}

                position={[0, -profile.armLengthMeters * 0.28, 0]}

                renderOrder={renderOrder}

              >

                <capsuleGeometry

                  args={[

                    profile.armRadiusMeters,

                    profile.armLengthMeters * 0.55,

                    4,

                    6,

                  ]}

                />

              </mesh>

              <mesh

                material={skinMaterial}

                position={[0, -profile.armLengthMeters * 0.76, 0]}

                rotation={[renderPose.rightForearmPitchRad, 0, 0]}

                renderOrder={renderOrder}

              >

                <capsuleGeometry

                  args={[

                    profile.armRadiusMeters * 0.92,

                    profile.armLengthMeters * 0.38,

                    4,

                    6,

                  ]}

                />

              </mesh>

            </group>

          </>

        ) : null}



        <group

          position={[profile.hipWidthMeters * 0.24, profile.hipY, 0]}

          rotation={[renderPose.leftLegPitchRad, 0, 0]}

        >

          <mesh

            material={clothingMaterials.pants}

            position={[0, -profile.legLengthMeters * 0.42, 0]}

            renderOrder={renderOrder}

          >

            <capsuleGeometry

              args={[

                profile.legRadiusMeters,

                profile.legLengthMeters * 0.78,

                renderFullDetail ? 4 : 3,

                renderFullDetail ? 6 : 5,

              ]}

            />

          </mesh>



          {renderFullDetail ? (

            <mesh

              material={clothingMaterials.shoes}

              position={[

                0,

                -profile.legLengthMeters * 0.86,

                profile.footLengthMeters * 0.2,

              ]}

              rotation={[renderPose.leftFootPitchRad, 0, 0]}

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

          ) : null}

        </group>



        <group

          position={[-profile.hipWidthMeters * 0.24, profile.hipY, 0]}

          rotation={[renderPose.rightLegPitchRad, 0, 0]}

        >

          <mesh

            material={clothingMaterials.pants}

            position={[0, -profile.legLengthMeters * 0.42, 0]}

            renderOrder={renderOrder}

          >

            <capsuleGeometry

              args={[

                profile.legRadiusMeters,

                profile.legLengthMeters * 0.78,

                renderFullDetail ? 4 : 3,

                renderFullDetail ? 6 : 5,

              ]}

            />

          </mesh>



          {renderFullDetail ? (

            <mesh

              material={clothingMaterials.shoes}

              position={[

                0,

                -profile.legLengthMeters * 0.86,

                profile.footLengthMeters * 0.2,

              ]}

              rotation={[renderPose.rightFootPitchRad, 0, 0]}

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

          ) : null}

        </group>



        {renderFullDetail ? (

          <HomeDriveThreePedestrianPropsLayer agent={agent} profile={profile} />

        ) : null}

      </group>

    </group>

  );

}



function HomeDriveThreePedestrianAgent({

  agent,

  visible = true,

  detailLevel = "full",

}: HomeDriveThreePedestrianAgentProps) {

  if (!visible) {

    return null;

  }



  return (

    <HomeDriveThreePedestrianDetailed

      agent={agent}

      detailLevel={detailLevel}

    />

  );

}



export default memo(HomeDriveThreePedestrianAgent);



