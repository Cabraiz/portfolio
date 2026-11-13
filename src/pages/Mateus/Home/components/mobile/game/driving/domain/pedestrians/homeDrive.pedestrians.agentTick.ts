// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.agentTick.ts

import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRuntimeState,
  HomeDrivePedestrianTickOptions,
} from "./homeDrive.pedestrians.types";
import { shouldHomeDrivePedestrianMove } from "./homeDrive.pedestrianBehaviors";
import {
  shouldTickHomeDrivePedestrianAgent,
} from "./homeDrive.pedestrianSimulationScheduler";
import { clamp } from "./homeDrive.pedestrianRandom";
import {
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
  getHomeDrivePedestrianZoneById,
  resolveHomeDrivePedestrianSidewalkProgressAfterDistance,
} from "./homeDrive.pedestrianSidewalks";

function tickSidewalkAgent(

  agent: HomeDrivePedestrianAgent,

  pedestrians: HomeDrivePedestrianRuntimeState,

  deltaSeconds: number,

): HomeDrivePedestrianAgent {

  const zone = getHomeDrivePedestrianZoneById(pedestrians.zones, agent.zoneId);



  if (!zone || !shouldHomeDrivePedestrianMove(agent.behavior)) {

    return {

      ...agent,

      behaviorElapsedSeconds:

        (agent.behaviorElapsedSeconds + deltaSeconds) %

        Math.max(0.01, agent.behaviorDurationSeconds),

      animationPhase:

        (agent.animationPhase + deltaSeconds * Math.max(0.2, agent.speedMps) * 5.4) %

        (Math.PI * 2),

    };

  }



  const speedMps = clamp(

    agent.speedMps + (agent.targetSpeedMps - agent.speedMps) * 0.08,

    0,

    3.2,

  );

  const moved = resolveHomeDrivePedestrianSidewalkProgressAfterDistance(

    zone,

    agent.progress,

    agent.directionSign,

    speedMps * deltaSeconds,

  );

  const position = getHomeDrivePedestrianPointOnSidewalk(

    zone,

    moved.progress,

    agent.lateralOffsetMeters,

  );



  return {

    ...agent,

    progress: moved.progress,

    directionSign: moved.directionSign,

    position,

    headingRad: getHomeDrivePedestrianHeadingRadians(zone, moved.directionSign),

    speedMps,

    behaviorElapsedSeconds:

      (agent.behaviorElapsedSeconds + deltaSeconds) %

      Math.max(0.01, agent.behaviorDurationSeconds),

    animationPhase:

      (agent.animationPhase + deltaSeconds * Math.max(0.25, speedMps) * 5.4) %

      (Math.PI * 2),

  };

}



export function tickAgentIfScheduled(

  agent: HomeDrivePedestrianAgent,

  pedestrians: HomeDrivePedestrianRuntimeState,

  deltaSeconds: number,

  options: HomeDrivePedestrianTickOptions,

): HomeDrivePedestrianAgent {

  if (

    !shouldTickHomeDrivePedestrianAgent(agent, {

      activeCenter: options.activeCenter,

      hotRadiusMeters: options.activeRadiusMeters,

      warmRadiusMeters: options.warmRadiusMeters,

      warmModulo: options.warmTickModulo,

      coldModulo: options.coldTickModulo,

      tickIndex: options.tickIndex,

    })

  ) {

    return agent;

  }



  return tickSidewalkAgent(agent, pedestrians, deltaSeconds);

}
