const COLORS = Object.freeze({
  idle: '#ff766b',
  alert: '#ffad55',
  contact: '#fff15e',
  charge: '#ffffff',
  bossReady: '#75f0c0',
});

/**
 * Pure, allocation-light visual state for enemy and boss animation.
 * elapsed is level-local seconds, so effects remain deterministic in tests.
 */
export function getEnemyVisualState(enemy, elapsed = 0) {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  const boss = Boolean(enemy.isBoss);
  const mode = boss ? enemy.bossMode : enemy.state;
  const warning = boss
    ? enemy.attackProfile?.warningColor || '#fff15e'
    : enemy.warningColor || '#fff15e';

  const baseScale = boss ? 1.65 : 1;
  let bodyScaleX = baseScale;
  let bodyScaleY = baseScale;
  let rotationZ = 0;
  let bob = 0;
  let ringVisible = false;
  let ringScale = 0.8;
  let ringOpacity = 0;
  let ringColor = COLORS.idle;

  if (mode === 'telegraph') {
    const pulse = 0.5 + 0.5 * Math.sin(t * (boss ? 18 : 22));
    bodyScaleX = baseScale * (1 + pulse * (boss ? 0.035 : 0.06));
    bodyScaleY = baseScale * (1 + pulse * (boss ? 0.12 : 0.1));
    rotationZ = Math.sin(t * 12) * (boss ? 0.035 : 0.07);
    ringVisible = true;
    ringScale = 0.9 + pulse * 0.5;
    ringOpacity = 0.35 + pulse * 0.55;
    ringColor = warning;
  } else if (mode === 'charge') {
    bodyScaleX = baseScale * 1.18;
    bodyScaleY = baseScale * 0.78;
    rotationZ = -0.22;
    ringVisible = true;
    ringScale = 1.25 + 0.08 * Math.sin(t * 36);
    ringOpacity = 0.72;
    ringColor = COLORS.charge;
  } else if (mode === 'strike' || mode === 'attack') {
    bodyScaleX = baseScale * 1.22;
    bodyScaleY = baseScale * 0.72;
    rotationZ = -0.12;
    ringVisible = true;
    ringScale = boss ? 1.55 : 1.25;
    ringOpacity = 0.9;
    ringColor = COLORS.contact;
  } else if (mode === 'recover') {
    bodyScaleX = baseScale * 0.92;
    bodyScaleY = baseScale * (1.08 + Math.sin(t * 15) * 0.035);
    ringVisible = boss;
    ringScale = 1.35;
    ringOpacity = 0.18;
    ringColor = COLORS.bossReady;
  } else if (mode === 'chase' || mode === 'approach') {
    bodyScaleX = baseScale * 1.04;
    bodyScaleY = baseScale * (0.96 + Math.sin(t * 13) * 0.035);
    rotationZ = -0.045;
    ringColor = COLORS.alert;
  } else {
    bob = Math.sin(t * 4.5) * (boss ? 0.025 : 0.045);
    bodyScaleY = baseScale * (1 + Math.sin(t * 9) * (boss ? 0.018 : 0.035));
    ringColor = COLORS.idle;
  }

  return {
    bodyScaleX,
    bodyScaleY,
    rotationZ,
    bob,
    ringVisible,
    ringScale,
    ringOpacity,
    ringColor,
  };
}
