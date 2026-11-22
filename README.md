# HERO RUN: TIME-TRAVEL ADVENTURE

**Engine:** Three.js 0.187.0 · JavaScript ES modules · Vite  
**Unity:** Not used by the runtime or build.

The active browser entry point launches the Three.js side-scrolling platform adventure under `src/adventure/`. The older endless-runner modules remain under `src/game/` as reference material and are not loaded by the new entry point.

## Implemented gameplay slice

- Two distinct playable Sunny Neighborhood stages (levels 1 and 2), with a side camera, low-poly scenery, platforms, enemies, checkpoints, collectible coins/hearts, a Time Shard and portal exits.
- Three procedural character models: Shin, Nobi and Benji.
- Shin: Toy Star projectile and seven-shot Star Burst.
- Nobi: held-jump glide while falling and Gadget Vision that reveals a hidden coin.
- Benji: Normal, Blaze, Shock and Titan visual forms, cycled with the transform control.
- Character unlock rules: Nobi after 3 completed levels; Benji after 6 completed levels.
- Character selection with the C key or HERO touch/HUD control; selected character is saved.
- Robo Bug patrol, alert, chase and timed attack states; pooled projectiles and two-hit enemy health.
- Versioned campaign progress saves completed levels, total coins and selected character; invalid data is rejected before writing.
- Fixed 60 Hz AABB platform movement, gravity, jump buffering, coyote time and one-way raised platforms.
- Responsive HUD, pause/resume, level completion and respawn flows.
- WebGL 2 renderer, PWA manifest and same-origin offline app-shell service worker.

## Controls

- Move: `A/D` or `←/→`
- Jump: `Space`, `W` or `↑`
- Toy Star: `J`
- Special: `K` — Shin/Benji Star Burst; Nobi Gadget Vision
- Switch character: `C` or HERO button (after unlock)
- Benji form: `T` or FORM touch control
- Nobi glide: hold jump while falling
- Pause: top-right pause button

Touch controls support independent pointers for simultaneous actions.

## Campaign map

The catalog records the five worlds and all 40 level numbers:
1. Sunny Neighborhood — levels 1–8; Neighborhood Guardian.
2. School Playground — levels 9–16; Mechanical Headmaster.
3. Forest of Forgotten Toys — levels 17–24; Toy Forest Guardian.
4. Alien Tech City — levels 25–32; Supreme Machine.
5. Time-Travel Castle — levels 33–40; Ultimate Time Guardian.

**Playable now:** levels 1 and 2 in Sunny Neighborhood. Levels 3–40 are catalogued but not yet built as playable stages. The School Playground world correctly begins at level 9.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm test
npm run build
npm run dev
```

## Validation status

Latest completed GitHub Actions validation for this implementation slice reports **33/33 unit tests passing**, a successful Vite production build, and the PWA service worker and manifest present in the build output. A new run is triggered for each later branch commit. The production bundle emits a non-blocking chunk-size warning.

Automated checks do not replace browser playtesting. Actual WebGL gameplay, real-device multitouch, offline restart after PWA installation, mobile performance, and Android packaging remain **NOT TESTED**.

See [the feature specification](docs/TIME_TRAVEL_ADVENTURE_SPEC.md), [implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md), and [implementation status](docs/IMPLEMENTATION_STATUS.md).

No changes have been merged into `main`.
