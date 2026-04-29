// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildingSigns.tsx

import React, { memo, useEffect, useMemo } from "react";
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
} from "three";

import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import {
  getHomeDriveCommerceDescriptor,
  getHomeDriveStableStringSeed,
  shouldHomeDriveBuildingHaveCommerceSign,
  type HomeDriveCommerceCategory,
  type HomeDriveCommerceSignStyle,
} from "../domain/homeDrive.commerceNames";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeBuildingSignsProps = Readonly<{
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  maxSourceBuildings?: number;
  maxVisibleSigns?: number;
  visibleRadiusMeters?: number;
}>;

type HomeDriveBuildingSignInstance = Readonly<{
  id: string;
  buildingId: string;
  label: string;
  category: HomeDriveCommerceCategory;
  signStyle: HomeDriveCommerceSignStyle;
  texture: CanvasTexture;
  position: readonly [number, number, number];
  rotationYRad: number;
  widthMeters: number;
  heightMeters: number;
  renderOrder: number;
}>;

const DEFAULT_MAX_SOURCE_BUILDINGS = 16384;
const DEFAULT_MAX_VISIBLE_SIGNS = 420;
const DEFAULT_VISIBLE_RADIUS_METERS = 520;

const SIGN_SURFACE_OFFSET_METERS = 0.18;
const SIGN_TEXTURE_WIDTH = 768;
const SIGN_TEXTURE_HEIGHT = 192;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getFrontLocalZ(building: HomeDriveBuilding): number {
  return -building.side * (building.depthMeters / 2 + SIGN_SURFACE_OFFSET_METERS);
}

function getFacadeRotationY(building: HomeDriveBuilding): number {
  return building.rotationYRad + (building.side === 1 ? Math.PI : 0);
}

function localToWorld(
  building: HomeDriveBuilding,
  localX: number,
  localY: number,
  localZ: number,
): readonly [number, number, number] {
  const cos = Math.cos(building.rotationYRad);
  const sin = Math.sin(building.rotationYRad);

  return [
    building.position.x + localX * cos + localZ * sin,
    localY,
    building.position.z - localX * sin + localZ * cos,
  ];
}

function getDistanceSquaredToRuntime(
  building: HomeDriveBuilding,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const car = runtimeRef.current.car;
  const dx = building.position.x - car.position.x;
  const dz = building.position.z - car.position.z;

  return dx * dx + dz * dz;
}

function shouldUseSignWithinRadius(
  building: HomeDriveBuilding,
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState> | undefined,
  visibleRadiusMeters: number,
): boolean {
  if (!runtimeRef) {
    return true;
  }

  return getDistanceSquaredToRuntime(building, runtimeRef) <=
    visibleRadiusMeters * visibleRadiusMeters;
}

function getSignBoardColors(
  category: HomeDriveCommerceCategory,
  signStyle: HomeDriveCommerceSignStyle,
  seed: number,
): Readonly<{
  background: string;
  border: string;
  text: string;
  accent: string;
  shadow: string;
}> {
  if (signStyle === "pharmacy" || category === "pharmacy") {
    return {
      background: "#f2f5ec",
      border: "#2f8c4f",
      text: "#1c4e31",
      accent: "#34a853",
      shadow: "rgba(22, 58, 38, 0.35)",
    };
  }

  if (signStyle === "market" || category === "market") {
    return {
      background: "#f0bd44",
      border: "#6d4315",
      text: "#2b1b0b",
      accent: "#9b271f",
      shadow: "rgba(72, 38, 8, 0.36)",
    };
  }

  if (signStyle === "industrial" || category === "warehouse") {
    return {
      background: "#586068",
      border: "#202429",
      text: "#edf0ec",
      accent: "#d8b45f",
      shadow: "rgba(0, 0, 0, 0.42)",
    };
  }

  if (signStyle === "glass" || category === "office" || category === "bank") {
    return {
      background: "#17344b",
      border: "#9eb5c4",
      text: "#e9f4f8",
      accent: "#6bb7d6",
      shadow: "rgba(3, 12, 18, 0.46)",
    };
  }

  if (signStyle === "neon") {
    return seed > 0.5
      ? {
          background: "#241425",
          border: "#dc80c8",
          text: "#ffd6f3",
          accent: "#f463d2",
          shadow: "rgba(244, 99, 210, 0.42)",
        }
      : {
          background: "#101f25",
          border: "#6bc9d6",
          text: "#e4fbff",
          accent: "#3dd8e8",
          shadow: "rgba(61, 216, 232, 0.42)",
        };
  }

  if (signStyle === "classic") {
    return {
      background: "#ede0be",
      border: "#4f3621",
      text: "#342414",
      accent: "#a45028",
      shadow: "rgba(64, 38, 16, 0.34)",
    };
  }

  if (signStyle === "vertical") {
    return {
      background: "#26303b",
      border: "#d5b15b",
      text: "#f4e3b7",
      accent: "#cc4c2f",
      shadow: "rgba(0, 0, 0, 0.44)",
    };
  }

  return {
    background: "#2e3840",
    border: "#d0b16a",
    text: "#f8edcf",
    accent: "#b45a35",
    shadow: "rgba(0, 0, 0, 0.38)",
  };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fitTextFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minSize: number,
): number {
  for (let size = initialSize; size >= minSize; size -= 2) {
    context.font = `900 ${size}px Arial, Helvetica, sans-serif`;

    if (context.measureText(text).width <= maxWidth) {
      return size;
    }
  }

  return minSize;
}

function normalizeSignText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 34);
}

function drawSignAccent(
  context: CanvasRenderingContext2D,
  category: HomeDriveCommerceCategory,
  signStyle: HomeDriveCommerceSignStyle,
  colors: ReturnType<typeof getSignBoardColors>,
): void {
  context.save();

  context.fillStyle = colors.accent;

  if (category === "pharmacy") {
    const centerX = 82;
    const centerY = 94;

    context.fillRect(centerX - 12, centerY - 38, 24, 76);
    context.fillRect(centerX - 38, centerY - 12, 76, 24);
  } else if (category === "market") {
    context.beginPath();
    context.arc(82, 96, 34, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = colors.background;
    context.fillRect(58, 89, 48, 14);
  } else if (signStyle === "neon") {
    context.shadowColor = colors.accent;
    context.shadowBlur = 22;
    context.strokeStyle = colors.accent;
    context.lineWidth = 7;
    context.beginPath();
    context.arc(82, 96, 32, 0, Math.PI * 2);
    context.stroke();
  } else if (signStyle === "industrial") {
    context.fillRect(42, 56, 82, 22);
    context.fillRect(42, 88, 82, 22);
    context.fillRect(42, 120, 82, 22);
  } else {
    context.beginPath();
    context.moveTo(46, 96);
    context.lineTo(84, 56);
    context.lineTo(122, 96);
    context.lineTo(84, 136);
    context.closePath();
    context.fill();
  }

  context.restore();
}

function drawCanvasSign(
  context: CanvasRenderingContext2D,
  label: string,
  category: HomeDriveCommerceCategory,
  signStyle: HomeDriveCommerceSignStyle,
  seed: number,
): void {
  const colors = getSignBoardColors(category, signStyle, seed);
  const canvasWidth = SIGN_TEXTURE_WIDTH;
  const canvasHeight = SIGN_TEXTURE_HEIGHT;

  context.clearRect(0, 0, canvasWidth, canvasHeight);

  context.save();
  context.shadowColor = colors.shadow;
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;

  drawRoundedRect(context, 18, 18, canvasWidth - 36, canvasHeight - 36, 24);
  context.fillStyle = colors.background;
  context.fill();

  context.restore();

  context.lineWidth = 10;
  context.strokeStyle = colors.border;
  drawRoundedRect(context, 24, 24, canvasWidth - 48, canvasHeight - 48, 20);
  context.stroke();

  if (signStyle === "classic" || signStyle === "market") {
    context.fillStyle = "rgba(255,255,255,0.16)";
    for (let stripe = 0; stripe < 9; stripe += 1) {
      context.fillRect(34 + stripe * 82, 34, 32, canvasHeight - 68);
    }
  }

  if (signStyle === "glass") {
    const gradient = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "rgba(255,255,255,0.28)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.04)");
    gradient.addColorStop(1, "rgba(255,255,255,0.18)");

    context.fillStyle = gradient;
    drawRoundedRect(context, 34, 34, canvasWidth - 68, canvasHeight - 68, 18);
    context.fill();
  }

  drawSignAccent(context, category, signStyle, colors);

  const text = normalizeSignText(label).toUpperCase();
  const fontSize = fitTextFontSize(context, text, canvasWidth - 220, 58, 34);

  context.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.lineJoin = "round";

  const textX = 150;
  const textY = canvasHeight / 2;

  context.lineWidth = 9;
  context.strokeStyle = "rgba(0, 0, 0, 0.34)";
  context.strokeText(text, textX, textY);

  context.fillStyle = colors.text;
  context.fillText(text, textX, textY);

  context.fillStyle = colors.accent;
  context.fillRect(150, 138, Math.min(420, text.length * 17), 6);
}

function createSignTexture(
  label: string,
  category: HomeDriveCommerceCategory,
  signStyle: HomeDriveCommerceSignStyle,
  seed: number,
): CanvasTexture | null {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");

  canvas.width = SIGN_TEXTURE_WIDTH;
  canvas.height = SIGN_TEXTURE_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  drawCanvasSign(context, label, category, signStyle, seed);

  const texture = new CanvasTexture(canvas);

  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;

  return texture;
}

function getSignSizeMeters(
  building: HomeDriveBuilding,
  signStyle: HomeDriveCommerceSignStyle,
): Readonly<{
  widthMeters: number;
  heightMeters: number;
}> {
  if (signStyle === "vertical") {
    return {
      widthMeters: clamp(building.widthMeters * 0.22, 2.4, 4.4),
      heightMeters: clamp(building.heightMeters * 0.22, 3.2, 7.8),
    };
  }

  if (building.kind === "office") {
    return {
      widthMeters: clamp(building.widthMeters * 0.58, 5.2, 13.5),
      heightMeters: clamp(building.heightMeters * 0.045, 1.4, 2.4),
    };
  }

  if (building.kind === "warehouse") {
    return {
      widthMeters: clamp(building.widthMeters * 0.48, 5.4, 14.5),
      heightMeters: clamp(building.heightMeters * 0.11, 1.6, 2.8),
    };
  }

  return {
    widthMeters: clamp(building.widthMeters * 0.58, 3.8, 11.6),
    heightMeters: clamp(building.heightMeters * 0.12, 1.35, 2.35),
  };
}

function getSignLocalY(
  building: HomeDriveBuilding,
  signStyle: HomeDriveCommerceSignStyle,
): number {
  if (signStyle === "vertical") {
    return clamp(building.heightMeters * 0.45, 3.4, building.heightMeters - 1.4);
  }

  switch (building.kind) {
    case "office":
      return clamp(building.heightMeters * 0.24, 4.6, building.heightMeters - 1.8);

    case "warehouse":
      return clamp(building.heightMeters * 0.58, 3.6, building.heightMeters - 1.1);

    case "apartment":
      return clamp(3.6, 2.8, building.heightMeters - 1.2);

    case "commerce":
    default:
      return clamp(3.35, 2.7, building.heightMeters - 1.05);
  }
}

function createBuildingSignInstance(
  building: HomeDriveBuilding,
): HomeDriveBuildingSignInstance | null {
  const descriptor = getHomeDriveCommerceDescriptor(building);
  const texture = createSignTexture(
    descriptor.name,
    descriptor.category,
    descriptor.signStyle,
    descriptor.seed,
  );

  if (!texture) {
    return null;
  }

  const { widthMeters, heightMeters } = getSignSizeMeters(
    building,
    descriptor.signStyle,
  );

  const horizontalSeed = getHomeDriveStableStringSeed(
    `${building.id}:sign-x:${building.variant}`,
    101,
  );

  const maxLocalX = Math.max(0, building.widthMeters * 0.5 - widthMeters * 0.55);
  const localX =
    descriptor.signStyle === "vertical"
      ? (horizontalSeed > 0.5 ? 1 : -1) * maxLocalX
      : (horizontalSeed - 0.5) * maxLocalX * 0.55;

  const localY = getSignLocalY(building, descriptor.signStyle);
  const localZ = getFrontLocalZ(building);

  return {
    id: `${building.id}::sign`,
    buildingId: building.id,
    label: descriptor.name,
    category: descriptor.category,
    signStyle: descriptor.signStyle,
    texture,
    position: localToWorld(building, localX, localY, localZ),
    rotationYRad: getFacadeRotationY(building),
    widthMeters,
    heightMeters,
    renderOrder: descriptor.signStyle === "neon" ? 31 : 29,
  };
}

function selectSignBuildings(
  buildings: readonly HomeDriveBuilding[],
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState> | undefined,
  visibleRadiusMeters: number,
  maxVisibleSigns: number,
): readonly HomeDriveBuilding[] {
  return buildings
    .filter((building) => {
      if (!shouldHomeDriveBuildingHaveCommerceSign(building)) {
        return false;
      }

      return shouldUseSignWithinRadius(building, runtimeRef, visibleRadiusMeters);
    })
    .sort((first, second) => {
      const firstDistance = getDistanceSquaredToRuntime(first, runtimeRef);
      const secondDistance = getDistanceSquaredToRuntime(second, runtimeRef);

      if (firstDistance !== secondDistance) {
        return firstDistance - secondDistance;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, maxVisibleSigns);
}

function HomeDriveThreeBuildingSigns({
  runtimeRef,
  maxSourceBuildings = DEFAULT_MAX_SOURCE_BUILDINGS,
  maxVisibleSigns = DEFAULT_MAX_VISIBLE_SIGNS,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
}: HomeDriveThreeBuildingSignsProps) {
  const signs = useMemo(() => {
    const buildings = getHomeDriveBuildings({
      maxBuildings: maxSourceBuildings,
    });

    const selectedBuildings = selectSignBuildings(
      buildings,
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleSigns,
    );

    return selectedBuildings
      .map(createBuildingSignInstance)
      .filter((sign): sign is HomeDriveBuildingSignInstance => Boolean(sign));
  }, [maxSourceBuildings, maxVisibleSigns, runtimeRef, visibleRadiusMeters]);

  useEffect(() => {
    return () => {
      signs.forEach((sign) => {
        sign.texture.dispose();
      });
    };
  }, [signs]);

  if (signs.length <= 0) {
    return null;
  }

  return (
    <group renderOrder={29}>
      {signs.map((sign) => (
        <mesh
          key={sign.id}
          position={sign.position}
          rotation={[0, sign.rotationYRad, 0]}
          scale={[sign.widthMeters, sign.heightMeters, 1]}
          renderOrder={sign.renderOrder}
          frustumCulled
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={sign.texture}
            transparent
            depthWrite={false}
            toneMapped={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildingSigns);
