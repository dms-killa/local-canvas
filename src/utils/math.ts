/**
 * Clamps a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`min (${min}) must be <= max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between two values.
 * t=0 returns a, t=1 returns b.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Maps a value from one range to another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMin === inMax) {
    throw new RangeError("Input range cannot be zero-width (inMin === inMax)");
  }
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Converts degrees to radians.
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
