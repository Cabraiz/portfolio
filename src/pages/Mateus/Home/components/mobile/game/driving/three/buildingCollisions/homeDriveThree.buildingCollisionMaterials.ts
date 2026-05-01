// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingCollisionMaterials.ts

import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  SRGBColorSpace,
} from "three";

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

function createCanvasTexture(params: Readonly<{
  width: number;
  height: number;
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void;
}>): CanvasTexture | null {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = params.width;
  canvas.height = params.height;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  params.draw(context, params.width, params.height);

  const texture = new CanvasTexture(canvas);

  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createTransparentMaterial(
  texture: CanvasTexture | null,
): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map: texture ?? undefined,
    color: texture ? 0xffffff : 0x111111,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    toneMapped: false,
  });
}

function drawCrackTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = "rgba(12, 10, 8, 0.9)";
  context.lineWidth = 7;

  context.beginPath();
  context.moveTo(width * 0.48, height * 0.18);
  context.lineTo(width * 0.52, height * 0.34);
  context.lineTo(width * 0.45, height * 0.51);
  context.lineTo(width * 0.55, height * 0.73);
  context.lineTo(width * 0.49, height * 0.9);
  context.stroke();

  context.lineWidth = 4;

  const branches = [
    [0.51, 0.36, 0.28, 0.26],
    [0.47, 0.5, 0.23, 0.58],
    [0.53, 0.42, 0.76, 0.3],
    [0.53, 0.7, 0.78, 0.82],
    [0.46, 0.62, 0.3, 0.78],
  ] as const;

  branches.forEach(([x1, y1, x2, y2]) => {
    context.beginPath();
    context.moveTo(width * x1, height * y1);
    context.lineTo(width * x2, height * y2);
    context.stroke();
  });

  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width * 0.5 + 8, height * 0.2);
  context.lineTo(width * 0.54 + 8, height * 0.7);
  context.stroke();
}

function drawDustTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.58,
    0,
    width * 0.5,
    height * 0.58,
    width * 0.48,
  );

  gradient.addColorStop(0, "rgba(181, 164, 127, 0.48)");
  gradient.addColorStop(0.42, "rgba(139, 124, 94, 0.28)");
  gradient.addColorStop(1, "rgba(139, 124, 94, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(82, 68, 49, 0.3)";

  for (let index = 0; index < 42; index += 1) {
    const x = (Math.sin(index * 17.31) * 0.5 + 0.5) * width;
    const y = (Math.cos(index * 9.73) * 0.5 + 0.5) * height;
    const radius = 2 + ((index * 7) % 10);

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawScratchTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  for (let index = 0; index < 6; index += 1) {
    const y = height * (0.28 + index * 0.085);
    const xStart = width * (0.14 + (index % 2) * 0.08);
    const xEnd = width * (0.86 - (index % 3) * 0.05);

    context.strokeStyle =
      index % 2 === 0
        ? "rgba(18, 15, 12, 0.74)"
        : "rgba(240, 230, 205, 0.26)";
    context.lineWidth = index % 2 === 0 ? 4 : 2;

    context.beginPath();
    context.moveTo(xStart, y);
    context.lineTo(xEnd, y + Math.sin(index) * height * 0.05);
    context.stroke();
  }
}

function drawImpactStainTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const gradient = context.createRadialGradient(
    width * 0.48,
    height * 0.54,
    width * 0.04,
    width * 0.48,
    height * 0.54,
    width * 0.48,
  );

  gradient.addColorStop(0, "rgba(5, 5, 5, 0.72)");
  gradient.addColorStop(0.32, "rgba(16, 14, 12, 0.54)");
  gradient.addColorStop(0.68, "rgba(48, 39, 30, 0.26)");
  gradient.addColorStop(1, "rgba(48, 39, 30, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(7, 7, 6, 0.38)";

  for (let index = 0; index < 18; index += 1) {
    const x = width * (0.24 + (Math.sin(index * 12.7) * 0.5 + 0.5) * 0.52);
    const y = height * (0.22 + (Math.cos(index * 8.9) * 0.5 + 0.5) * 0.58);
    const rx = 10 + ((index * 11) % 28);
    const ry = 5 + ((index * 5) % 14);

    context.beginPath();
    context.ellipse(x, y, rx, ry, index * 0.27, 0, Math.PI * 2);
    context.fill();
  }
}

function drawConcreteHoleTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const centerX = width * 0.5;
  const centerY = height * 0.52;

  const outer = context.createRadialGradient(
    centerX,
    centerY,
    width * 0.04,
    centerX,
    centerY,
    width * 0.42,
  );

  outer.addColorStop(0, "rgba(0, 0, 0, 0.94)");
  outer.addColorStop(0.38, "rgba(18, 15, 12, 0.82)");
  outer.addColorStop(0.58, "rgba(122, 108, 88, 0.48)");
  outer.addColorStop(0.78, "rgba(199, 189, 166, 0.26)");
  outer.addColorStop(1, "rgba(199, 189, 166, 0)");

  context.fillStyle = outer;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(25, 22, 18, 0.88)";
  context.lineWidth = 5;
  context.lineCap = "round";

  for (let index = 0; index < 9; index += 1) {
    const angle = (Math.PI * 2 * index) / 9 + 0.14;
    const start = width * (0.14 + (index % 2) * 0.035);
    const end = width * (0.28 + ((index + 1) % 3) * 0.055);

    context.beginPath();
    context.moveTo(
      centerX + Math.cos(angle) * start,
      centerY + Math.sin(angle) * start * 0.74,
    );
    context.lineTo(
      centerX + Math.cos(angle) * end,
      centerY + Math.sin(angle) * end * 0.74,
    );
    context.stroke();
  }

  context.strokeStyle = "rgba(255, 245, 212, 0.2)";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(
    centerX - width * 0.035,
    centerY - height * 0.035,
    width * 0.18,
    height * 0.14,
    -0.2,
    0,
    Math.PI * 2,
  );
  context.stroke();
}

function drawPaintTransferTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  const colors = [
    "rgba(238, 226, 198, 0.72)",
    "rgba(138, 37, 31, 0.68)",
    "rgba(22, 22, 20, 0.52)",
  ];

  for (let index = 0; index < 7; index += 1) {
    context.strokeStyle = colors[index % colors.length];
    context.lineWidth = index % 2 === 0 ? 5 : 3;

    const y = height * (0.28 + index * 0.07);
    const xStart = width * (0.08 + (index % 3) * 0.025);
    const xEnd = width * (0.82 - (index % 2) * 0.09);

    context.beginPath();
    context.moveTo(xStart, y);
    context.bezierCurveTo(
      width * 0.32,
      y - height * 0.08,
      width * 0.58,
      y + height * 0.06,
      xEnd,
      y + Math.sin(index) * height * 0.06,
    );
    context.stroke();
  }
}

function drawBrokenPlasterTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  context.fillStyle = "rgba(207, 196, 171, 0.38)";
  context.beginPath();
  context.moveTo(width * 0.22, height * 0.2);
  context.lineTo(width * 0.68, height * 0.15);
  context.lineTo(width * 0.86, height * 0.42);
  context.lineTo(width * 0.72, height * 0.8);
  context.lineTo(width * 0.33, height * 0.88);
  context.lineTo(width * 0.12, height * 0.52);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(91, 79, 60, 0.62)";
  context.lineWidth = 5;
  context.lineJoin = "round";
  context.stroke();

  context.fillStyle = "rgba(255, 248, 218, 0.18)";
  for (let index = 0; index < 12; index += 1) {
    const x = width * (0.18 + (Math.sin(index * 4.8) * 0.5 + 0.5) * 0.64);
    const y = height * (0.2 + (Math.cos(index * 5.9) * 0.5 + 0.5) * 0.58);

    context.beginPath();
    context.arc(x, y, 4 + (index % 4) * 2, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBentSignTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  context.save();
  context.translate(width * 0.5, height * 0.5);
  context.rotate(-0.06);

  context.fillStyle = "rgba(255, 236, 166, 0.9)";
  context.strokeStyle = "rgba(55, 40, 18, 0.86)";
  context.lineWidth = 8;

  const signWidth = width * 0.76;
  const signHeight = height * 0.42;
  const x = -signWidth / 2;
  const y = -signHeight / 2;

  context.beginPath();
  context.roundRect(x, y, signWidth, signHeight, 18);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(66, 44, 21, 0.92)";
  context.font = `900 ${Math.round(height * 0.22)}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("NÃO ERA", 0, -height * 0.035);
  context.fillText("DRIVE-THRU", 0, height * 0.15);

  context.restore();
}

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

      const normalizedMessage = message.toUpperCase();
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
