// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.ts


import { getHomeDriveThreePedestrianLodForDistance } from "./homeDriveThree.pedestrianLod";
import type {
	HomeDriveThreeVisiblePedestrianEntry,
	HomeDriveThreePedestrianVisibilityOptions,
} from "./homeDriveThree.pedestrianVisibility.types";
import {
	getDistanceSquared,
	getVisibilityCellKey,
	getAngularSectorKey,
	isPedestrianImpactVisible,
	isRecentlyTeleportedInsideCoreCone,
	getVisibilityRank,
} from "./homeDriveThree.pedestrianVisibility.rules";
export type {
	HomeDriveThreeVisiblePedestrianEntry,
	HomeDriveThreePedestrianVisibilityOptions,
} from "./homeDriveThree.pedestrianVisibility.types";



export function getHomeDriveThreeVisiblePedestrianEntries(

  options: HomeDriveThreePedestrianVisibilityOptions,

): readonly HomeDriveThreeVisiblePedestrianEntry[] {

  const center = options.runtime?.car.position ?? { x: 0, z: 0 };

  const visibleRadiusMeters = Math.max(1, options.visibleRadiusMeters);

  const visibleRadiusSquared = visibleRadiusMeters * visibleRadiusMeters;

  const maxVisiblePedestrians = Math.max(

    0,

    Math.floor(options.maxVisiblePedestrians),

  );

  const cellSizeMeters = Math.max(1, options.cellSizeMeters ?? 8);

  const fadeInSeconds = Math.max(0, options.relocatedFadeInSeconds ?? 0.16);

  const blockMeters = Math.max(0, options.relocatedVisibleBlockMeters ?? 80);

  const coneRadians = Math.max(

    0.05,

    Math.min(Math.PI, options.relocatedVisibleConeRadians ?? 0.72),

  );



  if (maxVisiblePedestrians <= 0) {

    return [];

  }



  return options.agents

    .map((agent): HomeDriveThreeVisiblePedestrianEntry | null => {

      const distanceSquared = getDistanceSquared(agent.position, center);



      const impactVisible = isPedestrianImpactVisible(agent);

      if (

        distanceSquared > visibleRadiusSquared &&

        (!impactVisible || distanceSquared > (visibleRadiusMeters + 220) * (visibleRadiusMeters + 220))

      ) {

        return null;

      }



      if (

        !impactVisible &&

        isRecentlyTeleportedInsideCoreCone(

          agent,

          options.runtime,

          blockMeters,

          coneRadians,

          fadeInSeconds,

        )

      ) {

        return null;

      }



      const distanceMeters = Math.sqrt(distanceSquared);

      const detailLevel = getHomeDriveThreePedestrianLodForDistance(distanceMeters, {

        fullDetailRadiusMeters: options.fullDetailRadiusMeters,

        mediumDetailRadiusMeters: options.mediumDetailRadiusMeters,

      });



      if (detailLevel === null) {

        return null;

      }



      return {

        agent,

        distanceSquared,

        detailLevel,

        visibilityCellKey: getVisibilityCellKey(agent.position, cellSizeMeters),

        angularSectorKey: getAngularSectorKey(agent.position, center),

        visibilityRank: getVisibilityRank(

          agent,

          distanceSquared,

          detailLevel,

          options.runtime,

        ),

      };

    })

    .filter((entry): entry is HomeDriveThreeVisiblePedestrianEntry => Boolean(entry))

    .sort((first, second) => {

      if (Math.abs(first.visibilityRank - second.visibilityRank) > 0.0001) {

        return first.visibilityRank - second.visibilityRank;

      }



      if (Math.abs(first.distanceSquared - second.distanceSquared) > 0.0001) {

        return first.distanceSquared - second.distanceSquared;

      }



      return first.agent.id.localeCompare(second.agent.id);

    })

    .slice(0, maxVisiblePedestrians);

}



