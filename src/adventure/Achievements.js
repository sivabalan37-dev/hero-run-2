import { getUnlockedCharacters } from './CampaignProgress.js';

export const BOSS_LEVELS = Object.freeze([8, 16, 24, 32, 40]);

export const ACHIEVEMENTS = Object.freeze([
  Object.freeze({ id: 'first_steps', title: 'First Steps', description: 'Clear your first level.', target: 1, metric: 'levels', reward: 'Rookie adventurer' }),
  Object.freeze({ id: 'world_explorer', title: 'World Explorer', description: 'Clear 10 different levels.', target: 10, metric: 'levels', reward: 'Explorer' }),
  Object.freeze({ id: 'campaign_veteran', title: 'Campaign Veteran', description: 'Clear all 40 levels.', target: 40, metric: 'levels', reward: 'Time traveller' }),
  Object.freeze({ id: 'shard_seeker', title: 'Shard Seeker', description: 'Recover Time Shards in 5 different levels.', target: 5, metric: 'shards', reward: 'Shard finder' }),
  Object.freeze({ id: 'star_collector', title: 'Star Collector', description: 'Earn 30 campaign stars.', target: 30, metric: 'stars', reward: 'Star keeper' }),
  Object.freeze({ id: 'perfect_campaign', title: 'Perfect Campaign', description: 'Earn all 120 campaign stars.', target: 120, metric: 'stars', reward: 'Legendary' }),
  Object.freeze({ id: 'coin_pouch', title: 'Coin Pouch', description: 'Collect 25 campaign coins.', target: 25, metric: 'coins', reward: 'Coin collector' }),
  Object.freeze({ id: 'treasure_vault', title: 'Treasure Vault', description: 'Collect 100 campaign coins.', target: 100, metric: 'coins', reward: 'Treasure keeper' }),
  Object.freeze({ id: 'boss_hunter', title: 'Boss Hunter', description: 'Defeat all 5 world bosses.', target: 5, metric: 'bosses', reward: 'Guardian slayer' }),
  Object.freeze({ id: 'full_roster', title: 'Full Roster', description: 'Unlock Shin, Nobi and Benji.', target: 3, metric: 'heroes', reward: 'Team leader' }),
]);

export function getAchievementStats(progress) {
  const completed = Array.isArray(progress?.completedLevels) ? progress.completedLevels : [];
  const starsByLevel = progress?.starsByLevel && typeof progress.starsByLevel === 'object'
    ? progress.starsByLevel
    : {};
  const stars = Object.values(starsByLevel).reduce((total, value) =>
    total + (Number.isInteger(value) ? Math.max(0, Math.min(3, value)) : 0), 0);
  return {
    levels: new Set(completed).size,
    shards: Object.entries(starsByLevel).filter(([level, rating]) =>
      completed.includes(Number(level)) && Number.isInteger(rating) && rating >= 2
    ).length,
    stars,
    coins: Number.isFinite(progress?.totalCoins) ? Math.max(0, Math.floor(progress.totalCoins)) : 0,
    bosses: BOSS_LEVELS.filter(level => completed.includes(level)).length,
    heroes: getUnlockedCharacters(progress).length,
  };
}

export function getAchievementProgress(progress) {
  const stats = getAchievementStats(progress);
  return ACHIEVEMENTS.map(achievement => {
    const value = Math.min(achievement.target, stats[achievement.metric]);
    return {
      ...achievement,
      value,
      unlocked: value >= achievement.target,
      progressText: `${value} / ${achievement.target}`,
    };
  });
}
