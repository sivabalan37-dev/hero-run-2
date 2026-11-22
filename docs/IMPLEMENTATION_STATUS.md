# Implementation Status

**Project:** HERO RUN: TIME-TRAVEL ADVENTURE  
**Engine:** Three.js 0.187.0  
**Development branch:** `feature/time-travel-adventure-threejs`  
**Updated:** 2026-11-22

## Implemented in this branch

- Three.js WebGL 2 renderer, responsive orthographic side camera and landscape-aware resizing.
- Fixed 60 Hz AABB platform movement, gravity, horizontal bounds, landing/underside collision, one-way raised platforms, coyote time and jump buffering.
- Procedural Shin, Nobi and Benji character models with a shared movement/animation interface.
- Character progression: Shin starts unlocked; Nobi unlocks after 3 distinct completed levels; Benji unlocks after 6.
- Character selection via C / HERO control, with selection persisted in campaign progress.
- Nobi glide while holding jump during a fall; Gadget Vision reveals a hidden collectible.
- Benji's Normal, Blaze, Shock and Titan forms, cycled with T / FORM. Blaze has faster movement and a forward flame strike; Shock has a stronger jump and radial pulse; Titan moves more slowly, performs a grounded stomp and takes 50% less damage.
- Shin Toy Star projectile and seven-shot Star Burst; fixed-capacity pooled projectile entities.
- Robo Bug patrol, alert, chase and cooldown-based attack AI; two-hit enemy health.
- Seven authored Sunny Neighborhood stages, levels 1–7, with separate platform layouts, dusk lighting in level 3, a festival-themed level 4, riverfront park level 5, Clocktower Climb level 6 and Rooftop Relay level 7.
- Levels 8–40 are now playable procedural stages, distributed across School Playground, Forest of Forgotten Toys, Alien Tech City and Time-Travel Castle. Each receives a world-specific palette/landmark set, extended ground route, generated raised platforms, coin route, heart, hidden coin, Time Shard, checkpoint, enemies and exit.
- Five boss-gated stages are implemented at levels 8, 16, 24, 32 and 40. Each boss has a larger visual model, 12 health, an enlarged projectile hitbox and blocks the exit until defeated.
- Full 40-level campaign catalog is playable in the browser game. Levels 1–7 have authored stage layouts; levels 8–40 currently use procedural layouts and world themes. Five boss gates are active at the end of each world.
- Versioned campaign save for completed levels, selected character and total coins; malformed save data is rejected before writing.
- Per-level checkpoint save and safe fallback if storage is unavailable/corrupt.
- HUD, menu, pause/resume, character controls, basic damage/respawn and level-completion progression.
- Production PWA manifest and same-origin service-worker cache.
- CI workflow for Node tests, production build and PWA output checks.

## Automated validation

Latest completed validation run:
- **PASS:** 47 of 47 Node unit tests, including campaign catalog, all 40 stage constructors, all five boss gates, Benji form abilities, character-specific physics tuning and progression.
- **PASS:** Vite production build.
- **PASS:** service worker and manifest copied into the production output.
- **Verified run:** [GitHub Actions · run 45044219040](https://github.com/sivabalan37-dev/hero-run-2/actions/runs/45044219040).

The production build may emit a non-blocking bundle-size warning.

## Not yet tested

- Actual interactive WebGL gameplay in desktop or mobile browsers.
- Touch controls and landscape behavior on a physical phone.
- Offline restart after installing/loading the PWA.
- Mobile performance, draw-call/triangle budgets and sustained frame rate.
- Capacitor Android build, APK installation and physical-device testing.
- Full Nobi propeller flight, advanced Gadget Vision feedback and further Benji ability balancing/effects.

## Remaining implementation

- Hand-authored, individually designed level layouts for levels 8–40; the current versions are procedural variants.
- Remaining enemy families (the current generated campaign uses Robo Bugs); multi-phase boss patterns and boss-specific attacks.
- Full combat feedback, effects/audio, checkpoints and three-star level ratings.
- Nobi's complete aerial kit; Benji ability balancing and visual effects.
- Full achievements, settings, leaderboard, tutorial, cinematics/dialogue and final victory flow.
- IndexedDB fallback/backup, Capacitor configuration and verified Android release.
- Browser/device acceptance tests and mobile performance profiling.

The old endless-runner modules remain under `src/game/` for reference. They are not loaded by the new browser entry point. No changes have been merged into `main`.
