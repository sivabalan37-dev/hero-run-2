import { createProgressState, CAMPAIGN_LEVEL_COUNT } from './CampaignProgress.js';

export function getCampaignSummary(progress) {
  const safe = createProgressState(progress);
  const totalStars = Object.values(safe.starsByLevel).reduce((sum, stars) => sum + stars, 0);
  const completedBossLevels = [8, 16, 24, 32, 40]
    .filter(level => safe.completedLevels.includes(level)).length;

  return {
    campaignComplete: safe.completedLevels.length === CAMPAIGN_LEVEL_COUNT,
    completedLevels: safe.completedLevels.length,
    totalLevels: CAMPAIGN_LEVEL_COUNT,
    totalStars,
    maxStars: CAMPAIGN_LEVEL_COUNT * 3,
    totalCoins: safe.totalCoins,
    completedBossLevels,
    totalBossLevels: 5,
  };
}
