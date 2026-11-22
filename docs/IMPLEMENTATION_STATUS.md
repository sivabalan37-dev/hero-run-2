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
- Benji's Normal, Blaze, Shock and Titan visual forms, cycled with T / FORM control. Form-specific gameplay modifiers are still pending.
- Shin Toy Star projectile and seven-shot Star Burst; fixed-capacity pooled projectile entities.
- Robo Bug patrol, alert, chase and cooldown-based attack AI; two-hit enemy health.
- Two distinct playable Sunny Neighborhood stages, levels 1 and 2, with platforms, collectibles, enemies, checkpoints and portal exits.
- 40-level, five-world campaign catalog with boss/world boundaries matching the product specification. Only levels 1 and 2 are currently playable; School Playground starts at level 9.
- Versioned campaign save for completed levels, selected character and total coins; malformed save data is rejected before writing.
- Per-level checkpoint save and safe fallback if storage is unavailable/corrupt.
- HUD, menu, pause/resume, character controls, basic damage/respawn and level-completion progression.
- Production PWA manifest and same-origin service-worker cache.
- CI workflow for Node tests, production build and PWA output checks.

## Automated validation

Latest completed validation run:
- **PASS:** 36 of 36 Node unit tests, covering physics/glide, combat/projectile pooling, Robo Bug AI, character models/forms, progression/unlocks/save validation, level catalog and first two stage layouts/hidden items.
- **PASS:** Vite production build.
- **PASS:** service worker and manifest copied into the production output.

The production build may emit a non-blocking bundle-size warning.

## Not yet tested

- Actual interactive WebGL gameplay in desktop or mobile browsers.
- Touch controls and landscape behavior on a physical phone.
- Offline restart after installing/loading the PWA.
- Mobile performance, draw-call/triangle budgets and sustained frame rate.
- Capacitor Android build, APK installation and physical-device testing.
- Full Nobi propeller flight and Gadget Vision beyond the current hidden-item reveal.
- Benji form-specific gameplay abilities beyond the visual form cycle.

## Remaining implementation

- Sunny Neighborhood levels 3–8 and School Playground levels 9–16, followed by the remaining three worlds (levels 17–40).
- Remaining enemy families, advanced enemy AI and five boss encounters.
- Full combat feedback, effects/audio, checkpoints and three-star level ratings.
- Nobi complete aerial kit; Benji form-specific powers and balancing.
- Full achievements, settings, leaderboard, tutorial, cinematics/dialogue and final victory flow.
- IndexedDB fallback/backup, Capacitor configuration and verified Android release.
- Browser/device acceptance tests and mobile performance profiling.

The old endless-runner modules remain under `src/game/` for reference. They are not loaded by the new browser entry point. No changes have been merged into `main`.
