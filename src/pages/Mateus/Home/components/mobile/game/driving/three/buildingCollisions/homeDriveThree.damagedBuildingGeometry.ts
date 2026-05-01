// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingGeometry.ts

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type {
  HomeDriveBuildingCollisionDestruction,
  HomeDriveBuildingDestructionFace,
  HomeDriveBuildingDestructionZone,
} from "../../domain/buildingCollisions/homeDrive.buildingCollisionDestruction.types";

export type HomeDriveThreeDamagedBuildingMaterialSlot =
  | "body"
  | "interior"
  | "shadow"
  | "fracture"
  | "rim";

export type HomeDriveThreeDamagedBuildingBoxPart = Readonly<{
  id: string;
  materialSlot: HomeDriveThreeDamagedBuildingMaterialSlot;
  localPosition: readonly [number, number, number];
  localScale: readonly [number, number, number];
  renderOrder: number;
}>;

type FaceSpaceBox = Readonly<{
  id: string;
  materialSlot: HomeDriveThreeDamagedBuildingMaterialSlot;
  uCenter: number;
  yCenter: number;
  nCenter: number;
  uSize: number;
  ySize: number;
  nSize: number;
  renderOrder: number;
}>;

const MIN_PART_SIZE_METERS = 0.045;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getPrimaryZone(
  destruction: HomeDriveBuildingCollisionDestruction,
): HomeDriveBuildingDestructionZone | null {
  if (destruction.zones.length <= 0) {
    return null;
  }

  return [...destruction.zones].sort((first, second) => {
    return (
      second.severity * 2 + second.hitCount * 0.22 -
      (first.severity * 2 + first.hitCount * 0.22)
    );
  })[0] ?? null;
}

function getFaceWidthMeters(
  building: HomeDriveBuilding,
  face: HomeDriveBuildingDestructionFace,
): number {
  return face === "front" || face === "back"
    ? building.widthMeters
    : building.depthMeters;
}

function getFaceDepthMeters(
  building: HomeDriveBuilding,
  face: HomeDriveBuildingDestructionFace,
): number {
  return face === "front" || face === "back"
    ? building.depthMeters
    : building.widthMeters;
}

function faceSpaceToBuildingLocal(
  face: HomeDriveBuildingDestructionFace,
  u: number,
  y: number,
  n: number,
): readonly [number, number, number] {
  switch (face) {
    case "back":
      return [-u, y, -n];

    case "right":
      return [n, y, -u];

    case "left":
      return [-n, y, u];

    case "front":
    default:
      return [u, y, n];
  }
}

function faceSpaceScaleToBuildingLocal(
  face: HomeDriveBuildingDestructionFace,
  uSize: number,
  ySize: number,
  nSize: number,
): readonly [number, number, number] {
  if (face === "front" || face === "back") {
    return [uSize, ySize, nSize];
  }

  return [nSize, ySize, uSize];
}

function createPartFromFaceSpace(
  face: HomeDriveBuildingDestructionFace,
  box: FaceSpaceBox,
): HomeDriveThreeDamagedBuildingBoxPart | null {
  if (
    box.uSize <= MIN_PART_SIZE_METERS ||
    box.ySize <= MIN_PART_SIZE_METERS ||
    box.nSize <= MIN_PART_SIZE_METERS
  ) {
    return null;
  }

  return {
    id: box.id,
    materialSlot: box.materialSlot,
    localPosition: faceSpaceToBuildingLocal(
      face,
      box.uCenter,
      box.yCenter,
      box.nCenter,
    ),
    localScale: faceSpaceScaleToBuildingLocal(
      face,
      box.uSize,
      box.ySize,
      box.nSize,
    ),
    renderOrder: box.renderOrder,
  };
}

function getRimBoxes(params: Readonly<{
  building: HomeDriveBuilding;
  zone: HomeDriveBuildingDestructionZone;
  faceWidthMeters: number;
  faceDepthMeters: number;
  holeLeft: number;
  holeRight: number;
  holeBottom: number;
  holeTop: number;
  faceN: number;
}>): readonly FaceSpaceBox[] {
  const { zone } = params;
  const rimDepth = clamp(0.1 + zone.severity * 0.2 + zone.hitCount * 0.012, 0.08, 0.52);
  const rimThickness = clamp(0.16 + zone.severity * 0.24 + zone.hitCount * 0.018, 0.12, 0.58);
  const faceOut = params.faceN + 0.018;
  const holeWidth = params.holeRight - params.holeLeft;
  const holeHeight = params.holeTop - params.holeBottom;

  const boxes: FaceSpaceBox[] = [
    {
      id: `${zone.id}:rim:top`,
      materialSlot: "rim",
      uCenter: zone.localX,
      yCenter: params.holeTop + rimThickness * 0.5,
      nCenter: faceOut,
      uSize: holeWidth + rimThickness * 1.5,
      ySize: rimThickness,
      nSize: rimDepth,
      renderOrder: 83,
    },
    {
      id: `${zone.id}:rim:bottom`,
      materialSlot: "rim",
      uCenter: zone.localX,
      yCenter: params.holeBottom - rimThickness * 0.5,
      nCenter: faceOut,
      uSize: holeWidth + rimThickness * 1.2,
      ySize: rimThickness,
      nSize: rimDepth,
      renderOrder: 83,
    },
    {
      id: `${zone.id}:rim:left`,
      materialSlot: "rim",
      uCenter: params.holeLeft - rimThickness * 0.5,
      yCenter: zone.localY,
      nCenter: faceOut,
      uSize: rimThickness,
      ySize: holeHeight,
      nSize: rimDepth,
      renderOrder: 83,
    },
    {
      id: `${zone.id}:rim:right`,
      materialSlot: "rim",
      uCenter: params.holeRight + rimThickness * 0.5,
      yCenter: zone.localY,
      nCenter: faceOut,
      uSize: rimThickness,
      ySize: holeHeight,
      nSize: rimDepth,
      renderOrder: 83,
    },
  ];

  zone.edgeProfile.forEach((point, index) => {
    const isVertical = Math.abs(point.x) > Math.abs(point.y);
    const u = zone.localX + point.x * holeWidth * 0.5;
    const y = zone.localY + point.y * holeHeight * 0.5;
    const chip = clamp(0.12 + Math.abs(point.offsetMeters) * 1.15, 0.1, 0.55);

    boxes.push({
      id: `${zone.id}:rim:chip:${index}`,
      materialSlot: index % 3 === 0 ? "fracture" : "rim",
      uCenter: u + (isVertical ? Math.sign(point.x || 1) * chip * 0.25 : 0),
      yCenter: y + (!isVertical ? Math.sign(point.y || 1) * chip * 0.25 : 0),
      nCenter: faceOut + 0.012 * (index % 2),
      uSize: isVertical ? chip * 0.72 : chip * 1.8,
      ySize: isVertical ? chip * 1.7 : chip * 0.72,
      nSize: rimDepth * (0.72 + (index % 4) * 0.1),
      renderOrder: 84,
    });
  });

  return boxes;
}

export function createHomeDriveThreeDamagedBuildingParts(params: Readonly<{
  building: HomeDriveBuilding;
  destruction: HomeDriveBuildingCollisionDestruction;
}>): readonly HomeDriveThreeDamagedBuildingBoxPart[] {
  const { building, destruction } = params;
  const zone = getPrimaryZone(destruction);

  if (!zone) {
    return [
      {
        id: `${building.id}:intact-body`,
        materialSlot: "body",
        localPosition: [0, building.heightMeters * 0.5, 0],
        localScale: [
          building.widthMeters,
          building.heightMeters,
          building.depthMeters,
        ],
        renderOrder: 72,
      },
    ];
  }

  const faceWidthMeters = getFaceWidthMeters(building, zone.face);
  const faceDepthMeters = getFaceDepthMeters(building, zone.face);
  const holeWidthMeters = clamp(
    zone.holeWidthMeters,
    0.5,
    Math.max(0.52, faceWidthMeters * 0.86),
  );
  const holeHeightMeters = clamp(
    zone.holeHeightMeters,
    0.5,
    Math.max(0.52, building.heightMeters * 0.74),
  );
  const holeDepthMeters = clamp(
    zone.holeDepthMeters,
    0.36,
    Math.max(0.38, faceDepthMeters * 0.94),
  );

  const holeCenterU = clamp(
    zone.localX,
    -faceWidthMeters * 0.5 + holeWidthMeters * 0.5,
    faceWidthMeters * 0.5 - holeWidthMeters * 0.5,
  );
  const holeCenterY = clamp(
    zone.localY,
    holeHeightMeters * 0.5,
    Math.max(holeHeightMeters * 0.5, building.heightMeters - holeHeightMeters * 0.5),
  );

  const leftEdge = -faceWidthMeters * 0.5;
  const rightEdge = faceWidthMeters * 0.5;
  const bottomEdge = 0;
  const topEdge = building.heightMeters;
  const holeLeft = holeCenterU - holeWidthMeters * 0.5;
  const holeRight = holeCenterU + holeWidthMeters * 0.5;
  const holeBottom = holeCenterY - holeHeightMeters * 0.5;
  const holeTop = holeCenterY + holeHeightMeters * 0.5;
  const faceN = faceDepthMeters * 0.5;

  const remainingBackDepth = Math.max(0, faceDepthMeters - holeDepthMeters);
  const faceBoxes: FaceSpaceBox[] = [
    {
      id: `${building.id}:damaged:left-mass`,
      materialSlot: "body",
      uCenter: (leftEdge + holeLeft) * 0.5,
      yCenter: building.heightMeters * 0.5,
      nCenter: 0,
      uSize: holeLeft - leftEdge,
      ySize: building.heightMeters,
      nSize: faceDepthMeters,
      renderOrder: 72,
    },
    {
      id: `${building.id}:damaged:right-mass`,
      materialSlot: "body",
      uCenter: (holeRight + rightEdge) * 0.5,
      yCenter: building.heightMeters * 0.5,
      nCenter: 0,
      uSize: rightEdge - holeRight,
      ySize: building.heightMeters,
      nSize: faceDepthMeters,
      renderOrder: 72,
    },
    {
      id: `${building.id}:damaged:bottom-mass`,
      materialSlot: "body",
      uCenter: holeCenterU,
      yCenter: (bottomEdge + holeBottom) * 0.5,
      nCenter: 0,
      uSize: holeWidthMeters,
      ySize: holeBottom - bottomEdge,
      nSize: faceDepthMeters,
      renderOrder: 72,
    },
    {
      id: `${building.id}:damaged:top-mass`,
      materialSlot: "body",
      uCenter: holeCenterU,
      yCenter: (holeTop + topEdge) * 0.5,
      nCenter: 0,
      uSize: holeWidthMeters,
      ySize: topEdge - holeTop,
      nSize: faceDepthMeters,
      renderOrder: 72,
    },
  ];

  if (remainingBackDepth > MIN_PART_SIZE_METERS) {
    faceBoxes.push({
      id: `${building.id}:damaged:cavity-back-mass`,
      materialSlot: "interior",
      uCenter: holeCenterU,
      yCenter: holeCenterY,
      nCenter: -holeDepthMeters * 0.5,
      uSize: holeWidthMeters,
      ySize: holeHeightMeters,
      nSize: remainingBackDepth,
      renderOrder: 74,
    });
  }

  faceBoxes.push({
    id: `${building.id}:damaged:cavity-shadow`,
    materialSlot: "shadow",
    uCenter: holeCenterU,
    yCenter: holeCenterY,
    nCenter: faceN - holeDepthMeters + 0.018,
    uSize: holeWidthMeters * 0.94,
    ySize: holeHeightMeters * 0.92,
    nSize: 0.035,
    renderOrder: 86,
  });

  faceBoxes.push(
    ...getRimBoxes({
      building,
      zone,
      faceWidthMeters,
      faceDepthMeters,
      holeLeft,
      holeRight,
      holeBottom,
      holeTop,
      faceN,
    }),
  );

  return faceBoxes
    .map((box) => createPartFromFaceSpace(zone.face, box))
    .filter((part): part is HomeDriveThreeDamagedBuildingBoxPart => Boolean(part));
}
