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
- Three distinct playable Sunny Neighborhood stages, levels 1–3, with separate platform layouts, dusk lighting in level 3, collectibles, checkpoints, portal exits and increasing Robo Bug pressure.
- 40-level, five-world campaign catalog with boss/world boundaries matching the product specification. Levels 1–3 are currently playable; level 4 and later stages are not yet built.
- Versioned campaign save for completed levels, selected character and total coins; malformed save data is rejected before writing.
- Per-level checkpoint save and safe fallback if storage is unavailable/corrupt.
- HUD, menu, pause/resume, character controls, basic damage/respawn and level-completion progression.
- Production PWA manifest and same-origin service-worker cache.
- CI workflow for Node tests, production build and PWA output checks.

## Automated validation

Latest completed validation run:
- **PASS:** 42 of 42 Node unit tests, including Benji form abilities, character-specific physics tuning, campaign progression and all three Sunny Neighborhood stage layouts.
- **PASS:** Vite production build.
- **PASS:** service worker and manifest copied into the production output.
- **Verified run:** [GitHub Actions · run 45039802137](https://github.com/sivabalan37-dev/hero-run-2/actions/runs/45039802137).

The production build may emit a non-blocking bundle-size warning.

## Not yet tested

- Actual interactive WebGL gameplay in desktop or mobile browsers.
- Touch controls and landscape behavior on a physical phone.
- Offline restart after installing/loading the PWA.
- Mobile performance, draw-call/triangle budgets and sustained frame rate.
- Capacitor Android build, APK installation and physical-device testing.
- Full Nobi propeller flight, advanced Gadget Vision feedback and further Benji ability balancing/effects.

## Remaining implementation

- Sunny Neighborhood levels 4–8 and School Playground levels 9–16, followed by the remaining three worlds (levels 17–40).
- Remaining enemy families, advanced enemy AI and five boss encounters.
- Full combat feedback, effects/audio, checkpoints and three-star level ratings.
- Nobi's complete aerial kit; Benji ability balancing and visual effects.
- Full achievements, settings, leaderboard, tutorial, cinematics/dialogue and final victory flow.
- IndexedDB fallback/backup, Capacitor configuration and verified Android release.
- Browser/device acceptance tests and mobile performance profiling.

The old endless-runner modules remain under `src/game/` for reference. They are not loaded by the new browser entry point. No changes have been merged into `main`.
