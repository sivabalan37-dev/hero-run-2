export const WORLDS = Object.freeze([
  { name: 'Sunny Neighborhood', firstLevel: 1, lastLevel: 8, boss: 'Neighborhood Guardian' },
  { name: 'School Playground', firstLevel: 9, lastLevel: 16, boss: 'Mechanical Headmaster' },
  { name: 'Forest of Forgotten Toys', firstLevel: 17, lastLevel: 24, boss: 'Toy Forest Guardian' },
  { name: 'Alien Tech City', firstLevel: 25, lastLevel: 32, boss: 'Supreme Machine' },
  { name: 'Time-Travel Castle', firstLevel: 33, lastLevel: 40, boss: 'Ultimate Time Guardian' },
]);

export const PLAYABLE_LEVELS = Object.freeze([1, 2]);

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
    title: `${world.name} · Level ${levelNumber}`,
    isBossLevel: levelNumber === world.lastLevel,
    boss: levelNumber === world.lastLevel ? world.boss : null,
    playable: PLAYABLE_LEVELS.includes(levelNumber),
  });
}
