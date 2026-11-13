// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianAgent.parts.tsx

import type { MeshStandardMaterial } from "three";

import type { HomeDriveThreePedestrianPose } from "./HomeDriveThreePedestrianAnimator";
import type { HomeDriveThreePedestrianProceduralProfile } from "./homeDriveThree.pedestrianAssets";
import type { HomeDriveThreePedestrianClothingMaterials } from "./homeDriveThree.pedestrianMaterials";

export function getHairScaleVariant(variant: number): readonly [number, number, number] {

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



// dados do corpo que braços e pernas precisam para montar a malha
export type HomeDriveThreePedestrianLimbParts = Readonly<{
  profile: HomeDriveThreePedestrianProceduralProfile;
  renderPose: HomeDriveThreePedestrianPose;
  skinMaterial: MeshStandardMaterial;
  clothingMaterials: HomeDriveThreePedestrianClothingMaterials;
  renderOrder: number;
  renderFullDetail: boolean;
}>;

// braços esquerdo e direito (só no detalhe completo)
export function renderHomeDriveThreePedestrianArms({
  profile,
  renderPose,
  skinMaterial,
  renderOrder,
}: HomeDriveThreePedestrianLimbParts) {
  return (
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
  );
}

// pernas esquerda e direita, com sapatos no detalhe completo
export function renderHomeDriveThreePedestrianLegs({
  profile,
  renderPose,
  clothingMaterials,
  renderOrder,
  renderFullDetail,
}: HomeDriveThreePedestrianLimbParts) {
  return (
    <>
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
    </>
  );
}
