// src/pages/Mateus/Home/components/mobile/game/elevator/HomeElevatorGame.helpers.ts

import {
	HOME_ELEVATOR_FLOOR_COUNT,
	HOME_ELEVATOR_TOP_FLOOR,
} from "./domains/homeElevator.constants";
import type { HomeElevatorRuntimeState } from "./domains/homeElevator.types";

export type PendingCommand = Readonly<{
  selectedTargetFloor?: number;
  requestDoorToggle?: boolean;
  forceSpawn?: boolean;
}>;

export const FLOOR_NUMBERS = Array.from(
  { length: HOME_ELEVATOR_FLOOR_COUNT },
  (_, index) => HOME_ELEVATOR_TOP_FLOOR - index,
);

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function formatScore(score: number): string {
  return Math.round(score).toLocaleString("pt-BR");
}

export function getDoorOpenRatio(doorState: HomeElevatorRuntimeState["cabin"]["doorState"]): number {
  switch (doorState) {
    case "opening":
    case "open":
      return 1;
    case "closing":
    case "closed":
    default:
      return 0;
  }
}

export function getStatusText(state: HomeElevatorRuntimeState): string {
  const { cabin, waiting } = state;

  if (state.energy <= 0) {
    return "Energia zerada. Segure o prédio e reinicie a operação.";
  }

  if (cabin.doorState === "open") {
    return "Portas abertas: entregando passageiros e embarcando quem está no andar.";
  }

  if (cabin.doorState === "opening") {
    return "Abrindo portas.";
  }

  if (cabin.doorState === "closing") {
    return "Fechando portas.";
  }

  if (Math.abs(cabin.targetFloor - cabin.yFloor) > 0.05) {
    return `Indo para o ${cabin.targetFloor}º andar.`;
  }

  if (cabin.onboard.length > 0) {
    return "Escolha o destino mais próximo para manter sequência de entrega.";
  }

  if (waiting.length > 0) {
    return "Há chamadas ativas. Toque em um andar com ponto vermelho.";
  }

  return "Prédio sob controle. Aguarde a próxima chamada.";
}
