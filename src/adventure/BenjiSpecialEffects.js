const DURATIONS = Object.freeze({ flame: 0.34, shock: 0.48, stomp: 0.42 });

/** Pure, bounded animation state for Benji's form-specific special effects. */
export function getBenjiSpecialVisualState(ability, elapsed = 0) {
  const duration = DURATIONS[ability];
  if (!duration) return { visible: false, progress: 0, scale: 1, opacity: 0, rotation: 0 };
  const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const progress = Math.min(1, time / duration);
  const fade = 1 - progress;
  if (ability === 'flame') {
    return { visible: progress < 1, progress, scale: 0.55 + progress * 1.05, opacity: fade, rotation: -0.75 + progress * 1.5 };
  }
  if (ability === 'shock') {
    return { visible: progress < 1, progress, scale: 0.45 + progress * 1.8, opacity: fade * 0.85, rotation: progress * 0.45 };
  }
  return { visible: progress < 1, progress, scale: 0.5 + progress * 2.1, opacity: fade * 0.9, rotation: progress * 0.2 };
}
