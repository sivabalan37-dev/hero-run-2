import campaign from '../data/levels-8-40.json' with { type: 'json' };

/** Immutable campaign configuration loaded from the external JSON data file. */
export const CAMPAIGN_LEVELS = Object.freeze(campaign.levels.map(level => Object.freeze({
  ...level,
  obstacles: Object.freeze([...level.obstacles]),
  boss: level.boss ? Object.freeze({ ...level.boss, attacks: Object.freeze([...level.boss.attacks]) }) : null,
  completion_reward: Object.freeze({ ...level.completion_reward, unlock: level.completion_reward.unlock ? Object.freeze([...level.completion_reward.unlock]) : undefined }),
})));

export const CAMPAIGN_RULES = Object.freeze(campaign.generationRules);

export function getCampaignLevel(levelNumber) {
  if (!Number.isInteger(levelNumber)) return null;
  return CAMPAIGN_LEVELS.find(level => level.id === levelNumber) ?? null;
}

/** Level 8 is the campaign entry point; each later level requires its predecessor. */
export function isCampaignLevelUnlocked(levelNumber, completedLevels = []) {
  if (!Number.isInteger(levelNumber) || levelNumber < 8 || levelNumber > 40) return false;
  if (levelNumber === 8) return true;
  const completed = new Set(completedLevels);
  return completed.has(levelNumber - 1);
}

/** Checkpoints are placed at successive quarter-distance marks, up to the configured count. */
export function getCampaignCheckpointDistances(levelNumber) {
  const level = getCampaignLevel(levelNumber);
  if (!level) return [];
  return Array.from({ length: level.checkpoints }, (_, index) => Math.round(level.length * (index + 1) / 4));
}

export function getCampaignStarRating({ health = 0, coins = 0, gems = 0, levelNumber } = {}) {
  const level = getCampaignLevel(levelNumber);
  if (!level || health < 1) return 0;
  const coinRatio = Math.min(1, Math.max(0, coins) / level.coins);
  const gemRatio = Math.min(1, Math.max(0, gems) / level.gems);
  if (coinRatio >= 0.9 && gemRatio >= 1 && health >= 2) return 3;
  if (coinRatio >= 0.6 || gemRatio >= 0.5) return 2;
  return 1;
}

export function getCampaignProgress(distance, levelNumber) {
  const level = getCampaignLevel(levelNumber);
  if (!level) return 0;
  return Math.max(0, Math.min(1, Number(distance) / level.length || 0));
}
