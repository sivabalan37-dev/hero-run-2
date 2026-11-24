import { ACHIEVEMENTS, getAchievementProgress } from './Achievements.js';
import { createProgressState } from './CampaignProgress.js';

export function getTitleRewards(progress) {
  const status = new Map(getAchievementProgress(progress).map(item => [item.id, item]));
  return ACHIEVEMENTS.map(item => ({
    id: item.id,
    title: item.reward,
    achievementTitle: item.title,
    unlocked: Boolean(status.get(item.id)?.unlocked),
  }));
}

export function getEquippedTitle(progress) {
  const equippedId = progress?.equippedTitle;
  if (!equippedId) return null;
  return getTitleRewards(progress).find(item => item.id === equippedId && item.unlocked) || null;
}

/** Equip only earned titles. Passing null clears the current title. */
export function selectAchievementTitle(progress, achievementId) {
  const safe = createProgressState(progress);
  if (achievementId === null) return createProgressState({ ...safe, equippedTitle: null });
  const reward = getTitleRewards(safe).find(item => item.id === achievementId);
  if (!reward?.unlocked) return null;
  return createProgressState({ ...safe, equippedTitle: reward.id });
}
