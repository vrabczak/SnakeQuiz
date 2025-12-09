/** Clamp a numeric value between inclusive min and max. */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Return a random integer between min and max inclusive. */
export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
