// src/pages/Mateus/Home/components/mobile/game/driving/HomeDriveGame.tsx

import React, { memo } from "react";

import HomeDriveGameView from "./view/HomeDriveGame";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
}>;

function HomeDriveGame({ onClose }: HomeDriveGameProps) {
  return <HomeDriveGameView onClose={onClose} />;
}

export default memo(HomeDriveGame);
