// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingDamageMaterials.ts

import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Material,
} from "three";

export type HomeDriveThreeBuildingDamageMaterialSet = Readonly<{
  craterShadow: MeshBasicMaterial;
  innerHole: MeshBasicMaterial;
  brokenPlaster: MeshBasicMaterial;
  impactStain: MeshBasicMaterial;
  radialCracks: MeshBasicMaterial;
  paintTransfer: MeshBasicMaterial;
  concreteChunk: MeshStandardMaterial;
  plasterChunk: MeshStandardMaterial;
  darkConcreteChunk: MeshStandardMaterial;
  rebar: MeshStandardMaterial;
  debrisConcrete: MeshStandardMaterial;
  debrisPlaster: MeshStandardMaterial;
  debrisDarkConcrete: MeshStandardMaterial;
  debrisDust: MeshBasicMaterial;
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

function createDecalMaterial(texture: CanvasTexture | null): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map: texture ?? undefined,
    color: texture ? 0xffffff : 0x19130f,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    toneMapped: false,
  });
}

function createSolidMaterial(params: Readonly<{
  color: number;
  roughness?: number;
  metalness?: number;
}>): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness ?? 0.92,
    metalness: params.metalness ?? 0.02,
    transparent: true,
    opacity: 1,
  });
}

function drawCraterShadow(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.52,
    width * 0.03,
    width * 0.5,
    height * 0.52,
    width * 0.48,
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0.96)");
  gradient.addColorStop(0.34, "rgba(7, 6, 5, 0.86)");
  gradient.addColorStop(0.62, "rgba(26, 21, 16, 0.42)");
  gradient.addColorStop(1, "rgba(26, 21, 16, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawInnerHole(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  context.fillStyle = "rgba(0, 0, 0, 0.92)";
  context.beginPath();
  context.ellipse(
    width * 0.5,
    height * 0.52,
    width * 0.28,
    height * 0.23,
    -0.18,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.strokeStyle = "rgba(216, 202, 170, 0.24)";
  context.lineWidth = 9;
  context.beginPath();
  context.ellipse(
    width * 0.49,
    height * 0.51,
    width * 0.32,
    height * 0.27,
    -0.18,
    0,
    Math.PI * 2,
  );
  context.stroke();

  context.strokeStyle = "rgba(48, 39, 28, 0.66)";
  context.lineWidth = 5;
  context.beginPath();
  context.ellipse(
    width * 0.5,
    height * 0.52,
    width * 0.37,
    height * 0.31,
    -0.18,
    0,
    Math.PI * 2,
  );
  context.stroke();
}

function drawBrokenPlaster(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  context.fillStyle = "rgba(204, 193, 168, 0.42)";
  context.beginPath();
  context.moveTo(width * 0.2, height * 0.22);
  context.lineTo(width * 0.64, height * 0.12);
  context.lineTo(width * 0.88, height * 0.38);
  context.lineTo(width * 0.74, height * 0.84);
  context.lineTo(width * 0.31, height * 0.9);
  context.lineTo(width * 0.12, height * 0.58);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(62, 52, 39, 0.68)";
  context.lineWidth = 7;
  context.stroke();

  context.fillStyle = "rgba(255, 249, 222, 0.16)";

  for (let index = 0; index < 16; index += 1) {
    const x = width * (0.16 + (Math.sin(index * 6.1) * 0.5 + 0.5) * 0.68);
    const y = height * (0.18 + (Math.cos(index * 7.3) * 0.5 + 0.5) * 0.64);

    context.beginPath();
    context.arc(x, y, 3 + (index % 5) * 2, 0, Math.PI * 2);
    context.fill();
  }
}

function drawImpactStain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const gradient = context.createRadialGradient(
    width * 0.46,
    height * 0.54,
    width * 0.03,
    width * 0.46,
    height * 0.54,
    width * 0.48,
  );

  gradient.addColorStop(0, "rgba(6, 6, 5, 0.72)");
  gradient.addColorStop(0.38, "rgba(29, 24, 18, 0.46)");
  gradient.addColorStop(0.74, "rgba(74, 58, 42, 0.22)");
  gradient.addColorStop(1, "rgba(74, 58, 42, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawRadialCracks(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  const centerX = width * 0.5;
  const centerY = height * 0.52;

  context.strokeStyle = "rgba(12, 10, 8, 0.82)";

  for (let index = 0; index < 14; index += 1) {
    const angle = (Math.PI * 2 * index) / 14 + Math.sin(index) * 0.18;
    const length = width * (0.18 + ((index * 13) % 10) * 0.018);
    const bend = Math.sin(index * 2.1) * 0.16;

    context.lineWidth = index % 3 === 0 ? 5 : 3;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(
      centerX + Math.cos(angle + bend) * length,
      centerY + Math.sin(angle - bend) * length * 0.78,
    );
    context.stroke();
  }
}

function drawPaintTransfer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  const colors = [
    "rgba(238, 226, 198, 0.76)",
    "rgba(154, 34, 28, 0.66)",
    "rgba(24, 23, 21, 0.54)",
  ];

  for (let index = 0; index < 8; index += 1) {
    context.strokeStyle = colors[index % colors.length];
    context.lineWidth = index % 2 === 0 ? 5 : 3;

    const y = height * (0.24 + index * 0.07);

    context.beginPath();
    context.moveTo(width * 0.08, y);
    context.bezierCurveTo(
      width * 0.34,
      y - height * 0.08,
      width * 0.62,
      y + height * 0.06,
      width * 0.9,
      y + Math.sin(index) * height * 0.05,
    );
    context.stroke();
  }
}

function drawDustClump(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.55,
    0,
    width * 0.5,
    height * 0.55,
    width * 0.5,
  );

  gradient.addColorStop(0, "rgba(143, 126, 94, 0.5)");
  gradient.addColorStop(0.55, "rgba(108, 92, 67, 0.26)");
  gradient.addColorStop(1, "rgba(108, 92, 67, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

export function createHomeDriveThreeBuildingDamageMaterials(): HomeDriveThreeBuildingDamageMaterialSet {
  return {
    craterShadow: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawCraterShadow,
      }),
    ),
    innerHole: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawInnerHole,
      }),
    ),
    brokenPlaster: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawBrokenPlaster,
      }),
    ),
    impactStain: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawImpactStain,
      }),
    ),
    radialCracks: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 512,
        draw: drawRadialCracks,
      }),
    ),
    paintTransfer: createDecalMaterial(
      createCanvasTexture({
        width: 512,
        height: 256,
        draw: drawPaintTransfer,
      }),
    ),
    concreteChunk: createSolidMaterial({
      color: 0x8c8170,
      roughness: 0.96,
    }),
    plasterChunk: createSolidMaterial({
      color: 0xcfc2a6,
      roughness: 0.98,
    }),
    darkConcreteChunk: createSolidMaterial({
      color: 0x2a241d,
      roughness: 0.98,
    }),
    rebar: createSolidMaterial({
      color: 0x3e332b,
      roughness: 0.82,
      metalness: 0.42,
    }),
    debrisConcrete: createSolidMaterial({
      color: 0x857969,
      roughness: 0.98,
    }),
    debrisPlaster: createSolidMaterial({
      color: 0xcbbd9f,
      roughness: 0.98,
    }),
    debrisDarkConcrete: createSolidMaterial({
      color: 0x26211c,
      roughness: 0.98,
    }),
    debrisDust: createDecalMaterial(
      createCanvasTexture({
        width: 256,
        height: 256,
        draw: drawDustClump,
      }),
    ),
  };
}

export function cloneHomeDriveThreeBuildingDamageMaterial<T extends Material>(
  material: T,
  opacity: number,
): T {
  const clone = material.clone() as T;

  clone.opacity = opacity;
  clone.transparent = true;

  return clone;
}

export function disposeHomeDriveThreeBuildingDamageMaterials(
  materials: HomeDriveThreeBuildingDamageMaterialSet,
): void {
  Object.values(materials).forEach((material) => {
    if ("map" in material) {
      material.map?.dispose();
    }

    material.dispose();
  });
}
