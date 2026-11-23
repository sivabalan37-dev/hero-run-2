const DEFAULT_BOSS_NAME = 'WORLD GUARDIAN';

export function getBossHudModel(boss) {
  if (!boss || boss.isBoss !== true) return null;

  const maxHealth = Number.isFinite(boss.maxHealth) && boss.maxHealth > 0 ? boss.maxHealth : 1;
  const health = Number.isFinite(boss.health) ? Math.max(0, Math.min(maxHealth, boss.health)) : 0;
  const defeated = boss.alive === false || health <= 0;
  const mode = typeof boss.bossMode === 'string' ? boss.bossMode : 'approach';
  const warning = !defeated && (mode === 'telegraph' || mode === 'strike');
  const phase = Number.isFinite(boss.phase) ? Math.max(1, Math.min(3, Math.floor(boss.phase))) : 1;
  const name = typeof boss.bossName === 'string' && boss.bossName.trim()
    ? boss.bossName.trim()
    : DEFAULT_BOSS_NAME;

  let statusText = '';
  if (defeated) statusText = 'DEFEATED · PORTAL OPEN';
  else if (mode === 'telegraph') statusText = 'ATTACK INCOMING · JUMP OR MOVE!';
  else if (mode === 'strike') statusText = 'BOSS STRIKE!';

  return Object.freeze({
    name,
    phase,
    phaseText: `PHASE ${phase}`,
    health,
    maxHealth,
    healthPercent: Math.round((health / maxHealth) * 100),
    healthText: `${Math.ceil(health)} / ${Math.ceil(maxHealth)}`,
    warning,
    defeated,
    statusText,
  });
}
