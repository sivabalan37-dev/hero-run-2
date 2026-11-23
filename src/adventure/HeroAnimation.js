/** Normalized punch pose used by all three heroes. */
export function getAttackPose(blend = 0) {
  const amount = Math.max(0, Math.min(1, Number.isFinite(blend) ? blend : 0));
  return {
    rightArmRotation: amount === 0 ? 0 : -amount * 1.28,
    leftArmRotation: amount * 0.22,
    bodyLean: amount * 0.055,
  };
}
