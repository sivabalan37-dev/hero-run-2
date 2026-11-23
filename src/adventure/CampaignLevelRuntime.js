import { getCampaignLevel, getCampaignCheckpointDistances } from './CampaignLevelCatalog.js';

const POWER_UPS = Object.freeze([
  { type: 'health_potion', distanceRatio: 0.34 },
  { type: 'shield', distanceRatio: 0.62 },
  { type: 'speed_boost', distanceRatio: 0.82 },
]);

function seededUnit(seed) {
  let value = (seed * 9301 + 49297) % 233280;
  value = (value * 9301 + 49297) % 233280;
  return value / 233280;
}

/**
 * Builds a deterministic, finite spawn schedule for a campaign level.
 * The renderer/gameplay layer consumes these normalized distance events.
 */
export function createCampaignLevelRuntime(levelNumber) {
  const level = getCampaignLevel(levelNumber);
  if (!level) return null;

  const events = [];
  const hazardCount = Math.max(3, Math.ceil((level.length / 70) * level.obstacleDensity));
  for (let index = 0; index < hazardCount; index++) {
    const ratio = 0.055 + (index + 0.5) * (0.88 / hazardCount);
    events.push({
      type: 'obstacle',
      obstacle: level.obstacles[index % level.obstacles.length],
      distance: Math.round(level.length * ratio),
      lane: Math.floor(seededUnit(level.id * 1000 + index) * 3),
    });
  }

  for (let index = 0; index < level.enemies; index++) {
    const ratio = 0.08 + ((index + 1) / (level.enemies + 1)) * 0.78;
    events.push({
      type: 'enemy',
      distance: Math.round(level.length * ratio),
      lane: Math.floor(seededUnit(level.id * 2000 + index) * 3),
      health: 1 + Math.floor(level.id / 12),
    });
  }

  for (let index = 0; index < level.coins; index++) {
    events.push({
      type: 'coin',
      distance: Math.round(level.length * (0.035 + ((index + 1) / (level.coins + 1)) * 0.91)),
      lane: index % 3,
    });
  }

  for (let index = 0; index < level.gems; index++) {
    events.push({
      type: 'gem',
      distance: Math.round(level.length * (0.12 + ((index + 1) / (level.gems + 1)) * 0.72)),
      lane: (index + 1) % 3,
    });
  }

  for (const powerUp of POWER_UPS) {
    events.push({ type: 'power_up', powerUp: powerUp.type, distance: Math.round(level.length * powerUp.distanceRatio), lane: 1 });
  }

  const checkpoints = getCampaignCheckpointDistances(levelNumber);
  checkpoints.forEach((distance, index) => events.push({ type: 'checkpoint', checkpoint: index + 1, distance }));
  if (level.boss) events.push({ type: 'boss', boss: level.boss, distance: Math.round(level.length * 0.88) });
  events.push({ type: 'finish_portal', distance: level.length });
  events.sort((a, b) => a.distance - b.distance || a.type.localeCompare(b.type));

  return Object.freeze({
    level,
    totalDistance: level.length,
    timeLimitSeconds: level.timerSeconds,
    obstacleDensity: level.obstacleDensity,
    events: Object.freeze(events.map(event => Object.freeze(event))),
    checkpoints: Object.freeze([...checkpoints]),
    targets: Object.freeze({ coins: level.coins, gems: level.gems, enemies: level.enemies }),
  });
}

export function isCampaignRunFailed({ health, distance, elapsedSeconds, levelNumber } = {}) {
  const level = getCampaignLevel(levelNumber);
  if (!level) return true;
  return !(health > 0) || distance < 0 || distance > level.length || elapsedSeconds >= level.timerSeconds;
}

export function isCampaignRunComplete({ health, distance, bossDefeated = true, levelNumber } = {}) {
  const level = getCampaignLevel(levelNumber);
  if (!level || health < 1 || distance < level.length) return false;
  return !level.boss || bossDefeated;
}
