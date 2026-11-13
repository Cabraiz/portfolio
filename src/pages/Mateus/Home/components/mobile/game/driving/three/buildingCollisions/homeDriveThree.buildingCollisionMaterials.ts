// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingCollisionMaterials.ts

import { MeshBasicMaterial } from "three";
import { localizeLabel } from '@/i18n/labels';
import {
	createCanvasTexture,
	createTransparentMaterial,
	drawCrackTexture,
	drawDustTexture,
	drawScratchTexture,
	drawImpactStainTexture,
	drawConcreteHoleTexture,
	drawPaintTransferTexture,
	drawBrokenPlasterTexture,
	drawBentSignTexture,
} from "./homeDriveThree.buildingCollisionMaterials.textures";

export type HomeDriveThreeBuildingCollisionMaterialSet = Readonly<{
  crack: MeshBasicMaterial;
  dust: MeshBasicMaterial;
  scratch: MeshBasicMaterial;
  bentSign: MeshBasicMaterial;
  impactStain: MeshBasicMaterial;
  concreteHole: MeshBasicMaterial;
  paintTransfer: MeshBasicMaterial;
  brokenPlaster: MeshBasicMaterial;
}>;

export function createHomeDriveThreeBuildingCollisionMaterials(): HomeDriveThreeBuildingCollisionMaterialSet {
  return {
    crack: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawCrackTexture,
      }),
    ),
    dust: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 256,
        draw: drawDustTexture,
      }),
    ),
    scratch: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 256,
        draw: drawScratchTexture,
      }),
    ),
    bentSign: createTransparentMaterial(
      createCanvasTexture({
        width: 768,
        height: 256,
        draw: drawBentSignTexture,
      }),
    ),
    impactStain: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawImpactStainTexture,
      }),
    ),
    concreteHole: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawConcreteHoleTexture,
      }),
    ),
    paintTransfer: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 256,
        draw: drawPaintTransferTexture,
      }),
    ),
    brokenPlaster: createTransparentMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawBrokenPlasterTexture,
      }),
    ),
  };
}

export function createHomeDriveThreeBuildingCollisionComicMaterial(
  message: string,
): MeshBasicMaterial {
  const texture = createCanvasTexture({
    width: 768,
    height: 256,
    draw: (context, width, height) => {
      context.clearRect(0, 0, width, height);

      context.fillStyle = "rgba(255, 246, 207, 0.95)";
      context.strokeStyle = "rgba(39, 25, 12, 0.94)";
      context.lineWidth = 10;

      context.beginPath();
      context.roundRect(
        width * 0.05,
        height * 0.17,
        width * 0.9,
        height * 0.64,
        34,
      );
      context.fill();
      context.stroke();

      context.fillStyle = "rgba(166, 29, 22, 0.98)";
      context.font = `900 ${Math.round(
        height * 0.22,
      )}px "Arial Black", system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const normalizedMessage = localizeLabel(message).toUpperCase();
      const fittedMessage =
        normalizedMessage.length > 20
          ? `${normalizedMessage.slice(0, 18)}…`
          : normalizedMessage;

      context.fillText(fittedMessage, width * 0.5, height * 0.5);
    },
  });

  return createTransparentMaterial(texture);
}

export function disposeHomeDriveThreeBuildingCollisionMaterials(
  materials: HomeDriveThreeBuildingCollisionMaterialSet,
): void {
  Object.values(materials).forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
}
