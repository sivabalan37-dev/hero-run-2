/** Pure transition timing for Benji's four selectable forms. */
export function getBenjiFormTransitionVisualState(elapsed = 0, duration = 0.56) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0.56;
  const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const progress = Math.min(1, time / safeDuration);
  const envelope = Math.sin(Math.PI * progress);
  return {
    progress,
    active: progress < 1,
    pulse: envelope * 0.12,
    ringScale: 0.55 + progress * 1.65,
    ringOpacity: envelope * 0.78,
    auraOpacity: 0.3 + envelope * 0.42,
  };
}
