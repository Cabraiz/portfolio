// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/index.ts

export * from "./homeDrive.buildingCollision.types";
export * from "./homeDrive.buildingCollisionBounds";
export * from "./homeDrive.buildingCollisionImpact";
export * from "./homeDrive.buildingCollisionQuips";
export * from "./homeDrive.buildingCollisionResolver";

export * from "./homeDrive.buildingCollisionDestruction.types";
export * from "./homeDrive.buildingCollisionDestruction";
export * from "./homeDrive.buildingCollisionRubble.types";
export * from "./homeDrive.buildingCollisionRubble";
export * from "./homeDrive.buildingCollisionLean.types";
export * from "./homeDrive.buildingCollisionLean";

/*
 * Legado mantido por compatibilidade temporária.
 * O dano volumétrico real agora vem de `destructions`.
 */
export * from "./homeDrive.buildingCollisionDeformation.types";
export * from "./homeDrive.buildingCollisionDeformation";
export * from "./homeDrive.buildingCollisionDebris";
