export const WORLDS = Object.freeze([
  { name: 'Sunny Neighborhood', firstLevel: 1, lastLevel: 8, boss: 'Neighborhood Guardian' },
  { name: 'School Playground', firstLevel: 9, lastLevel: 16, boss: 'Mechanical Headmaster' },
  { name: 'Forest of Forgotten Toys', firstLevel: 17, lastLevel: 24, boss: 'Toy Forest Guardian' },
  { name: 'Alien Tech City', firstLevel: 25, lastLevel: 32, boss: 'Supreme Machine' },
  { name: 'Time-Travel Castle', firstLevel: 33, lastLevel: 40, boss: 'Ultimate Time Guardian' },
]);

export const PLAYABLE_LEVELS = Object.freeze(Array.from({ length: 40 }, (_, index) => index + 1));

export const LEVEL_NAMES = Object.freeze({
  1: 'First Steps',
  2: 'Market Lane',
  3: 'Evening Crossing',
  4: 'Neighborhood Festival',
  5: 'Riverside Park',
  6: 'Clocktower Climb',
  7: 'Rooftop Relay',
  8: 'Guardian Showdown',
  9: 'First Bell',
  10: 'Classroom Dash',
  11: 'Hallway Hustle',
  12: 'Sports Day Sprint',
  13: 'Library Leap',
  14: 'Science Lab Escape',
  15: 'Playground Pursuit',
  16: 'Headmaster Showdown',
  17: 'Whispering Woods',
  18: 'Toymaker Trail',
  19: 'Mushroom Maze',
  20: 'Wind-Up Bridge',
  21: 'Lost Toy Village',
  22: 'Clockwork Creek',
  23: 'Giant Tree Route',
  24: 'Forest Guardian Showdown',
  25: 'Neon Arrival',
  26: 'Circuit Speedway',
  27: 'Holo-Bridge Run',
  28: 'Power Core Path',
  29: 'Drone District',
  30: 'Magnetic Towers',
  31: 'Reactor Run',
  32: 'Supreme Machine Showdown',
  33: 'Castle Gate',
  34: 'Pendulum Passage',
  35: 'Mirror Hall',
  36: 'Chrono Courtyard',
  37: 'Falling Hourglass',
  38: 'Time Rift Bridge',
  39: 'Throne of Ages',
  40: 'Ultimate Time Showdown',
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
