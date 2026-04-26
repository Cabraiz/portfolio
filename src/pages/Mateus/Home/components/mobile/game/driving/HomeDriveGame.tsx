// src/pages/Mateus/Home/components/mobile/game/driving/HomeDriveGame.tsx

import React from "react";

import HomeDriveGameView from "./view/HomeDriveGame";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
}>;

export default function HomeDriveGame({ onClose }: HomeDriveGameProps) {
  return <HomeDriveGameView onClose={onClose} />;
}
