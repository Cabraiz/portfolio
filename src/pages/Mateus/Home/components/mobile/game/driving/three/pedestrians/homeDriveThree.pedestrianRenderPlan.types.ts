// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderPlan.types.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import type { HomeDriveThreeVisiblePedestrianEntry } from "./homeDriveThree.pedestrianVisibility";
import type { HomeDriveThreePedestrianInstancedRigEntry } from "./homeDriveThree.pedestrianInstanceBatches.types";

export type HomeDriveThreePedestrianRenderPlanOptions = Readonly<{
  maxFullReactPedestrians?: number;
  maxMediumReactPedestrians?: number;
  forceFullForHandLinks?: boolean;
}>;

export type HomeDriveThreePedestrianRenderPlan = Readonly<{
  fullEntries: readonly HomeDriveThreeVisiblePedestrianEntry[];
  mediumReactEntries: readonly HomeDriveThreeVisiblePedestrianEntry[];
  instancedEntries: readonly HomeDriveThreePedestrianInstancedRigEntry[];
  handLinkAgents: readonly HomeDrivePedestrianAgent[];
  totalVisible: number;
}>;
