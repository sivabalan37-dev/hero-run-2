# HERO RUN: TIME-TRAVEL ADVENTURE

**Engine:** Three.js 0.187.0 · JavaScript ES modules · Vite  
**Unity:** Not used by the runtime or build.

This branch begins the conversion of Hero Run into the approved 3D side-scrolling platform adventure. The older endless-runner implementation remains under `src/game/` for reference; the current browser entry point now loads the new adventure modules under `src/adventure/`.

## Implemented first-level slice (browser playtesting pending)

- Sunny Neighborhood level 1 scene with a side camera and procedural low-poly scenery.
- Shin procedural hero with walk animation.
- Fixed 60 Hz AABB movement, gravity, jumping, coyote-time and jump buffering.
- Keyboard and multitouch movement, jump, Toy Star projectile and Star Burst attacks.
- Robo Bug patrol, alert, chase and timed attack states; pooled projectiles support damage and defeat.
- Collectible coins, one heart, a Time Shard, two patrolling Robo Bugs, a checkpoint and a portal exit.
- Local checkpoint save with version checking and safe fallback for unavailable or invalid storage.
- Responsive HUD/menu, pause/resume, basic level-complete and game-over flows.
- WebGL 2 renderer and a same-origin service-worker cache for the production app shell.

## Controls

- Move: `A/D` or `←/→`
- Jump: `Space`, `W` or `↑`
- Toy Star: `J`  
Star Burst: `K` (7-shot spread, 4.2-second cooldown)
- Pause: top-right pause button

On touch devices, use the on-screen left/right, jump and attack controls. Multiple pointers can control different buttons simultaneously.

## Run locally

A branch CI workflow runs the unit tests and Vite production build on pushes to this development branch.

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm test
npm run build
npm run dev
```

## Validation status

The branch CI currently reports **15/15 unit tests passing**, a successful Vite production build and the PWA service worker and manifest present in the build output. Automated checks do not replace browser playtesting: WebGL rendering, touch interaction, installed-PWA offline startup and Android-device behavior are still **not tested**. The build currently emits a non-blocking bundle-size warning (about 558 KB minified, 141 KB gzip).

## Planned campaign work

The approved campaign contains five worlds, 40 levels, three playable heroes (Shin, Nobi and Benji), six enemy types and five bosses. These are **not yet implemented**. This branch is being built in tested vertical slices, starting with the first level. Capacitor packaging and physical-device verification are also pending.

See [the feature specification](docs/TIME_TRAVEL_ADVENTURE_SPEC.md) and [implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).
