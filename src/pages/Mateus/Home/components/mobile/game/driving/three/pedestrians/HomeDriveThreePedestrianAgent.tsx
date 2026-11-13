// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianAgent.tsx



import { memo, useMemo } from "react";



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
import {
  renderHomeDriveThreePedestrianArms,
  renderHomeDriveThreePedestrianLegs,
  getHairScaleVariant,
} from "./HomeDriveThreePedestrianAgent.parts";



export type HomeDriveThreePedestrianDetailLevel = "full" | "medium";



export type HomeDriveThreePedestrianAgentProps = Readonly<{

  agent: HomeDrivePedestrianAgent;

  visible?: boolean;

  detailLevel?: HomeDriveThreePedestrianDetailLevel;

}>;



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



  const limbParts = {
    profile,
    renderPose,
    skinMaterial,
    clothingMaterials,
    renderOrder,
    renderFullDetail,
  };


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

          renderHomeDriveThreePedestrianArms(limbParts)

        ) : null}



        {renderHomeDriveThreePedestrianLegs(limbParts)}



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



