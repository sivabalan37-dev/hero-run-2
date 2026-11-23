const COLORS = Object.freeze({
  'ground-slam': '#ff9957',
  'gear-dash': '#ffe36e',
  'vine-sweep': '#8ee68b',
  'pulse-blast': '#7be9ff',
  'time-wave': '#d7a0ff',
});

const STRIKE_SHAPES = Object.freeze({
  'ground-slam': Object.freeze([1.9, 0.58, 0, -0.3]),
  'gear-dash': Object.freeze([2.35, 0.7, -0.12, 0.15]),
  'vine-sweep': Object.freeze([1.55, 1.05, -0.75, 0.25]),
  'pulse-blast': Object.freeze([1.75, 1.75, 0, 0.45]),
  'time-wave': Object.freeze([2.25, 0.52, 0, 0.1]),
});

/** Deterministic attack-specific animation envelope for the five campaign bosses. */
export function getBossAttackVisualState(boss, elapsed = 0) {
  const type = boss.attackProfile?.type || boss.attackType || 'close-strike';
  const mode = boss.bossMode || 'approach';
  const t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const color = COLORS[type] || '#fff15e';
  const pulse = 0.5 + 0.5 * Math.sin(t * 18);

  if (mode === 'telegraph') {
    const anticipation = 0.72 + pulse * 0.16;
    return {
      visible: true, color, opacity: 0.2 + pulse * 0.24,
      scaleX: anticipation, scaleY: anticipation,
      rotation: type === 'gear-dash' ? -0.12 : type === 'vine-sweep' ? -0.32 : 0,
      lift: 0,
    };
  }

  if (mode === 'strike') {
    const shape = STRIKE_SHAPES[type] || [1.35, 1.1, 0, 0];
    const wave = 0.5 + 0.5 * Math.sin(t * 24);
    const impact = Math.sin(t * 30);
    let scaleX = shape[0];
    let scaleY = shape[1];
    let rotation = shape[2];
    let lift = shape[3];

    // Each boss has its own readable attack signature rather than a shared static flash.
    if (type === 'ground-slam') {
      scaleX *= 0.82 + wave * 0.42;
      scaleY *= 0.9 + wave * 0.12;
    } else if (type === 'gear-dash') {
      scaleX *= 0.92 + wave * 0.28;
      rotation += impact * 0.035;
    } else if (type === 'vine-sweep') {
      rotation += Math.sin(t * 14) * 0.22;
      scaleY *= 0.9 + wave * 0.18;
    } else if (type === 'pulse-blast') {
      scaleX *= 0.88 + wave * 0.34;
      scaleY *= 0.88 + wave * 0.34;
      lift += wave * 0.12;
    } else if (type === 'time-wave') {
      scaleX *= 0.78 + wave * 0.48;
      scaleY *= 0.94 + wave * 0.08;
      lift += wave * 0.08;
    }

    return {
      visible: true, color, opacity: 0.72 + wave * 0.2,
      scaleX, scaleY, rotation, lift,
    };
  }

  if (mode === 'recover') {
    const fade = 0.12 + (1 - pulse) * 0.12;
    return {
      visible: true, color, opacity: fade,
      scaleX: 1.25 + pulse * 0.12,
      scaleY: type === 'pulse-blast' ? 1.25 + pulse * 0.12 : 0.72,
      rotation: type === 'vine-sweep' ? Math.sin(t * 8) * 0.08 : 0,
      lift: 0.05,
    };
  }

  return {
    visible: false, color, opacity: 0,
    scaleX: 1, scaleY: 1, rotation: 0, lift: 0,
  };
}
