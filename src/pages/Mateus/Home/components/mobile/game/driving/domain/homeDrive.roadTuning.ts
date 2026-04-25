export type HomeDriveRoadTuning = Readonly<{
  /**
   * Posição geral do bloco da pista no viewport.
   *
   * Menor / mais negativo = terra/chão mais para baixo.
   * Maior / positivo = terra/chão mais para cima.
   */
  viewportBottomPct: number;
  viewportHeightPct: number;
  viewportSideBleedPct: number;

  /**
   * Posição visual do motorista dentro da pista.
   *
   * Positivo desloca a pista para a esquerda perto da câmera,
   * fazendo o cockpit parecer estar na faixa direita.
   */
  driverLaneBiasPct: number;
  driverLaneBiasDepthPower: number;

  /**
   * Perspectiva / Z.
   *
   * Maior que 1 = rua abre mais devagar e cria Z longo/infinito.
   * Menor que 1 = rua abre muito rápido perto da câmera.
   */
  widthPerspectiveExponent: number;

  /**
   * Horizonte interno da rua.
   *
   * Menor offset = rua/asfalto nasce mais alto.
   * Maior offset = rua/asfalto nasce mais baixo.
   */
  horizonOffset: number;
  horizonMin: number;
  horizonMax: number;

  /**
   * Largura da pista.
   */
  farRoadWidthMultiplier: number;
  farRoadWidthMin: number;
  nearRoadWidthMultiplier: number;
  nearRoadWidthMin: number;

  /**
   * Zebrado lateral e faixa central.
   */
  rumbleWidthMultiplier: number;
  rumbleWidthMin: number;
  laneMarkWidthMultiplier: number;
  laneMarkWidthMin: number;

  /**
   * Relevo vertical.
   */
  hillStrength: number;
  hillSecondaryStrength: number;
  hillNearStrength: number;

  /**
   * Leitura visual.
   */
  depthOverlayOpacity: number;
  edgeLightOpacityMultiplier: number;
  textureOpacityMin: number;
  roadStrokeOpacityFar: number;
  roadStrokeOpacityNear: number;
  scanlineOpacityMultiplier: number;

  /**
   * Sombra projetada para trás.
   */
  shadowOpacityMin: number;
  shadowOpacityMax: number;
  shadowLengthMin: number;
  shadowLengthMax: number;
  shadowNearWidthMin: number;
  shadowNearWidthMax: number;
  shadowFarWidthMin: number;
  shadowFarWidthMax: number;
}>;

/**
 * ESTE É O ARQUIVO QUE VOCÊ VAI AJUSTAR MANUALMENTE.
 *
 * Para criar Z infinito:
 * - aumente widthPerspectiveExponent
 * - diminua farRoadWidthMultiplier
 * - diminua farRoadWidthMin
 * - mantenha nearRoadWidthMultiplier alto
 *
 * Para aumentar o funil no final da rua:
 * - aumente levemente widthPerspectiveExponent
 * - diminua farRoadWidthMultiplier
 * - diminua farRoadWidthMin
 * - não mexa em nearRoadWidthMultiplier / nearRoadWidthMin
 *
 * Para aumentar levemente o efeito Z:
 * - aumente widthPerspectiveExponent em passos pequenos
 * - exemplo: 1.42 -> 1.5 -> 1.58 -> 1.65
 *
 * Para aumentar a largura inicial da rua perto do cockpit:
 * - aumente nearRoadWidthMultiplier
 * - aumente nearRoadWidthMin
 * - aumente viewportSideBleedPct para evitar corte lateral
 *
 * Para aumentar a largura no fundo/horizonte:
 * - aumente farRoadWidthMultiplier
 * - aumente farRoadWidthMin
 *
 * Para afinar mais o horizonte:
 * - diminua farRoadWidthMultiplier
 * - diminua farRoadWidthMin
 *
 * Para abaixar a terra/chão:
 * - diminua viewportBottomPct
 *
 * Para levantar a rua/asfalto:
 * - diminua horizonOffset
 * - diminua horizonMin
 * - diminua horizonMax
 *
 * Para abaixar só a rua/asfalto:
 * - aumente horizonOffset
 * - aumente horizonMin
 * - aumente horizonMax
 *
 * Para dar mais área lateral ao SVG:
 * - aumente viewportSideBleedPct
 *
 * Para puxar a rua para a esquerda:
 * - ajuste ROAD_GLOBAL_LEFT_OFFSET_X no HomeDriveRoadSurface.tsx
 * - ajuste driverLaneBiasPct aqui apenas para o efeito perto da câmera
 */
export const HOME_DRIVE_ROAD_TUNING: HomeDriveRoadTuning = {
  /**
   * Mantém terra/chão mais baixo.
   */
  viewportBottomPct: -24,

  /**
   * Altura suficiente para a rua ter profundidade sem esmagar o horizonte.
   */
  viewportHeightPct: 74,

  /**
   * Mantém sangria lateral para a largura inicial maior não cortar.
   */
  viewportSideBleedPct: 46,

  /**
   * Mantém o cockpit visualmente na faixa direita,
   * mas sem exagerar a curvatura lateral perto do volante.
   */
  driverLaneBiasPct: 15,
  driverLaneBiasDepthPower: 1.72,

  /**
   * Funil/Z mais forte.
   *
   * Antes:
   * widthPerspectiveExponent: 1.5
   *
   * Agora:
   * 1.58 faz a rua demorar um pouco mais para abrir,
   * aumentando o funil no horizonte sem mexer na largura inicial.
   */
  widthPerspectiveExponent: 1.58,

  /**
   * Rua levantada dentro da superfície.
   */
  horizonOffset: -10,
  horizonMin: 4,
  horizonMax: 24,

  /**
   * FUNIL NO FINAL DA RUA.
   *
   * Antes:
   * farRoadWidthMultiplier: 0.462
   * farRoadWidthMin: 8
   *
   * Agora:
   * horizonte mais fino para reforçar o efeito de profundidade.
   */
  farRoadWidthMultiplier: 0.34,
  farRoadWidthMin: 5.5,

  /**
   * Largura inicial da rua perto do cockpit/volante.
   *
   * Mantido igual para não reduzir a base da pista.
   */
  nearRoadWidthMultiplier: 2.16,
  nearRoadWidthMin: 330,

  /**
   * Zebrado lateral acompanha a rua maior perto da câmera.
   */
  rumbleWidthMultiplier: 1.42,
  rumbleWidthMin: 9.2,

  /**
   * Faixa central levemente ajustada para acompanhar a escala.
   */
  laneMarkWidthMultiplier: 1.14,
  laneMarkWidthMin: 1.12,

  /**
   * Relevo mantido controlado.
   */
  hillStrength: 7.2,
  hillSecondaryStrength: 2.8,
  hillNearStrength: 2.4,

  /**
   * Visibilidade da rua.
   */
  depthOverlayOpacity: 0.13,
  edgeLightOpacityMultiplier: 1.18,
  textureOpacityMin: 0.28,
  roadStrokeOpacityFar: 0.1,
  roadStrokeOpacityNear: 0.3,
  scanlineOpacityMultiplier: 0.68,

  /**
   * Sombra projetada para trás.
   */
  shadowOpacityMin: 0.08,
  shadowOpacityMax: 0.18,
  shadowLengthMin: 12,
  shadowLengthMax: 22,
  shadowNearWidthMin: 34,
  shadowNearWidthMax: 42,
  shadowFarWidthMin: 8,
  shadowFarWidthMax: 14,
};

export function getHomeDriveRoadTuning(): HomeDriveRoadTuning {
  return HOME_DRIVE_ROAD_TUNING;
}
