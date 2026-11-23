/** Deterministic, allocation-free animation values for Nobi's Gadget Vision scan. */
export function getGadgetVisionVisualState(progress) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const fade = 1 - p;
  return {
    innerScale: 0.35 + p * 5.2,
    outerScale: 0.18 + p * 5.8,
    innerOpacity: fade * 0.88,
    outerOpacity: fade * 0.42,
  };
}
