// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtureCollision.types.ts

import type { HomeDriveRuntimeImpactState } from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveUrbanStreetLight,
  HomeDriveUrbanTrafficLight,
} from "./homeDrive.urbanFixtures.types";

export type HomeDriveUrbanFixtureCollisionKind =
  | "street-light"
  | "traffic-light";

export type HomeDriveUrbanFixtureCollisionImpact = Readonly<{
  fixtureId: string;
  fixtureKind: HomeDriveUrbanFixtureCollisionKind;
  position: HomeDriveVector2;
  normalFromFixtureToPlayer: HomeDriveVector2;

  /**
   * Direção horizontal da queda.
   * Deve seguir o vetor de deslocamento do carro no frame do impacto,
   * para o poste/semáforo tombar para frente, não para o lado oposto
   * calculado apenas pela normal da colisão.
   */
  fallDirection: HomeDriveVector2;

  /**
   * Alias visual mantido para compatibilidade com renderizações antigas.
   * No estado novo, aponta para o mesmo vetor de fallDirection.
   */
  leanDirection: HomeDriveVector2;

  /** Ângulo final da queda em radianos. */
  leanRad: number;

  /** Torção lateral pequena adicionada durante a queda. */
  twistRad: number;

  /** Duração da animação de tombamento até o repouso final. */
  fallDurationSeconds: number;
  severity: number;
  impulse: number;
  relativeSpeedMps: number;
  struckAtSeconds: number;
}>;

export type HomeDriveUrbanFixtureCollisionRuntimeState = Readonly<{
  serial: number;
  impactedFixtureIds: readonly string[];
  impactsByFixtureId: Readonly<
    Record<string, HomeDriveUrbanFixtureCollisionImpact>
  >;
}>;

export type HomeDriveUrbanFixtureCollisionEvent = Readonly<{
  id: string;
  fixtureId: string;
  fixtureKind: HomeDriveUrbanFixtureCollisionKind;
  position: HomeDriveVector2;
  normalFromFixtureToPlayer: HomeDriveVector2;

  /**
   * Direção horizontal da queda.
   * Deve seguir o vetor de deslocamento do carro no frame do impacto,
   * para o poste/semáforo tombar para frente, não para o lado oposto
   * calculado apenas pela normal da colisão.
   */
  fallDirection: HomeDriveVector2;

  /**
   * Alias visual mantido para compatibilidade com renderizações antigas.
   * No estado novo, aponta para o mesmo vetor de fallDirection.
   */
  leanDirection: HomeDriveVector2;

  /** Ângulo final da queda em radianos. */
  leanRad: number;

  /** Torção lateral pequena adicionada durante a queda. */
  twistRad: number;

  /** Duração da animação de tombamento até o repouso final. */
  fallDurationSeconds: number;
  severity: number;
  impulse: number;
  relativeSpeedMps: number;
  occurredAtSeconds: number;
}>;

export type HomeDriveUrbanFixtureCollisionOptions = Readonly<{
  enabled?: boolean;
  playerRadiusMeters?: number;
  streetLightRadiusMeters?: number;
  trafficLightRadiusMeters?: number;
  minImpactSpeedMps?: number;
  maxCandidateRadiusMeters?: number;
  maxImpactsPerStep?: number;
  maxTrackedImpacts?: number;
  brutality?: number;
  playerPushMultiplier?: number;
  reverseKickMultiplier?: number;
  maxReverseKickMps?: number;
  streetLightLeanMultiplier?: number;
  trafficLightLeanMultiplier?: number;
}>;

export type HomeDriveUrbanFixtureCollisionResolution = Readonly<{
  car: HomeDriveCarState;
  urbanFixtureCollisions: HomeDriveUrbanFixtureCollisionRuntimeState;
  impact: HomeDriveRuntimeImpactState | null;
  events: readonly HomeDriveUrbanFixtureCollisionEvent[];
}>;

export type HomeDriveUrbanFixtureCollisionFixture =
  | Readonly<{
      kind: "street-light";
      fixture: HomeDriveUrbanStreetLight;
    }>
  | Readonly<{
      kind: "traffic-light";
      fixture: HomeDriveUrbanTrafficLight;
    }>;
