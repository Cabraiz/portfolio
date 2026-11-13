// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.types.basics.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveGeneratedRoadSegment,
} from "../homeDrive.worldMap.types";

export type HomeDrivePedestrianRole =

  | "adult"

  | "child"

  | "elder"

  | "parent"

  | "shopper"

  | "smoker"

  | "worker"

  | "runner";



export type HomeDrivePedestrianBehavior =

  | "idle"

  | "walk"

  | "smoke"

  | "phone"

  | "talk"

  | "shop-walk"

  | "hold-child-hand"

  | "wait-crossing"

  | "cross-wait"

  | "cross-walk"

  | "cross-run"

  | "cross-panic";



export type HomeDrivePedestrianAnimationKey =

  | "idle"

  | "walk"

  | "slow-walk"

  | "fast-walk"

  | "smoke"

  | "phone"

  | "talk"

  | "carry-bags"

  | "child-walk";



export type HomeDrivePedestrianProp =

  | "cigarette"

  | "shopping-bag-left"

  | "shopping-bag-right"

  | "phone"

  | "backpack"

  | "cap"

  | "child-hand-link";



export type HomeDrivePedestrianSidewalkSide = "left" | "right";



export type HomeDrivePedestrianGroupKind =

  | "solo"

  | "shopper"

  | "smoker"

  | "couple"

  | "adult-child"

  | "chat-pair"

  | "worker";



export type HomeDrivePedestrianSkinToneKey =

  | "tone-1"

  | "tone-2"

  | "tone-3"

  | "tone-4"

  | "tone-5"

  | "tone-6";



export type HomeDrivePedestrianClothingPaletteKey =

  | "coastal-light"

  | "urban-dark"

  | "office-neutral"

  | "market-colorful"

  | "sport"

  | "casual-blue"

  | "casual-earth";



export type HomeDrivePedestrianWalkStyleKey =

  | "neutral"

  | "relaxed"

  | "hurried"

  | "heavy"

  | "childlike";



export type HomeDrivePedestrianVector2 = Readonly<{

  x: number;

  z: number;

}>;



export type HomeDrivePedestrianAppearance = Readonly<{

  skinToneKey: HomeDrivePedestrianSkinToneKey;

  clothingPaletteKey: HomeDrivePedestrianClothingPaletteKey;

  walkStyleKey: HomeDrivePedestrianWalkStyleKey;

  heightMeters: number;

  shoulderWidthMeters: number;

  bodyScale: number;

  headScale: number;

  hairVariant: number;

  outfitVariant: number;

}>;



export type HomeDrivePedestrianSidewalkZone = Readonly<{

  id: string;

  roadId: string;

  segmentId: string;

  segmentIndex: number;

  districtId: string;

  roadKind: string;

  roadTone: string;

  side: HomeDrivePedestrianSidewalkSide;

  from: HomeDriveVector2;

  to: HomeDriveVector2;

  center: HomeDriveVector2;

  direction: HomeDrivePedestrianVector2;

  normal: HomeDrivePedestrianVector2;

  lengthMeters: number;

  widthMeters: number;

  offsetFromRoadCenterMeters: number;

  density: number;

  tags: readonly string[];

  road: HomeDriveGeneratedRoadSegment;

}>;



export type HomeDrivePedestrianViewportBand =

  | "visible"

  | "far-visible"

  | "entering-soon"

  | "offscreen";



export type HomeDrivePedestrianViewportOccupancyBand =

  | "visible-near"

  | "visible-mid"

  | "visible-far"

  | "side-left"

  | "side-right";
