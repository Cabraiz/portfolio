// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianRenderPlan.types.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import type { HomeDriveThreeVisiblePedestrianEntry } from "./homeDriveThree.pedestrianVisibility";

export type HomeDriveThreePedestrianRenderPlanOptions = Readonly<{
  maxFullReactPedestrians?: number;

  /**
   * Campo legado aceito por compatibilidade.
   * Ignorado pelo render plan atual.
   */
  maxMediumReactPedestrians?: number;

  forceFullForHandLinks?: boolean;
}>;

export type HomeDriveThreePedestrianRenderPlan = Readonly<{
  fullEntries: readonly HomeDriveThreeVisiblePedestrianEntry[];
  handLinkAgents: readonly HomeDrivePedestrianAgent[];
  totalVisible: number;
}>;
