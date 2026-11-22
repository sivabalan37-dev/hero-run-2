export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const randomInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
export const randomRange = (min, max) => min + Math.random() * (max - min);