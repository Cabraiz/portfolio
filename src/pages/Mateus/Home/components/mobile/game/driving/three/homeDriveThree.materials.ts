// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.materials.ts

import { HOME_DRIVE_THREE_WORLD_MATERIALS } from "./homeDriveThree.materials.world";
import { HOME_DRIVE_THREE_FACADE_MATERIALS } from "./homeDriveThree.materials.facade";
export { HOME_DRIVE_THREE_COLORS } from "./homeDriveThree.materials.colors";

export const HOME_DRIVE_THREE_MATERIALS = Object.freeze({
  ...HOME_DRIVE_THREE_WORLD_MATERIALS,
  ...HOME_DRIVE_THREE_FACADE_MATERIALS,
});
