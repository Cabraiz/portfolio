// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingEntrances/homeDrive.buildingEntrances.types.ts

import type {
  HomeDriveBuildingKind,
  HomeDriveBuildingMaterialKey,
} from "../homeDrive.building.types";

export type HomeDriveBuildingEntranceKind =
  | "single-door"
  | "double-door"
  | "tall-door"
  | "portaria"
  | "garage-door"
  | "broken-door"
  | "service-gate"
  | "shopfront-door";

export type HomeDriveBuildingEntranceMaterial =
  | "wood"
  | "metal"
  | "glass"
  | "painted"
  | "dark"
  | "rolling-steel";

export type HomeDriveBuildingEntranceCondition =
  | "clean"
  | "used"
  | "aged"
  | "damaged"
  | "broken";

export type HomeDriveBuildingEntranceSignKind =
  | "none"
  | "no-parking"
  | "private-property"
  | "reception"
  | "garage"
  | "service";

export type HomeDriveBuildingEntranceCanopyKind =
  | "none"
  | "flat-slab"
  | "thin-metal"
  | "glass"
  | "fabric";

export type HomeDriveBuildingEntranceProfile = Readonly<{
  /**
   * Tipo visual principal da entrada.
   *
   * O renderer usa isso para decidir se desenha uma porta comum,
   * portaria, porta dupla, portão, porta quebrada etc.
   */
  kind: HomeDriveBuildingEntranceKind;

  /**
   * Material visual base da porta/entrada.
   */
  material: HomeDriveBuildingEntranceMaterial;

  /**
   * Estado visual. Não precisa afetar colisão/física.
   */
  condition: HomeDriveBuildingEntranceCondition;

  /**
   * Posição horizontal local na fachada, em metros.
   *
   * 0 = centro da fachada.
   * Negativo = desloca para esquerda da fachada.
   * Positivo = desloca para direita da fachada.
   */
  localX: number;

  /**
   * Largura visual da entrada em metros.
   */
  widthMeters: number;

  /**
   * Altura visual da entrada em metros.
   */
  heightMeters: number;

  /**
   * Pequeno ajuste vertical. Normalmente 0.
   * Útil para portaria mais alta, degrau, garagem ou fachada elevada.
   */
  baseYOffsetMeters: number;

  /**
   * Escala de profundidade visual para peças que saem da fachada:
   * moldura, cobertura, placa, pilares etc.
   */
  protrusionMeters: number;

  hasFrame: boolean;
  hasHandle: boolean;
  hasIntercom: boolean;
  hasSidePillars: boolean;
  hasCenterDivider: boolean;
  hasGlassHighlights: boolean;

  canopyKind: HomeDriveBuildingEntranceCanopyKind;
  signKind: HomeDriveBuildingEntranceSignKind;

  /**
   * 0 = sem dano.
   * 1 = desgaste sutil.
   * 2 = quebrada/desalinhada.
   * 3 = bem detonada, com tábuas/trincas.
   */
  damageLevel: 0 | 1 | 2 | 3;

  /**
   * Pequeno viés visual para o renderer variar tons, altura de maçaneta,
   * offset de trincas, placa levemente torta etc.
   */
  detailSeed: number;
}>;

export type HomeDriveBuildingEntranceResolutionInput = Readonly<{
  buildingId: string;
  kind: HomeDriveBuildingKind;
  materialKey?: HomeDriveBuildingMaterialKey;

  widthMeters: number;
  heightMeters: number;
  floors: number;
  variant: number;

  districtId?: string;
  roadId?: string;
  roadKind?: string;
  facadeSeed?: number;

  /**
   * Quando true, aumenta chance de placa, porta de vidro,
   * entrada comercial e proibido estacionar.
   */
  commercialBias?: boolean;

  /**
   * Quando true, aumenta chance de portaria, vidro, pilares e canopy.
   */
  premiumBias?: boolean;

  /**
   * Quando true, aumenta chance de porta envelhecida/quebrada.
   */
  agedBias?: boolean;

  /**
   * Quando true, aumenta chance de portão, entrada de serviço e metal.
   */
  serviceBias?: boolean;
}>;

export type HomeDriveBuildingEntranceKindWeights = Readonly<
  Partial<Record<HomeDriveBuildingEntranceKind, number>>
>;

export type HomeDriveBuildingEntranceMaterialWeights = Readonly<
  Partial<Record<HomeDriveBuildingEntranceMaterial, number>>
>;
