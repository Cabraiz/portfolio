// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianProps.tsx

import React, { memo, useMemo } from "react";
import { Vector3 } from "three";

import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianProp,
} from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianProceduralProfile } from "./homeDriveThree.pedestrianAssets";
import { HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS } from "./homeDriveThree.pedestrianMaterials";

export type HomeDriveThreePedestrianPropsLayerProps = Readonly<{
  agent: HomeDrivePedestrianAgent;
  profile: HomeDriveThreePedestrianProceduralProfile;
}>;

export type HomeDriveThreePedestrianHandLinksProps = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
}>;

function hasProp(
  agent: HomeDrivePedestrianAgent,
  prop: HomeDrivePedestrianProp,
): boolean {
  return agent.props.includes(prop);
}

function getHandY(profile: HomeDriveThreePedestrianProceduralProfile): number {
  return profile.shoulderY - profile.armLengthMeters * 0.74;
}

function getBagScale(profile: HomeDriveThreePedestrianProceduralProfile): readonly [number, number, number] {
  const factor = profile.heightMeters / 1.72;

  return [0.18 * factor, 0.3 * factor, 0.08 * factor];
}

function HomeDriveThreePedestrianPropsLayer({
  agent,
  profile,
}: HomeDriveThreePedestrianPropsLayerProps) {
  const handY = getHandY(profile);
  const shoulderHalf = profile.torsoWidthMeters * 0.5;
  const bagScale = getBagScale(profile);

  return (
    <group>
      {hasProp(agent, "shopping-bag-left") && (
        <group position={[shoulderHalf + 0.08, handY - 0.18, 0.035]}>
          <mesh material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.shoppingBag}>
            <boxGeometry args={bagScale} />
          </mesh>
          <mesh
            material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.shoppingBagDark}
            position={[0, bagScale[1] * 0.58, 0]}
          >
            <boxGeometry args={[bagScale[0] * 0.72, 0.025, bagScale[2] * 0.5]} />
          </mesh>
        </group>
      )}

      {hasProp(agent, "shopping-bag-right") && (
        <group position={[-shoulderHalf - 0.08, handY - 0.18, 0.035]}>
          <mesh material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.shoppingBag}>
            <boxGeometry args={bagScale} />
          </mesh>
          <mesh
            material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.shoppingBagDark}
            position={[0, bagScale[1] * 0.58, 0]}
          >
            <boxGeometry args={[bagScale[0] * 0.72, 0.025, bagScale[2] * 0.5]} />
          </mesh>
        </group>
      )}

      {hasProp(agent, "phone") && (
        <mesh
          material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.phone}
          position={[-shoulderHalf * 0.52, profile.shoulderY - 0.16, profile.torsoDepthMeters * 0.62]}
          rotation={[-0.34, 0.18, -0.1]}
        >
          <boxGeometry args={[0.055, 0.095, 0.012]} />
        </mesh>
      )}

      {hasProp(agent, "cigarette") && (
        <group
          position={[-shoulderHalf * 0.56, profile.shoulderY - 0.13, profile.torsoDepthMeters * 0.72]}
          rotation={[0.15, 0.32, 0.18]}
        >
          <mesh material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.cigarette}>
            <boxGeometry args={[0.018, 0.018, 0.15]} />
          </mesh>
          <mesh
            material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.cigaretteTip}
            position={[0, 0, 0.084]}
          >
            <sphereGeometry args={[0.017, 8, 8]} />
          </mesh>
        </group>
      )}

      {hasProp(agent, "backpack") && (
        <mesh
          material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.backpack}
          position={[0, profile.hipY + profile.torsoHeightMeters * 0.38, -profile.torsoDepthMeters * 0.68]}
          rotation={[0.04, 0, 0]}
        >
          <boxGeometry
            args={[
              profile.torsoWidthMeters * 0.72,
              profile.torsoHeightMeters * 0.74,
              profile.torsoDepthMeters * 0.46,
            ]}
          />
        </mesh>
      )}

      {hasProp(agent, "cap") && (
        <group position={[0, profile.headY + profile.headRadiusMeters * 0.76, 0]}>
          <mesh material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.cap}>
            <sphereGeometry args={[profile.headRadiusMeters * 0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </mesh>
          <mesh
            material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.cap}
            position={[0, -profile.headRadiusMeters * 0.12, profile.headRadiusMeters * 0.82]}
          >
            <boxGeometry args={[profile.headRadiusMeters * 1.25, 0.028, profile.headRadiusMeters * 0.72]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function getAgentById(
  agents: readonly HomeDrivePedestrianAgent[],
  id: string | null,
): HomeDrivePedestrianAgent | undefined {
  if (!id) {
    return undefined;
  }

  return agents.find((agent) => agent.id === id);
}

function HomeDriveThreePedestrianHandLink({
  from,
  to,
}: Readonly<{
  from: HomeDrivePedestrianAgent;
  to: HomeDrivePedestrianAgent;
}>) {
  const transform = useMemo(() => {
    const start = new Vector3(from.position.x, 0.72, from.position.z);
    const end = new Vector3(to.position.x, 0.62, to.position.z);
    const center = start.clone().lerp(end, 0.5);
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const dy = end.y - start.y;
    const length = Math.max(0.001, Math.hypot(dx, dy, dz));
    const heading = Math.atan2(dx, dz);
    const pitch = -Math.atan2(dy, Math.hypot(dx, dz));

    return {
      center,
      length,
      rotation: [pitch, heading, 0] as [number, number, number],
    };
  }, [from.position.x, from.position.z, to.position.x, to.position.z]);

  return (
    <mesh
      material={HOME_DRIVE_THREE_PEDESTRIAN_PROP_MATERIALS.handLink}
      position={transform.center}
      rotation={transform.rotation}
      renderOrder={29}
    >
      <boxGeometry args={[0.035, 0.035, transform.length]} />
    </mesh>
  );
}

export function HomeDriveThreePedestrianHandLinks({
  agents,
}: HomeDriveThreePedestrianHandLinksProps) {
  const renderedPairs = new Set<string>();

  return (
    <group renderOrder={29}>
      {agents.map((agent) => {
        const target = getAgentById(agents, agent.handHoldTargetId);

        if (!target) {
          return null;
        }

        const pairKey = [agent.id, target.id].sort().join("::");

        if (renderedPairs.has(pairKey)) {
          return null;
        }

        renderedPairs.add(pairKey);

        return (
          <HomeDriveThreePedestrianHandLink
            key={pairKey}
            from={agent}
            to={target}
          />
        );
      })}
    </group>
  );
}

export default memo(HomeDriveThreePedestrianPropsLayer);
