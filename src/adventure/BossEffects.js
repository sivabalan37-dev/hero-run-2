const COLORS = Object.freeze({
  'ground-slam': '#ff9957',
  'gear-dash': '#ffe36e',
  'vine-sweep': '#8ee68b',
  'pulse-blast': '#7be9ff',
  'time-wave': '#d7a0ff',
});

/** Attack-specific visual envelope for the five campaign bosses. */
export function getBossAttackVisualState(boss, elapsed = 0) {
  const type = boss.attackProfile?.type || boss.attackType || 'close-strike';
  const mode = boss.bossMode || 'approach';
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  const color = COLORS[type] || '#fff15e';
  const pulse = 0.5 + 0.5 * Math.sin(t * 18);

  if (mode === 'telegraph') {
    return {
      visible: true, color, opacity: 0.2 + pulse * 0.24,
      scaleX: 0.72 + pulse * 0.16, scaleY: 0.72 + pulse * 0.16,
      rotation: type === 'gear-dash' ? -0.12 : type === 'vine-sweep' ? -0.32 : 0,
      lift: 0,
    };
  }
  if (mode === 'strike') {
    const attacks = {
      'ground-slam': [1.9, 0.58, 0, -0.3],
      'gear-dash': [2.35, 0.7, -0.12, 0.15],
      'vine-sweep': [1.55, 1.05, -0.75, 0.25],
      'pulse-blast': [1.75, 1.75, 0, 0.45],
      'time-wave': [2.25, 0.52, 0, 0.1],
    };
    const shape = attacks[type] || [1.35, 1.1, 0, 0];
    return {
      visible: true, color, opacity: 0.92,
      scaleX: shape[0], scaleY: shape[1],
      rotation: shape[2], lift: shape[3],
    };
  }
  if (mode === 'recover') {
    return {
      visible: true, color, opacity: 0.18,
      scaleX: 1.25, scaleY: type === 'pulse-blast' ? 1.25 : 0.72,
      rotation: 0, lift: 0.05,
    };
  }
  return {
    visible: false, color, opacity: 0,
    scaleX: 1, scaleY: 1, rotation: 0, lift: 0,
  };
}
