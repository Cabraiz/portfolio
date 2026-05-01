// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianInstancedCrowd.tsx

import React, { memo } from "react";

import HomeDriveThreePedestrianInstancedRig from "./HomeDriveThreePedestrianInstancedRig";
import type { HomeDriveThreePedestrianInstancedCrowdProps } from "./homeDriveThree.pedestrianInstancing.types";

/**
 * Compatibilidade com o render instanciado antigo.
 *
 * O componente antigo desenhava um proxy simples por bucket. Agora ele delega
 * para o rig instanciado em partes humanas, preservando variação visual,
 * animação bakeada e baixo custo de draw call.
 */
function HomeDriveThreePedestrianInstancedCrowd({
  entries,
  enabled = true,
  renderOrder = 25,
  maxInstances,
  elapsedSeconds,
}: HomeDriveThreePedestrianInstancedCrowdProps) {
  return (
    <HomeDriveThreePedestrianInstancedRig
      entries={entries}
      enabled={enabled}
      renderOrder={renderOrder}
      maxInstances={maxInstances}
      elapsedSeconds={elapsedSeconds}
    />
  );
}

export default memo(HomeDriveThreePedestrianInstancedCrowd);


