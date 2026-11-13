// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.trafficLight.ts

import type {
	HomeDriveUrbanFixtureCollisionImpact,
	HomeDriveUrbanTrafficLight,
} from "../../domain/urbanFixtures";
import type {
	HomeDriveThreeUrbanFixtureMaterialKey,
} from "./homeDriveThree.urbanFixtureMaterials";
import {
	type HomeDriveThreeUrbanFixturePart,
	BASE_Y,
	DETAIL_EPSILON_Y,
	getVectorYawRad,
	multiplyVector2,
	addVector2,
	pushUrbanFixtureParts,
	getArmDirection,
	createPart,
} from "./HomeDriveThreeUrbanFixtures.parts";

function getActiveTrafficLampMaterial(
  trafficLight: HomeDriveUrbanTrafficLight,
  lamp: "red" | "amber" | "green",
): HomeDriveThreeUrbanFixtureMaterialKey {
  const phase = trafficLight.signalPhase;

  if (phase === "walk" && lamp === "red") {
    return "signalRedActive";
  }

  if (phase === "danger" && lamp === "amber") {
    return "signalAmberActive";
  }

  if (phase === "wait" && lamp === "green") {
    return "signalGreenActive";
  }

  if (lamp === "red") {
    return "signalRedDim";
  }

  if (lamp === "amber") {
    return "signalAmberDim";
  }

  return "signalGreenDim";
}

export function pushTrafficLightParts(
  parts: HomeDriveThreeUrbanFixturePart[],
  trafficLight: HomeDriveUrbanTrafficLight,
  impact: HomeDriveUrbanFixtureCollisionImpact | null | undefined,
  nowSeconds: number,
): void {
  const armDirection = getArmDirection(trafficLight);
  const armYawRad = getVectorYawRad(armDirection);
  const roadYawRad = getVectorYawRad(trafficLight.roadDirection);
  const basePosition = trafficLight.position;
  const poleHeight = trafficLight.heightMeters;
  const poleRadius = trafficLight.poleRadiusMeters;
  const poleTopY = BASE_Y + poleHeight;
  const armLength = trafficLight.armLengthMeters;
  const armCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength * 0.5));
  const housingCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength + 0.24));
  const panelFrontOffset = multiplyVector2(trafficLight.roadDirection, trafficLight.side > 0 ? -0.17 : 0.17);
  const pedestrianIsWalk = trafficLight.signalPhase === "walk";

  pushUrbanFixtureParts(
    parts,
    basePosition,
    impact,
    nowSeconds,
    createPart({
      id: `${trafficLight.id}:base-slab`,
      geometryKind: "cylinder",
      materialKey: "concreteBase",
      position: [basePosition.x, BASE_Y + 0.12, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.48, 0.24, 0.48],
      renderOrder: 20,
    }),
    createPart({
      id: `${trafficLight.id}:pole`,
      geometryKind: "cylinder",
      materialKey: "brushedPole",
      position: [basePosition.x, BASE_Y + poleHeight * 0.5, basePosition.z],
      rotation: [0, 0, 0],
      scale: [poleRadius, poleHeight, poleRadius],
      renderOrder: 22,
    }),
    createPart({
      id: `${trafficLight.id}:arm`,
      geometryKind: "box",
      materialKey: "brushedPole",
      position: [armCenter.x, poleTopY, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength, 0.12, 0.12],
      renderOrder: 23,
    }),
    createPart({
      id: `${trafficLight.id}:arm-cable`,
      geometryKind: "box",
      materialKey: "cable",
      position: [armCenter.x, poleTopY + 0.18, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength * 0.96, 0.035, 0.035],
      renderOrder: 24,
    }),
    createPart({
      id: `${trafficLight.id}:street-name-plate`,
      geometryKind: "box",
      materialKey: "streetNamePlate",
      position: [
        basePosition.x + armDirection.x * 1.42,
        poleTopY - 0.34,
        basePosition.z + armDirection.z * 1.42,
      ],
      rotation: [0, armYawRad, 0],
      scale: [1.08, 0.28, 0.035],
      renderOrder: 28,
    }),
    createPart({
      id: `${trafficLight.id}:housing-backplate`,
      geometryKind: "box",
      materialKey: "signalBackPlate",
      position: [housingCenter.x, poleTopY - 0.16, housingCenter.z],
      rotation: [0, roadYawRad, 0],
      scale: [0.72, trafficLight.housingHeightMeters + 0.18, 0.12],
      renderOrder: 29,
    }),
    createPart({
      id: `${trafficLight.id}:housing`,
      geometryKind: "box",
      materialKey: "signalHousing",
      position: [housingCenter.x, poleTopY - 0.16, housingCenter.z],
      rotation: [0, roadYawRad, 0],
      scale: [0.54, trafficLight.housingHeightMeters, 0.28],
      renderOrder: 30,
    }),
    createPart({
      id: `${trafficLight.id}:pedestrian-panel`,
      geometryKind: "box",
      materialKey: "pedestrianPanel",
      position: [
        basePosition.x + panelFrontOffset.x,
        BASE_Y + 2.78,
        basePosition.z + panelFrontOffset.z,
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.48, 0.64, 0.12],
      renderOrder: 30,
    }),
    createPart({
      id: `${trafficLight.id}:pedestrian-lamp`,
      geometryKind: "sphere",
      materialKey: pedestrianIsWalk ? "pedestrianWalk" : "pedestrianWait",
      position: [
        basePosition.x + panelFrontOffset.x * 1.55,
        BASE_Y + 2.78,
        basePosition.z + panelFrontOffset.z * 1.55,
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.16, 0.16, 0.05],
      renderOrder: 31,
    }),
  );

  const lampConfigs = [
    { key: "red", yOffset: 0.26 },
    { key: "amber", yOffset: -0.08 },
    { key: "green", yOffset: -0.42 },
  ] as const;

  for (const lamp of lampConfigs) {
    pushUrbanFixtureParts(
      parts,
      basePosition,
      impact,
      nowSeconds,
      createPart({
        id: `${trafficLight.id}:lamp-${lamp.key}`,
        geometryKind: "sphere",
        materialKey: getActiveTrafficLampMaterial(trafficLight, lamp.key),
        position: [
          housingCenter.x + panelFrontOffset.x * 0.6,
          poleTopY + lamp.yOffset,
          housingCenter.z + panelFrontOffset.z * 0.6,
        ],
        rotation: [0, roadYawRad, 0],
        scale: [0.155, 0.155, 0.07],
        renderOrder: 32,
      }),
      createPart({
        id: `${trafficLight.id}:visor-${lamp.key}`,
        geometryKind: "box",
        materialKey: "darkMetal",
        position: [
          housingCenter.x + panelFrontOffset.x * 0.9,
          poleTopY + lamp.yOffset + 0.095,
          housingCenter.z + panelFrontOffset.z * 0.9,
        ],
        rotation: [0, roadYawRad, 0],
        scale: [0.42, 0.055, 0.24],
        renderOrder: 33,
      }),
    );
  }

  for (const boltIndex of [0, 1, 2, 3] as const) {
    const angleRad = boltIndex * (Math.PI / 2) + trafficLight.seed * Math.PI;

    pushUrbanFixtureParts(
      parts,
      basePosition,
      impact,
      nowSeconds,
      createPart({
        id: `${trafficLight.id}:bolt-${boltIndex}`,
        geometryKind: "sphere",
        materialKey: "darkMetal",
        position: [
          basePosition.x + Math.cos(angleRad) * 0.32,
          BASE_Y + 0.255 + DETAIL_EPSILON_Y,
          basePosition.z + Math.sin(angleRad) * 0.32,
        ],
        rotation: [0, 0, 0],
        scale: [0.052, 0.028, 0.052],
        renderOrder: 34,
      }),
    );
  }
}
