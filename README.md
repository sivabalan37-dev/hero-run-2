# HERO RUN: TIME-TRAVEL ADVENTURE

**Engine:** Three.js 0.187.0 · JavaScript ES modules · Vite  
**Unity:** Not used by the runtime or build.

This branch begins the conversion of Hero Run into the approved 3D side-scrolling platform adventure. The older endless-runner implementation remains under `src/game/` for reference; the current browser entry point now loads the new adventure modules under `src/adventure/`.

## Current playable slice

- Sunny Neighborhood level 1 scene with a side camera and procedural low-poly scenery.
- Shin procedural hero with walk animation.
- Fixed 60 Hz AABB movement, gravity, jumping, coyote-time and jump buffering.
- Keyboard and multitouch movement, jump and attack controls.
- Collectible coins, one heart, a Time Shard, two patrolling Robo Bugs, a checkpoint and a portal exit.
- Local checkpoint save with version checking and safe fallback for unavailable or invalid storage.
- Responsive HUD/menu, pause/resume, basic level-complete and game-over flows.
- WebGL 2 renderer and a same-origin service-worker cache for the production app shell.

## Controls

- Move: `A/D` or `←/→`
- Jump: `Space`, `W` or `↑`
- Attack: `J`
- Pause: top-right pause button

On touch devices, use the on-screen left/right, jump and attack controls. Multiple pointers can control different buttons simultaneously.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm test
npm run build
npm run dev
```

## Planned campaign work

The approved campaign contains five worlds, 40 levels, three playable heroes (Shin, Nobi and Benji), six enemy types and five bosses. These are **not yet implemented**. This branch is being built in tested vertical slices, starting with the first level. Capacitor packaging and physical-device verification are also pending.

See [the feature specification](docs/TIME_TRAVEL_ADVENTURE_SPEC.md) and [implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).
