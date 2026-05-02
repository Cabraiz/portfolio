// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianLod.ts

import type { HomeDriveThreePedestrianDetailLevel } from "./HomeDriveThreePedestrianAgent";

export type HomeDriveThreePedestrianLodOptions = Readonly<{
  fullDetailRadiusMeters: number;

  /**
   * Mantido apenas por compatibilidade com chamadas antigas.
   * Não existe mais LOD medium/instanced.
   */
  mediumDetailRadiusMeters: number;
}>;

/**
 * LOD final sem representação visual simplificada para distância.
 *
 * A regra agora é binária:
 * - dentro do raio full: renderiza pessoa completa;
 * - fora do raio full: não renderiza.
 *
 * Isso remove da aplicação o conceito de pessoa cinza/preta distante,
 * placeholder escuro, silhouette, medium LOD e rig instanciado de longe.
 */
export function getHomeDriveThreePedestrianLodForDistance(
  distanceMeters: number,
  options: HomeDriveThreePedestrianLodOptions,
): HomeDriveThreePedestrianDetailLevel | null {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return null;
  }

  const fullDetailRadiusMeters = Math.max(0, options.fullDetailRadiusMeters);

  if (distanceMeters <= fullDetailRadiusMeters) {
    return "full";
  }

  return null;
}
