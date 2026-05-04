// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficBudgetDiagnostics.ts

import {
  getHomeDriveTrafficPerformanceProfile,
  shouldRenderHomeDriveTrafficVehicle,
  shouldSimulateHomeDriveTrafficVehicle,
} from "./homeDrive.trafficPerformance";
import type { HomeDriveTrafficRuntimeState } from "./homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "./homeDrive.types";

export type HomeDriveTrafficBudgetDiagnostics = Readonly<{
  poolTotal: number;
  fullSimulation: number;
  rendered: number;
  coldPool: number;
}>;

export function getHomeDriveTrafficBudgetDiagnostics({
  traffic,
  runtime,
  isPortrait,
}: Readonly<{
  traffic: HomeDriveTrafficRuntimeState;
  runtime: HomeDriveRuntimeState;
  isPortrait?: boolean;
}>): HomeDriveTrafficBudgetDiagnostics {
  const profile = getHomeDriveTrafficPerformanceProfile(isPortrait ?? true);
  let fullSimulation = 0;
  let rendered = 0;

  for (const vehicle of traffic.vehicles) {
    if (
      shouldSimulateHomeDriveTrafficVehicle(
        vehicle,
        runtime.car.position,
        runtime.car.headingRad,
        runtime.car.speedMps,
        runtime.elapsedSeconds,
        profile,
      )
    ) {
      fullSimulation += 1;
    }

    if (
      shouldRenderHomeDriveTrafficVehicle(
        vehicle,
        runtime.car.position,
        runtime.car.headingRad,
        runtime.car.speedMps,
        profile,
      )
    ) {
      rendered += 1;
    }
  }

  const cappedFullSimulation = Math.min(
    fullSimulation,
    profile.maxFullSimulationVehiclesPerTick,
  );
  const cappedRendered = Math.min(rendered, profile.renderMaxVisibleVehicles);

  return {
    poolTotal: traffic.vehicles.length,
    fullSimulation: cappedFullSimulation,
    rendered: cappedRendered,
    coldPool: Math.max(0, traffic.vehicles.length - cappedFullSimulation),
  };
}
