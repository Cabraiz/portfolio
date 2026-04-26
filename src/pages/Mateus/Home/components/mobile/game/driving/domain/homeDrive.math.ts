export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * clamp(alpha, 0, 1);
}

export function moveTowards(
  current: number,
  target: number,
  maxDelta: number,
): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function kmhToMetersPerSecond(kmh: number): number {
  return kmh / 3.6;
}

export function metersPerSecondToKmh(mps: number): number {
  return mps * 3.6;
}

export function wrapAngleRad(angle: number): number {
  let wrapped = angle;

  while (wrapped > Math.PI) {
    wrapped -= Math.PI * 2;
  }

  while (wrapped < -Math.PI) {
    wrapped += Math.PI * 2;
  }

  return wrapped;
}

export function normalizeDeltaDeg(deltaDeg: number): number {
  let normalized = deltaDeg;

  while (normalized > 180) {
    normalized -= 360;
  }

  while (normalized < -180) {
    normalized += 360;
  }

  return normalized;
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function hashNumber(value: number): number {
  let next = Math.imul(value ^ 0x45d9f3b, 0x45d9f3b);
  next = Math.imul(next ^ (next >>> 16), 0x45d9f3b);
  next = next ^ (next >>> 16);

  return (next >>> 0) / 4294967295;
}

export function hashVector(x: number, z: number, salt = 0): number {
  const mixed =
    Math.imul(x + 374761393, 668265263) ^
    Math.imul(z + 1274126177, 2246822519) ^
    Math.imul(salt + 1442695041, 3266489917);

  return hashNumber(mixed);
}
