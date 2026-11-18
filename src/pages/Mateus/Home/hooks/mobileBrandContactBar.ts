// Pontas do fundo e do contorno da barra (px): o resto é o meio reto que encolhe.
const BAR_CAP = 24;
const PILL_CAP = 25;

type BarSize = { barBody: number; pillBand: number };

/**
 * A barra de contato estreita para o logo passar sem mudar de layout: só
 * transform (compositor). As pontas deslizam, os meios retos encolhem a
 * partir da direita e o conteúdo de cada botão acompanha o centro dele.
 * `size` guarda a largura dos meios retos medida por `measure`.
 */
export function createContactBar(actions: HTMLElement, size: BarSize) {
  const part = (selector: string) => actions.querySelector<HTMLElement>(selector);
  const [firstButton, lastButton] = Array.from(actions.querySelectorAll<HTMLElement>(":scope > a"));
  const barParts = {
    cap: part('[data-bar-part="cap"]'),
    body: part('[data-bar-part="body"]'),
    firstCap: firstButton?.querySelector<HTMLElement>('[data-pill-part="cap"]') ?? null,
    firstBand: firstButton?.querySelector<HTMLElement>('[data-pill-part="band"]') ?? null,
    lastBand: lastButton?.querySelector<HTMLElement>('[data-pill-part="band"]') ?? null,
    divider: part("[data-action-divider]"),
    firstContent: firstButton?.querySelector<HTMLElement>("[data-action-content]") ?? null,
    lastContent: lastButton?.querySelector<HTMLElement>("[data-action-content]") ?? null,
  };
  /** Mede os meios retos; `bar` é a caixa da barra inteira. */
  const measure = (bar: DOMRect) => {
    size.barBody = Math.max(1, (barParts.body?.offsetWidth ?? 0) || bar.width - 2 * BAR_CAP);
    size.pillBand = Math.max(1, (barParts.firstBand?.offsetWidth ?? 0) ||
      (firstButton?.offsetWidth ?? 0) - PILL_CAP);
  };
  /** Transform de cada parte da barra para `push` px de estreitamento. */
  const transforms = (push: number) => {
    const half = push / 2;
    const band = `scaleX(${Math.max(0, (size.pillBand - half) / size.pillBand).toFixed(5)})`;
    return [
      [barParts.cap, `translateX(${push.toFixed(3)}px)`],
      [barParts.body, `scaleX(${Math.max(0, (size.barBody - push) / size.barBody).toFixed(5)})`],
      [barParts.firstCap, `translateX(${push.toFixed(3)}px)`],
      [barParts.firstBand, `translateX(${half.toFixed(3)}px) ${band}`],
      [barParts.lastBand, band],
      [barParts.divider, `translateX(${half.toFixed(3)}px)`],
      [barParts.firstContent, `translateX(${(push * 0.75).toFixed(3)}px)`],
      [barParts.lastContent, `translateX(${(push * 0.25).toFixed(3)}px)`],
    ].filter((entry): entry is [HTMLElement, string] => entry[0] !== null);
  };
  return { measure, transforms };
}
