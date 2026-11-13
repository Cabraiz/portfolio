// src/pages/Mateus/Home/components/mobile/game/driving/three/crosswalks/HomeDriveThreeCrosswalks.tsx

import { memo, useEffect, useMemo } from "react";
import { CylinderGeometry, PlaneGeometry, SphereGeometry } from "three";

import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
	type HomeDriveMutableRef,
	DEFAULT_VISIBLE_RADIUS_METERS,
	DEFAULT_MAX_VISIBLE_CROSSWALKS,
	STRIPE_MATERIALS,
	selectVisibleCrosswalks,
	createCrosswalkStripeInstances,
	createSignalPoleInstances,
	createSignalLightInstances,
	groupStripeInstancesByMaterial,
} from "./HomeDriveThreeCrosswalks.instances";
import {
	HomeDriveThreeCrosswalkStripeBatch,
	HomeDriveThreeCrosswalkPoleBatch,
	HomeDriveThreeCrosswalkSignals,
} from "./HomeDriveThreeCrosswalks.batches";

export type HomeDriveThreeCrosswalksProps = Readonly<{
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleCrosswalks?: number;
  showSignals?: boolean;
}>;

function HomeDriveThreeCrosswalks({
  crosswalksRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleCrosswalks = DEFAULT_MAX_VISIBLE_CROSSWALKS,
  showSignals = true,
}: HomeDriveThreeCrosswalksProps) {
  const visibleCrosswalks = useMemo(() => {
    return selectVisibleCrosswalks(
      crosswalksRef.current.crosswalks,
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleCrosswalks,
    );
  }, [crosswalksRef, maxVisibleCrosswalks, runtimeRef, visibleRadiusMeters]);

  const stripeInstances = useMemo(() => {
    return createCrosswalkStripeInstances(visibleCrosswalks);
  }, [visibleCrosswalks]);

  const stripeBatches = useMemo(() => {
    return groupStripeInstancesByMaterial(stripeInstances);
  }, [stripeInstances]);

  const poleInstances = useMemo(() => {
    return showSignals ? createSignalPoleInstances(visibleCrosswalks) : [];
  }, [showSignals, visibleCrosswalks]);

  const signalInstances = useMemo(() => {
    return showSignals ? createSignalLightInstances(visibleCrosswalks) : [];
  }, [showSignals, visibleCrosswalks]);

  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const poleGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 8), []);
  const signalGeometry = useMemo(() => new SphereGeometry(1, 12, 8), []);

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      poleGeometry.dispose();
      signalGeometry.dispose();
    };
  }, [planeGeometry, poleGeometry, signalGeometry]);

  return (
    <group>
      {Array.from(stripeBatches.entries()).map(([materialKey, instances]) => (
        <HomeDriveThreeCrosswalkStripeBatch
          key={materialKey}
          instances={instances}
          geometry={planeGeometry}
          material={STRIPE_MATERIALS[materialKey]}
        />
      ))}

      {showSignals ? (
        <>
          <HomeDriveThreeCrosswalkPoleBatch
            instances={poleInstances}
            geometry={poleGeometry}
          />
          <HomeDriveThreeCrosswalkSignals
            instances={signalInstances}
            geometry={signalGeometry}
          />
        </>
      ) : null}
    </group>
  );
}

export default memo(HomeDriveThreeCrosswalks);
