// src/pages/Mateus/Home/components/mobile/game/driving/view/speedometer/homeDriveSpeedometer.tokens.ts

export type HomeDriveSpeedometerTick = Readonly<{
  valueKmh: number;
  label: string;
  isDanger?: boolean;
}>;

export const HOME_DRIVE_SPEEDOMETER_MAX_SPEED_KMH = 220;

export const HOME_DRIVE_SPEEDOMETER_MIN_SWEEP_DEG = -132;
export const HOME_DRIVE_SPEEDOMETER_MAX_SWEEP_DEG = 132;

export const HOME_DRIVE_SPEEDOMETER_MAJOR_TICKS: readonly HomeDriveSpeedometerTick[] =
  Object.freeze([
    { valueKmh: 0, label: "0" },
    { valueKmh: 20, label: "20" },
    { valueKmh: 40, label: "40" },
    { valueKmh: 60, label: "60" },
    { valueKmh: 80, label: "80" },
    { valueKmh: 100, label: "100" },
    { valueKmh: 120, label: "120" },
    { valueKmh: 140, label: "140" },
    { valueKmh: 160, label: "160" },
    { valueKmh: 180, label: "180", isDanger: true },
    { valueKmh: 200, label: "200", isDanger: true },
    { valueKmh: 220, label: "220", isDanger: true },
  ]);

export const HOME_DRIVE_SPEEDOMETER_MINOR_TICKS: readonly number[] =
  Object.freeze([
    10,
    30,
    50,
    70,
    90,
    110,
    130,
    150,
    170,
    190,
    210,
  ]);

export const HOME_DRIVE_SPEEDOMETER_DEFAULT_LABEL = "km/h";

export const HOME_DRIVE_SPEEDOMETER_CSS_VARS = Object.freeze({
  needleDeg: "--home-drive-speedometer-needle-deg",
  progress: "--home-drive-speedometer-progress",
});
