/**
 * Caixa da peça no lugar dela, sem o `translate` com que um agente ainda a
 * traz de fora da tela (AgentCursors soma o arrasto ao `translate`). O
 * empurrar do logo guarda estas medidas até o próximo refresh completo: medido
 * no meio do arrasto, o logo ficava 240 px acima e as linhas 190 px à
 * esquerda, e o logo descia sem empurrar nada até a página ser medida de novo.
 * `scale` é a escala do pai (o `translate` anda no espaço dele).
 */
export function restingRect(element: Element, scale = 1): DOMRect {
  const box = element.getBoundingClientRect();
  const translate = getComputedStyle(element).translate;
  if (!translate || translate === "none") return box;
  const [x = 0, y = 0] = translate.split(" ").map(value => (value.endsWith("px") ? parseFloat(value) : 0));
  if (!x && !y) return box;
  return new DOMRect(box.x - x * scale, box.y - y * scale, box.width, box.height);
}
