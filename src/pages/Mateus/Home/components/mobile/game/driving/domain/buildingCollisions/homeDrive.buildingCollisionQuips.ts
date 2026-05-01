// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionQuips.ts

import type { HomeDriveBuildingCollisionFace } from "./homeDrive.buildingCollision.types";

const LIGHT_QUIPS = Object.freeze([
  "POC!",
  "Encostou bonito.",
  "Parede: 1 x 0.",
  "Foi só um carinho.",
  "GPS recalculando.",
]);

const MEDIUM_QUIPS = Object.freeze([
  "Não era drive-thru.",
  "Fachada invicta.",
  "Airbag moral ativado.",
  "O prédio nem piscou.",
  "Manobra conceitual.",
]);

const HEAVY_QUIPS = Object.freeze([
  "MERMÃO!",
  "A parede venceu.",
  "Sinistro arquitetônico.",
  "Seguro chorando.",
  "Check-in no concreto.",
  "Isso era uma fachada.",
]);

const FACE_QUIPS: Readonly<Record<HomeDriveBuildingCollisionFace, readonly string[]>> =
  Object.freeze({
    front: ["Entrada negada.", "Recepção fechada.", "Portaria surpresa."],
    back: ["Fundos invadidos.", "Saída era do outro lado.", "Beco errado."],
    left: ["Lateral sentiu.", "Raspou com estilo.", "Curva otimista."],
    right: ["Direita sem preferência.", "Calçada discordou.", "Quase passou."],
  });

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickStable<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

export function getHomeDriveBuildingCollisionQuip(params: Readonly<{
  buildingId: string;
  face: HomeDriveBuildingCollisionFace;
  severity: number;
  impulse: number;
  relativeSpeedMps: number;
}>): string {
  const severity = Math.max(0, Math.min(1, params.severity));
  const seed = hashString(
    `${params.buildingId}:${params.face}:${Math.round(params.impulse * 10)}:${Math.round(params.relativeSpeedMps * 10)}`,
  );

  if (severity >= 0.72) {
    return pickStable([...HEAVY_QUIPS, ...FACE_QUIPS[params.face]], seed);
  }

  if (severity >= 0.38) {
    return pickStable([...MEDIUM_QUIPS, ...FACE_QUIPS[params.face]], seed);
  }

  return pickStable([...LIGHT_QUIPS, ...FACE_QUIPS[params.face]], seed);
}
