export const CHARACTER_DEFINITIONS = Object.freeze({
  shin: Object.freeze({ id: 'shin', name: 'Shin', unlockAfter: 0, role: 'Balanced fighter' }),
  nobi: Object.freeze({ id: 'nobi', name: 'Nobi', unlockAfter: 3, role: 'Aerial explorer' }),
  benji: Object.freeze({ id: 'benji', name: 'Benji', unlockAfter: 6, role: 'Transformation fighter' }),
});

export const CAMPAIGN_LEVEL_COUNT = 40;

function cleanCompletedLevels(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(value =>
    Number.isInteger(value) && value >= 1 && value <= CAMPAIGN_LEVEL_COUNT
  ))].sort((a, b) => a - b);
}

function cleanStarsByLevel(values, completedLevels) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {};
  const completed = new Set(completedLevels);
  const result = {};
  for (const [levelText, stars] of Object.entries(values)) {
    const level = Number(levelText);
    if (Number.isInteger(level) && completed.has(level) && Number.isInteger(stars) && stars >= 1 && stars <= 3) {
      result[level] = stars;
    }
  }
  return result;
}

function nextSequentialLevel(completedLevels) {
  const completed = new Set(completedLevels);
  let next = 1;
  while (completed.has(next) && next <= CAMPAIGN_LEVEL_COUNT) next++;
  return Math.min(next, CAMPAIGN_LEVEL_COUNT + 1);
}

export function createProgressState(raw = null) {
  const safe = raw && typeof raw === 'object' && raw.version === 1 ? raw : {};
  const completedLevels = cleanCompletedLevels(safe.completedLevels);
  const totalCoins = Number.isFinite(safe.totalCoins)
    ? Math.max(0, Math.floor(safe.totalCoins))
    : 0;
  const available = getUnlockedCharacters({ completedLevels });
  const selectedCharacter = available.includes(safe.selectedCharacter)
    ? safe.selectedCharacter
    : 'shin';

  return {
    version: 1,
    completedLevels,
    starsByLevel: cleanStarsByLevel(safe.starsByLevel, completedLevels),
    totalCoins,
    currentLevel: nextSequentialLevel(completedLevels),
    selectedCharacter,
    equippedTitle: typeof safe.equippedTitle === 'string' && safe.equippedTitle.length <= 64
      ? safe.equippedTitle
      : null,
  };
}

export function getUnlockedCharacters(progress) {
  const completedCount = cleanCompletedLevels(progress?.completedLevels).length;
  return Object.values(CHARACTER_DEFINITIONS)
    .filter(character => completedCount >= character.unlockAfter)
    .map(character => character.id);
}

export function isCharacterUnlocked(progress, characterId) {
  return getUnlockedCharacters(progress).includes(characterId);
}

/** Completed levels can always be replayed; new levels unlock in campaign order. */
export function isLevelUnlocked(progress, levelNumber) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > CAMPAIGN_LEVEL_COUNT) return false;
  const safe = createProgressState(progress);
  return levelNumber <= safe.currentLevel || safe.completedLevels.includes(levelNumber);
}

/** Returns null when a character is still locked. */
export function selectCharacter(progress, characterId) {
  const safe = createProgressState(progress);
  if (!isCharacterUnlocked(safe, characterId)) return null;
  return { ...safe, selectedCharacter: characterId };
}

/** Records first-time coins and keeps the best star rating when a level is replayed. */
export function recordLevelCompletion(progress, levelNumber, coinsEarned = 0, starsEarned = 1) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > CAMPAIGN_LEVEL_COUNT) {
    throw new RangeError('Level number must be between 1 and 40');
  }
  const safe = createProgressState(progress);
  const wasCompleted = safe.completedLevels.includes(levelNumber);
  const completedLevels = cleanCompletedLevels([...safe.completedLevels, levelNumber]);
  const validCoins = Number.isFinite(coinsEarned) ? Math.max(0, Math.floor(coinsEarned)) : 0;
  const validStars = Number.isInteger(starsEarned) ? Math.max(1, Math.min(3, starsEarned)) : 1;
  const starsByLevel = {
    ...safe.starsByLevel,
    [levelNumber]: Math.max(safe.starsByLevel[levelNumber] || 0, validStars),
  };
  return createProgressState({
    ...safe,
    completedLevels,
    starsByLevel,
    totalCoins: safe.totalCoins + (wasCompleted ? 0 : validCoins),
  });
}

export function loadCampaignProgress(storage, key = 'hero-run-campaign-progress-v1') {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    return createProgressState(JSON.parse(target?.getItem(key) || 'null'));
  } catch {
    return createProgressState();
  }
}

export function saveCampaignProgress(progress, storage, key = 'hero-run-campaign-progress-v1') {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target || typeof target.setItem !== 'function') return false;
    if (!progress || progress.version !== 1 || !Array.isArray(progress.completedLevels)) return false;
    if (!Number.isFinite(progress.totalCoins)) return false;
    const normalizedLevels = cleanCompletedLevels(progress.completedLevels);
    if (normalizedLevels.length !== progress.completedLevels.length) return false;
    const safe = createProgressState(progress);
    if (safe.selectedCharacter !== progress.selectedCharacter) return false;
    if (safe.equippedTitle !== progress.equippedTitle) return false;
    target.setItem(key, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}
