// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.constants.ts

export const FREE_DRIVE_WORLD_SIZE_METERS = 1000;
export const FREE_DRIVE_WORLD_HALF_SIZE_METERS =
  FREE_DRIVE_WORLD_SIZE_METERS / 2;

export const FREE_DRIVE_START_POSITION_X = 0;
export const FREE_DRIVE_START_POSITION_Z = 0;
export const FREE_DRIVE_START_HEADING_RAD = 0;

export const FREE_DRIVE_WHEEL_BASE_METERS = 2.72;

export const FREE_DRIVE_START_SPEED_MPS = 0.6;

/**
 * 38.8 m/s ≈ 139.7 km/h.
 */
export const FREE_DRIVE_CRUISE_SPEED_MPS = 38.8;

/**
 * 42 m/s ≈ 151.2 km/h.
 */
export const FREE_DRIVE_MAX_SPEED_MPS = 42;

export const FREE_DRIVE_ACCELERATION_MPS2 = 1.58;
export const FREE_DRIVE_BRAKE_MPS2 = 12.2;
export const FREE_DRIVE_NATURAL_DRAG_MPS2 = 0.46;

export const FREE_DRIVE_CORNERING_DRAG_MPS2 = 2.15;
export const FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS = 5.2;
export const FREE_DRIVE_CORNERING_STEER_EXPONENT = 1.92;
export const FREE_DRIVE_CORNERING_SPEED_EXPONENT = 1.18;

/**
 * Multiplicador aplicado quando o carro está voltando de velocidade negativa
 * após colisão.
 *
 * Menor = demora mais para voltar a andar para frente.
 */
export const FREE_DRIVE_REVERSE_RECOVERY_ACCELERATION_MULTIPLIER = 0.12;

/**
 * Multiplicador extra enquanto ainda existe impacto/controlFactor baixo.
 *
 * Menor = recuperação física mais pesada após pancada.
 */
export const FREE_DRIVE_IMPACT_RECOVERY_ACCELERATION_MULTIPLIER = 0.18;

/**
 * Tempo em que a recuperação pós-impacto ainda limita drivetrain.
 *
 * Isso resolve o problema do carro bater, cair velocidade e voltar quase
 * instantaneamente ao cruise.
 */
export const FREE_DRIVE_POST_IMPACT_RECOVERY_SECONDS = 3.6;

/**
 * Janela curta de corte quase total do acelerador após impacto.
 */
export const FREE_DRIVE_POST_IMPACT_FULL_LOCK_SECONDS = 0.46;

/**
 * Menor throttle efetivo durante recuperação.
 */
export const FREE_DRIVE_POST_IMPACT_MIN_THROTTLE_FACTOR = 0.025;

/**
 * Menor aceleração efetiva durante recuperação.
 */
export const FREE_DRIVE_POST_IMPACT_MIN_ACCELERATION_FACTOR = 0.055;

/**
 * Velocidade máxima permitida logo após pancada forte.
 * 3.6 m/s ≈ 13 km/h.
 */
export const FREE_DRIVE_POST_IMPACT_MIN_SPEED_CAP_MPS = 3.6;

/**
 * Velocidade máxima ainda limitada no fim da recuperação.
 * 13.5 m/s ≈ 48.6 km/h.
 */
export const FREE_DRIVE_POST_IMPACT_MAX_SPEED_CAP_MPS = 13.5;

/**
 * Arrasto extra para impedir a velocidade de "colar" de volta no cruise.
 */
export const FREE_DRIVE_POST_IMPACT_DRAG_MPS2 = 3.4;

/**
 * Freio artificial curto pós-impacto.
 */
export const FREE_DRIVE_POST_IMPACT_BRAKE_MPS2 = 7.8;

export const FREE_DRIVE_STEER_SMOOTHING = 7.8;
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
