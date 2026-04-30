// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.constants.ts

export const FREE_DRIVE_WORLD_SIZE_METERS = 1000;
export const FREE_DRIVE_WORLD_HALF_SIZE_METERS =
  FREE_DRIVE_WORLD_SIZE_METERS / 2;

export const FREE_DRIVE_START_POSITION_X = 0;
export const FREE_DRIVE_START_POSITION_Z = 0;
export const FREE_DRIVE_START_HEADING_RAD = 0;

export const FREE_DRIVE_WHEEL_BASE_METERS = 2.72;

/**
 * Começa quase parado. A sensação de velocidade vem da aceleração progressiva,
 * câmera, áudio e velocímetro, não de nascer já embalado.
 */
export const FREE_DRIVE_START_SPEED_MPS = 0.6;

/**
 * Velocidade alvo com throttle cheio.
 *
 * 38.8 m/s ≈ 139.7 km/h.
 */
export const FREE_DRIVE_CRUISE_SPEED_MPS = 38.8;

/**
 * Teto físico absoluto.
 *
 * 42 m/s ≈ 151.2 km/h.
 */
export const FREE_DRIVE_MAX_SPEED_MPS = 42;

/**
 * Aceleração baixa para o carro ganhar velocidade aos poucos.
 */
export const FREE_DRIVE_ACCELERATION_MPS2 = 1.58;

/**
 * Freio forte, mas sem parecer arcade demais.
 */
export const FREE_DRIVE_BRAKE_MPS2 = 12.2;

/**
 * Arrasto natural baixo para o carro manter velocidade quando embalado.
 */
export const FREE_DRIVE_NATURAL_DRAG_MPS2 = 0.46;

/**
 * Perda de velocidade em curva.
 */
export const FREE_DRIVE_CORNERING_DRAG_MPS2 = 2.15;

/**
 * Mínimo preservado quando já está em movimento e entra em curva.
 *
 * 5.2 m/s ≈ 18.7 km/h.
 */
export const FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS = 5.2;

/**
 * Quanto maior, mais a perda aparece só quando esterça bastante.
 */
export const FREE_DRIVE_CORNERING_STEER_EXPONENT = 1.92;

/**
 * Quanto maior, mais a perda pesa em velocidade alta.
 */
export const FREE_DRIVE_CORNERING_SPEED_EXPONENT = 1.18;

/**
 * Suavização do esterço. Valor menor deixa mais pesado/progressivo.
 */
export const FREE_DRIVE_STEER_SMOOTHING = 7.8;

/**
 * Limite físico de esterço. Reduzido levemente para evitar curvas impossíveis
 * em velocidade alta.
 */
export const FREE_DRIVE_MAX_STEER_ANGLE_DEG = 33;

export const FREE_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG = 118;
export const FREE_DRIVE_LOOP_MAX_DELTA_SECONDS = 1 / 24;

export const FREE_DRIVE_TERRAIN_CELL_SIZE_METERS = 52;
export const FREE_DRIVE_TERRAIN_OBJECT_RADIUS_METERS = 430;
export const FREE_DRIVE_TERRAIN_TILE_SIZE_METERS = 100;

export const FREE_DRIVE_CAMERA_NEAR_METERS = 3.5;
export const FREE_DRIVE_CAMERA_FAR_METERS = 390;
export const FREE_DRIVE_CAMERA_HEIGHT_METERS = 1.38;
export const FREE_DRIVE_CAMERA_FOV_STRENGTH = 0.92;

export const FREE_DRIVE_STEERING_WHEEL_IMAGE_SRC =
  "/images/home-drive/free-drive-steering-wheel.png";
