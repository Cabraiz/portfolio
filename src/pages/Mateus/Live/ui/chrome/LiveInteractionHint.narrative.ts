// Texto de cada modo de interação do Live

import { LIVE_INTERACTION_LABELS } from "../../domain/live.constants";
import type { LiveInteractionMode } from "../../domain/live.types";

type InteractionNarrative = Readonly<{
  label: string;
  heading: string;
  description: string;
  steps: readonly string[];
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function getNarrative(mode: LiveInteractionMode): InteractionNarrative {
  switch (mode) {
    case "hover":
      return {
        label: LIVE_INTERACTION_LABELS.hover,
        heading: "Leitura por aproximação",
        description:
          "A cena responde quando o cursor se aproxima, destacando sinais e abrindo foco sem exigir clique.",
        steps: [
          "Passe o cursor pelos nós para revelar prioridade, estado e contexto.",
          "Use o placar para cruzar volume com o radar visual.",
          "A leitura fica mais limpa quando o foco se concentra em um cluster.",
        ],
      };

    case "drag":
      return {
        label: LIVE_INTERACTION_LABELS.drag,
        heading: "Exploração manual",
        description:
          "O visitante pode empurrar o campo visual para investigar relações de forma mais tátil.",
        steps: [
          "Arraste para deslocar o plano e tensionar a leitura espacial.",
          "Pare sobre um ponto importante para estabilizar a observação.",
          "Combine com o placar para validar o que está em primeiro plano.",
        ],
      };

    case "spotlight":
      return {
        label: LIVE_INTERACTION_LABELS.spotlight,
        heading: "Foco editorial",
        description:
          "Cada aproximação funciona como um spotlight, isolando o que merece atenção no momento.",
        steps: [
          "Use o cursor para acender um nó e reduzir ruído periférico.",
          "Leia o destaque atual como um recorte editorial do radar.",
          "Saia do alvo para devolver equilíbrio à cena.",
        ],
      };

    case "magnetic":
    default:
      return {
        label: LIVE_INTERACTION_LABELS.magnetic,
        heading: "Campo magnético",
        description:
          "Os elementos reagem ao cursor como um painel vivo, com atração sutil e sensação de sistema em operação.",
        steps: [
          "Mova o mouse lentamente para perceber a atração entre cursor e nós.",
          "Aproxime-se dos pontos mais fortes para abrir detalhes do fluxo.",
          "Use o painel como uma vitrine operacional, não como um gráfico estático.",
        ],
      };
  }
}

export { getNarrative, joinClassNames };
export type { InteractionNarrative };
