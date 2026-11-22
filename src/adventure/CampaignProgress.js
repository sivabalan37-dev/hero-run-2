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

function nextSequentialLevel(completedLevels) {
  const completed = new Set(completedLevels);
  let next = 1;
  while (completed.has(next) && next <= CAMPAIGN_LEVEL_COUNT) next++;
  return Math.min(next, CAMPAIGN_LEVEL_COUNT);
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
    totalCoins,
    currentLevel: nextSequentialLevel(completedLevels),
    selectedCharacter,
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

/** Returns null when a character is still locked. */
export function selectCharacter(progress, characterId) {
  const safe = createProgressState(progress);
  if (!isCharacterUnlocked(safe, characterId)) return null;
  return { ...safe, selectedCharacter: characterId };
}

export function recordLevelCompletion(progress, levelNumber, coinsEarned = 0) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > CAMPAIGN_LEVEL_COUNT) {
    throw new RangeError('Level number must be between 1 and 40');
  }
  const safe = createProgressState(progress);
  const completedLevels = cleanCompletedLevels([...safe.completedLevels, levelNumber]);
  const validCoins = Number.isFinite(coinsEarned) ? Math.max(0, Math.floor(coinsEarned)) : 0;
  return createProgressState({
    ...safe,
    completedLevels,
    totalCoins: safe.totalCoins + validCoins,
  });
}

export function loadCampaignProgress(storage = globalThis.localStorage, key = 'hero-run-campaign-progress-v1') {
  try {
    return createProgressState(JSON.parse(storage?.getItem(key) || 'null'));
  } catch {
    return createProgressState();
  }
}

export function saveCampaignProgress(progress, storage = globalThis.localStorage, key = 'hero-run-campaign-progress-v1') {
  try {
    const safe = createProgressState(progress);
    storage?.setItem(key, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}
