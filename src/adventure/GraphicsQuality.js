const QUALITY_PIXEL_RATIOS = Object.freeze({
  low: 1,
  medium: 1.5,
  high: 2,
});

export const GRAPHICS_PRESETS = Object.freeze({
  low: Object.freeze({ shadows: false, shadowMapSize: 512, shadowRadius: 2, toneMappingExposure: 1.08 }),
  medium: Object.freeze({ shadows: true, shadowMapSize: 1024, shadowRadius: 3, toneMappingExposure: 1.12 }),
  high: Object.freeze({ shadows: true, shadowMapSize: 2048, shadowRadius: 4, toneMappingExposure: 1.16 }),
});

export function getGraphicsPreset(quality = 'medium') {
  return GRAPHICS_PRESETS[quality] ?? GRAPHICS_PRESETS.medium;
}

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
