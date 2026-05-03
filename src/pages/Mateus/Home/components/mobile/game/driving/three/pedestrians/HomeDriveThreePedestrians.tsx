// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrians.tsx



import { useFrame } from "@react-three/fiber";

import React, { memo, useMemo, useRef, useState } from "react";



import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";

import {

  dedupeHomeDrivePedestrianAgentsById,

  type HomeDrivePedestrianRuntimeState,

} from "../../domain/pedestrians";

import HomeDriveThreePedestrianAgent from "./HomeDriveThreePedestrianAgent";

import HomeDriveThreePedestrianDebug from "./HomeDriveThreePedestrianDebug";

import { HomeDriveThreePedestrianHandLinks } from "./HomeDriveThreePedestrianProps";

import { getHomeDriveThreePedestrianRenderPlan } from "./homeDriveThree.pedestrianRenderPlan";

import { getHomeDriveThreeVisiblePedestrianEntries } from "./homeDriveThree.pedestrianVisibility";



export type HomeDriveMutableRef<T> = {

  current: T;

};



export type HomeDriveThreePedestriansProps = Readonly<{

  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;

  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;

  enabled?: boolean;

  debug?: boolean;

  visibleRadiusMeters?: number;

  maxVisiblePedestrians?: number;

  fullDetailRadiusMeters?: number;



  /**

   * Mantido para compatibilidade com HomeDriveThreeScene.

   * O componente não renderiza mais medium/instanced.

   */

  mediumDetailRadiusMeters?: number;



  snapshotHz?: number;



  /**

   * Props legadas mantidas para não quebrar o caller atual.

   * São ignoradas de propósito: não existe mais rig instanciado,

   * silhouette, cinza/preto distante ou placeholder visual.

   */

  enableInstancedRig?: boolean;

  enableBakedAnimation?: boolean;

  maxFullReactPedestrians?: number;

  maxMediumReactPedestrians?: number;

  maxInstancedPedestrians?: number;

  instancedAnimationHz?: number;

  instancedAnimationUpdateStride?: number;

  instancedMaxUpdatesPerFrame?: number;



  enableRenderSeparation?: boolean;

  renderSeparationCellSizeMeters?: number;

  renderSeparationMinMeters?: number;

  renderSeparationMaxOffsetMeters?: number;

}>;



const DEFAULT_VISIBLE_RADIUS_METERS = 460;

const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 96;

const DEFAULT_FULL_DETAIL_RADIUS_METERS = 460;

const DEFAULT_SNAPSHOT_HZ = 10;

const DEFAULT_MAX_FULL_REACT_PEDESTRIANS = 96;



function snapshotPedestrians(

  pedestrians: HomeDrivePedestrianRuntimeState,

): HomeDrivePedestrianRuntimeState {

  return {

    ...pedestrians,

    agents: dedupeHomeDrivePedestrianAgentsById(pedestrians.agents),

  };

}

function hasVisiblePedestrianImpact(

  pedestrians: HomeDrivePedestrianRuntimeState,

): boolean {

  return pedestrians.agents.some((agent) => {

    const impact = agent.pedestrianImpact;

    if (!impact) {

      return false;

    }

    if (typeof impact.landedAtSeconds === "number") {

      return true;

    }

    return Boolean(impact.active) || (impact.yMeters ?? 0) > 0.01;

  });

}




function HomeDriveThreePedestrians({

  pedestriansRef,

  runtimeRef,

  enabled = true,

  debug = false,

  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,

  maxVisiblePedestrians = DEFAULT_MAX_VISIBLE_PEDESTRIANS,

  fullDetailRadiusMeters = DEFAULT_FULL_DETAIL_RADIUS_METERS,

  snapshotHz = DEFAULT_SNAPSHOT_HZ,

  maxFullReactPedestrians = DEFAULT_MAX_FULL_REACT_PEDESTRIANS,

}: HomeDriveThreePedestriansProps) {

  const [snapshot, setSnapshot] = useState<HomeDrivePedestrianRuntimeState>(() =>

    snapshotPedestrians(pedestriansRef.current),

  );

  const accumulatorRef = useRef(0);



  useFrame((_, deltaSeconds) => {

    if (!enabled) {

      return;

    }



    const hasImpactInFlightOrLanded = hasVisiblePedestrianImpact(

      pedestriansRef.current,

    );

    if (hasImpactInFlightOrLanded) {

      accumulatorRef.current = 0;

      setSnapshot(snapshotPedestrians(pedestriansRef.current));

      return;

    }



    accumulatorRef.current += deltaSeconds;



    const targetSnapshotIntervalSeconds = 1 / Math.max(1, snapshotHz);



    if (accumulatorRef.current < targetSnapshotIntervalSeconds) {

      return;

    }



    accumulatorRef.current = 0;

    setSnapshot(snapshotPedestrians(pedestriansRef.current));

  });



  const visibleEntries = useMemo(() => {

    if (!enabled) {

      return [];

    }



    return getHomeDriveThreeVisiblePedestrianEntries({

      agents: snapshot.agents,

      runtime: runtimeRef?.current,

      pedestrianState: snapshot,

      visibleRadiusMeters,

      maxVisiblePedestrians,

      fullDetailRadiusMeters,

      mediumDetailRadiusMeters: fullDetailRadiusMeters,

      relocatedFadeInSeconds: 0.12,

      relocatedVisibleBlockMeters: 72,

      relocatedVisibleConeRadians: 0.72,

    });

  }, [

    enabled,

    fullDetailRadiusMeters,

    maxVisiblePedestrians,

    runtimeRef,

    snapshot,

    visibleRadiusMeters,

  ]);



  const renderPlan = useMemo(() => {

    return getHomeDriveThreePedestrianRenderPlan(visibleEntries, {

      maxFullReactPedestrians,

      forceFullForHandLinks: true,

    });

  }, [maxFullReactPedestrians, visibleEntries]);



  if (!enabled) {

    return null;

  }



  return (

    <group renderOrder={24}>

      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />



      {renderPlan.fullEntries.map((entry) => (

        <HomeDriveThreePedestrianAgent

          key={entry.agent.id}

          agent={entry.agent}

          detailLevel="full"

        />

      ))}



      <HomeDriveThreePedestrianHandLinks agents={renderPlan.handLinkAgents} />

    </group>

  );

}



export default memo(HomeDriveThreePedestrians);



