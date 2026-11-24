const QUALITY_PIXEL_RATIOS = Object.freeze({
  low: 1,
  medium: 1.5,
  high: 2,
});

export function getRenderPixelRatio({
  quality = 'medium',
  devicePixelRatio = 1,
  coarsePointer = false,
  deviceMemory = null,
  hardwareConcurrency = null,
} = {}) {
  const requestedCap = QUALITY_PIXEL_RATIOS[quality] ?? QUALITY_PIXEL_RATIOS.medium;
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
  const constrainedDevice =
    (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 4) ||
    (Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= 4);

  let deviceCap = requestedCap;
  if (quality !== 'low' && (coarsePointer || constrainedDevice)) {
    deviceCap = Math.min(deviceCap, quality === 'high' ? 1.5 : 1.25);
  }

  return Math.max(1, Math.min(safeDpr, deviceCap));
}
