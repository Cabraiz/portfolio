// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeRoadNetwork.tsx

import React, { memo, useEffect, useMemo } from "react";
import type { BufferGeometry, Material } from "three";

import { generateHomeDriveRoadSegments } from "../domain/homeDrive.roadGenerator";
import { createMergedQuadGeometry } from "./homeDriveThree.geometry";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import { createHomeDriveThreeRoadRenderModel } from "./homeDriveThree.roadBands";
import type { HomeDriveThreeRoadBand } from "./homeDriveThree.types";

type RoadBandBatch = Readonly<{
  id: string;
  bands: readonly HomeDriveThreeRoadBand[];
  geometry: BufferGeometry | null;
  material: Material;
  renderOrder: number;
}>;

function createRoadBandBatch(
  id: string,
  bands: readonly HomeDriveThreeRoadBand[],
  material: Material,
  renderOrder: number,
): RoadBandBatch {
  return {
    id,
    bands,
    material,
    renderOrder,
    geometry: bands.length > 0 ? createMergedQuadGeometry(bands) : null,
  };
}

function HomeDriveMergedRoadBatch({
  batch,
}: Readonly<{ batch: RoadBandBatch }>) {
  useEffect(() => {
    return () => {
      batch.geometry?.dispose();
    };
  }, [batch.geometry]);

  if (!batch.geometry || batch.bands.length === 0) {
    return null;
  }

  return (
    <mesh
      geometry={batch.geometry}
      material={batch.material}
      renderOrder={batch.renderOrder}
    />
  );
}

function HomeDriveThreeRoadNetwork() {
  const batches = useMemo<readonly RoadBandBatch[]>(() => {
    const roads = generateHomeDriveRoadSegments();
    const renderModel = createHomeDriveThreeRoadRenderModel(roads);

    return [
      createRoadBandBatch(
        "sidewalks",
        renderModel.sidewalks,
        HOME_DRIVE_THREE_MATERIALS.sidewalk,
        2,
      ),
      createRoadBandBatch(
        "asphalt",
        renderModel.asphalt,
        HOME_DRIVE_THREE_MATERIALS.asphalt,
        3,
      ),
      createRoadBandBatch(
        "curbs",
        renderModel.curbs,
        HOME_DRIVE_THREE_MATERIALS.curb,
        5,
      ),
      createRoadBandBatch(
        "lane-marks",
        renderModel.laneMarks,
        HOME_DRIVE_THREE_MATERIALS.laneMark,
        7,
      ),
    ];
  }, []);

  return (
    <group>
      {batches.map((batch) => (
        <HomeDriveMergedRoadBatch key={batch.id} batch={batch} />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeRoadNetwork);
