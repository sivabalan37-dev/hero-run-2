export const WORLDS = Object.freeze([
  { name: 'Sunny Neighborhood', firstLevel: 1, lastLevel: 8, boss: 'Neighborhood Guardian' },
  { name: 'School Playground', firstLevel: 9, lastLevel: 16, boss: 'Mechanical Headmaster' },
  { name: 'Forest of Forgotten Toys', firstLevel: 17, lastLevel: 24, boss: 'Toy Forest Guardian' },
  { name: 'Alien Tech City', firstLevel: 25, lastLevel: 32, boss: 'Supreme Machine' },
  { name: 'Time-Travel Castle', firstLevel: 33, lastLevel: 40, boss: 'Ultimate Time Guardian' },
]);

export const PLAYABLE_LEVELS = Object.freeze([1, 2, 3, 4, 5, 6, 7]);

export const LEVEL_NAMES = Object.freeze({
  1: 'First Steps',
  2: 'Market Lane',
  3: 'Evening Crossing',
  4: 'Neighborhood Festival',
  5: 'Riverside Park',
  6: 'Clocktower Climb',
  7: 'Rooftop Relay',
});

export function getLevelInfo(levelNumber) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 40) {
    throw new RangeError('Level number must be between 1 and 40');
  }
  const world = WORLDS.find(item =>
    levelNumber >= item.firstLevel && levelNumber <= item.lastLevel
  );
  return Object.freeze({
    number: levelNumber,
    world: world.name,
    title: `${world.name} · ${LEVEL_NAMES[levelNumber] || `Level ${levelNumber}`}`,
    isBossLevel: levelNumber === world.lastLevel,
    boss: levelNumber === world.lastLevel ? world.boss : null,
    playable: PLAYABLE_LEVELS.includes(levelNumber),
  });
}
