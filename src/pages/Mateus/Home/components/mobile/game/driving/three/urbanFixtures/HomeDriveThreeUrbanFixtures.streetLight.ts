// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.streetLight.ts

import type {
	HomeDriveUrbanFixtureCollisionImpact,
	HomeDriveUrbanStreetLight,
} from "../../domain/urbanFixtures";
import {
	type HomeDriveThreeUrbanFixturePart,
	BASE_Y,
	getVectorYawRad,
	multiplyVector2,
	addVector2,
	pushUrbanFixtureParts,
	getArmDirection,
	createPart,
} from "./HomeDriveThreeUrbanFixtures.parts";

export function pushStreetLightParts(
  parts: HomeDriveThreeUrbanFixturePart[],
  light: HomeDriveUrbanStreetLight,
  impact: HomeDriveUrbanFixtureCollisionImpact | null | undefined,
  nowSeconds: number,
): void {
  const armDirection = getArmDirection(light);
  const armYawRad = getVectorYawRad(armDirection);
  const roadYawRad = getVectorYawRad(light.roadDirection);
  const poleHeight = light.heightMeters;
  const poleRadius = light.poleRadiusMeters;
  const basePosition = light.position;
  const poleTopY = BASE_Y + poleHeight;
  const armLength = light.armLengthMeters;
  const armCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength * 0.5));
  const lampCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength + 0.34));
  const hasBanner = light.style === "banner" || (light.style === "coastal" && light.seed > 0.58);

  pushUrbanFixtureParts(
    parts,
    basePosition,
    impact,
    nowSeconds,
    createPart({
      id: `${light.id}:base-slab`,
      geometryKind: "cylinder",
      materialKey: "concreteBase",
      position: [basePosition.x, BASE_Y + 0.1, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.42, 0.2, 0.42],
      renderOrder: 20,
    }),
    createPart({
      id: `${light.id}:base-collar`,
      geometryKind: "cylinder",
      materialKey: "darkMetal",
      position: [basePosition.x, BASE_Y + 0.28, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.24, 0.14, 0.24],
      renderOrder: 21,
    }),
    createPart({
      id: `${light.id}:pole`,
      geometryKind: "cylinder",
      materialKey: "brushedPole",
      position: [basePosition.x, BASE_Y + poleHeight * 0.5, basePosition.z],
      rotation: [0, 0, 0],
      scale: [poleRadius, poleHeight, poleRadius],
      renderOrder: 22,
    }),
    createPart({
      id: `${light.id}:maintenance-hatch`,
      geometryKind: "box",
      materialKey: "maintenancePlate",
      position: [
        basePosition.x + light.roadDirection.x * (poleRadius + 0.012),
        BASE_Y + 1.22,
        basePosition.z + light.roadDirection.z * (poleRadius + 0.012),
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.055, 0.46, 0.018],
      renderOrder: 25,
    }),
    createPart({
      id: `${light.id}:arm`,
      geometryKind: "box",
      materialKey: "brushedPole",
      position: [armCenter.x, poleTopY + 0.12, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength, 0.09, 0.09],
      renderOrder: 23,
    }),
    createPart({
      id: `${light.id}:arm-cable`,
      geometryKind: "box",
      materialKey: "cable",
      position: [armCenter.x, poleTopY + 0.23, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength * 0.92, 0.025, 0.025],
      renderOrder: 24,
    }),
    createPart({
      id: `${light.id}:support-strut`,
      geometryKind: "box",
      materialKey: "darkMetal",
      position: [
        basePosition.x + armDirection.x * 0.58,
        poleTopY - 0.22,
        basePosition.z + armDirection.z * 0.58,
      ],
      rotation: [0, armYawRad, -0.48],
      scale: [1.28, 0.055, 0.055],
      renderOrder: 24,
    }),
    createPart({
      id: `${light.id}:lamp-housing`,
      geometryKind: "box",
      materialKey: "lampHousing",
      position: [lampCenter.x, poleTopY + 0.03, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [light.lampWidthMeters, 0.22, 0.38],
      renderOrder: 26,
    }),
    createPart({
      id: `${light.id}:lamp-glass`,
      geometryKind: "sphere",
      materialKey: "lampGlass",
      position: [lampCenter.x, poleTopY - 0.12, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [0.22, 0.065, 0.18],
      renderOrder: 27,
    }),
    createPart({
      id: `${light.id}:lamp-glow`,
      geometryKind: "sphere",
      materialKey: "lampGlow",
      position: [lampCenter.x, poleTopY - 0.18, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [0.58, 0.08, 0.44],
      renderOrder: 28,
    }),
  );

  for (const boltIndex of [0, 1, 2, 3] as const) {
    const angleRad = boltIndex * (Math.PI / 2) + light.seed * Math.PI;

    pushUrbanFixtureParts(
      parts,
      basePosition,
      impact,
      nowSeconds,
      createPart({
        id: `${light.id}:bolt-${boltIndex}`,
        geometryKind: "sphere",
        materialKey: "darkMetal",
        position: [
          basePosition.x + Math.cos(angleRad) * 0.28,
          BASE_Y + 0.225,
          basePosition.z + Math.sin(angleRad) * 0.28,
        ],
        rotation: [0, 0, 0],
        scale: [0.045, 0.025, 0.045],
        renderOrder: 26,
      }),
    );
  }

  if (hasBanner) {
    pushUrbanFixtureParts(
      parts,
      basePosition,
      impact,
      nowSeconds,
      createPart({
        id: `${light.id}:banner`,
        geometryKind: "box",
        materialKey: light.style === "coastal" ? "streetNamePlate" : "bannerBlue",
        position: [
          basePosition.x + armDirection.x * 1.05,
          poleTopY - 0.82,
          basePosition.z + armDirection.z * 1.05,
        ],
        rotation: [0, armYawRad, 0],
        scale: [0.95, 0.42, 0.035],
        renderOrder: 29,
      }),
    );
  }
}
