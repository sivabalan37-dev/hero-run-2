import { getAchievementProgress } from './Achievements.js';

/** Achievement titles are earned from campaign milestones, not purchased. */
export function getTitleOptions(progress) {
  return getAchievementProgress(progress).map(achievement => ({
    id: achievement.id,
    name: achievement.reward,
    achievement: achievement.title,
    unlocked: achievement.unlocked,
  }));
}

/** Returns the equipped title only while its achievement remains earned. */
export function getEquippedTitle(progress) {
  if (!progress?.equippedTitle) return null;
  return getTitleOptions(progress).find(title =>
    title.id === progress.equippedTitle && title.unlocked
  )?.name || null;
}

/** Returns null for unknown or locked titles; pass null to unequip. */
export function selectTitle(progress, titleId) {
  if (titleId !== null && !getTitleOptions(progress).some(title =>
    title.id === titleId && title.unlocked
  )) return null;
  return { ...progress, equippedTitle: titleId };
}
