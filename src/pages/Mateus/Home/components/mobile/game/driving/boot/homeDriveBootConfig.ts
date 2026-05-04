// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootConfig.ts

import {
  HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT,
} from "../domain/homeDrive.globalDebugFlags";

export const HOME_DRIVE_BOOT_MIN_VISIBLE_MS = 420;

/**
 * Boot visual real: depois que os dados são gerados, a tela de loading
 * continua por alguns frames enquanto o Canvas instancia prédios, carros,
 * pessoas, materiais e batches. Isso evita liberar o cockpit sobre um
 * primeiro frame vazio.
 */
export const HOME_DRIVE_BOOT_WORLD_READY_MIN_FRAMES = 18;
export const HOME_DRIVE_BOOT_WORLD_READY_MIN_MS = 620;

/**
 * Câmera inicial do Drive.
 * Mantido fora da Scene para o boot conseguir calcular a mesma configuração
 * que será usada no primeiro frame renderizado.
 */
export const INITIAL_CAMERA_HEIGHT_METERS = 2.65;
export const INITIAL_CAMERA_FOV = 66;
export const INITIAL_CAMERA_NEAR = 0.1;
export const INITIAL_CAMERA_FAR = 4200;

// Tráfego dinâmico: limite fixo pedido para reduzir custo de IA/render.
export const TRAFFIC_MAX_VEHICLES_PORTRAIT =
  HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT;
export const TRAFFIC_MAX_VEHICLES_LANDSCAPE =
  HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT;
export const TRAFFIC_DENSITY_PORTRAIT = 1.7;
export const TRAFFIC_DENSITY_LANDSCAPE = 2;
export const TRAFFIC_MIN_ROAD_LENGTH_METERS = 64;

// Carros estacionados: pool alto. O render continua com culling por raio/limite.
export const PARKED_MAX_VEHICLES_PORTRAIT = 3000;
export const PARKED_MAX_VEHICLES_LANDSCAPE = 3000;
export const PARKED_DENSITY_PORTRAIT = 1.35;
export const PARKED_DENSITY_LANDSCAPE = 1.35;
export const PARKED_MAX_ROADS_PORTRAIT = 3000;
export const PARKED_MAX_ROADS_LANDSCAPE = 3000;
export const PARKED_MIN_ROAD_LENGTH_METERS = 68;
export const PARKED_GENERATION_SEED = 6617;

export const PARKED_VISIBLE_RADIUS_PORTRAIT = 540;
export const PARKED_VISIBLE_RADIUS_LANDSCAPE = 660;
export const PARKED_MAX_VISIBLE_PORTRAIT = 96;
export const PARKED_MAX_VISIBLE_LANDSCAPE = 148;

export const BUILDING_COLLISION_MARK_VISIBLE_RADIUS_PORTRAIT = 430;
export const BUILDING_COLLISION_MARK_VISIBLE_RADIUS_LANDSCAPE = 620;
export const BUILDING_COLLISION_MARK_MAX_VISIBLE_PORTRAIT = 64;
export const BUILDING_COLLISION_MARK_MAX_VISIBLE_LANDSCAPE = 112;

export const DAMAGED_BUILDINGS_VISIBLE_RADIUS_PORTRAIT = 560;
export const DAMAGED_BUILDINGS_VISIBLE_RADIUS_LANDSCAPE = 820;
export const DAMAGED_BUILDINGS_MAX_VISIBLE_PORTRAIT = 24;
export const DAMAGED_BUILDINGS_MAX_VISIBLE_LANDSCAPE = 42;

export const BUILDING_RUBBLE_VISIBLE_RADIUS_PORTRAIT = 560;
export const BUILDING_RUBBLE_VISIBLE_RADIUS_LANDSCAPE = 860;
export const BUILDING_RUBBLE_MAX_VISIBLE_PORTRAIT = 420;
export const BUILDING_RUBBLE_MAX_VISIBLE_LANDSCAPE = 900;

export const URBAN_FIXTURES_VISIBLE_RADIUS_PORTRAIT = 680;
export const URBAN_FIXTURES_VISIBLE_RADIUS_LANDSCAPE = 860;
export const URBAN_FIXTURES_MAX_STREET_LIGHTS_PORTRAIT = 180;
export const URBAN_FIXTURES_MAX_STREET_LIGHTS_LANDSCAPE = 260;
export const URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_PORTRAIT = 72;
export const URBAN_FIXTURES_MAX_TRAFFIC_LIGHTS_LANDSCAPE = 112;
export const URBAN_FIXTURES_STREET_LIGHT_DENSITY = 1.18;
export const URBAN_FIXTURES_MAX_STREET_LIGHTS_TOTAL = 1040;
export const URBAN_FIXTURES_MIN_ROAD_LENGTH_METERS = 58;
export const URBAN_FIXTURES_STREET_LIGHT_SEED = 17191;

export const CROSSWALK_MAX_CROSSWALKS_PORTRAIT = 72;
export const CROSSWALK_MAX_CROSSWALKS_LANDSCAPE = 96;
export const CROSSWALK_DENSITY_PORTRAIT = 0.86;
export const CROSSWALK_DENSITY_LANDSCAPE = 1.08;
export const CROSSWALK_MIN_ROAD_LENGTH_METERS = 82;
export const CROSSWALK_GENERATION_SEED = 9841;

export const PEDESTRIAN_GENERATION_SEED = 7429;
export const HOME_DRIVE_THREE_PEDESTRIAN_SCENE_DEBUG = true;
