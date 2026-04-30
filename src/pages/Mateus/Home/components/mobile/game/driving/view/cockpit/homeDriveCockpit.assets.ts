// src/pages/Mateus/Home/components/mobile/game/driving/view/cockpit/homeDriveCockpit.assets.ts

export const HOME_DRIVE_COCKPIT_ASSETS = Object.freeze({
  cockpitSrc: "/assets/Mateus/driving/cockpit.png",
  steeringWheelSrc: "/assets/Mateus/driving/steering-wheel.png",
} as const);

export type HomeDriveCockpitAssetKey = keyof typeof HOME_DRIVE_COCKPIT_ASSETS;

export function getHomeDriveCockpitAssetSrc(
  assetKey: HomeDriveCockpitAssetKey,
): string {
  return HOME_DRIVE_COCKPIT_ASSETS[assetKey];
}
