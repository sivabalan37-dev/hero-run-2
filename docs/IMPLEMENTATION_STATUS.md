# Implementation Status

**Project:** HERO RUN: TIME-TRAVEL ADVENTURE  
**Engine:** Three.js 0.187.0  
**Development branch:** `feature/time-travel-adventure-threejs`  
**Updated:** 2026-11-22

## Implemented in this branch

- Three.js WebGL 2 renderer, landscape-aware orthographic side camera and responsive resize handling.
- Fixed 60 Hz AABB platform movement with gravity, horizontal bounds, landing and underside collision, coyote time and jump buffering.
- Procedural Shin character and basic walk/attack animation.
- Pooled Toy Star projectiles and a seven-shot Star Burst special attack.
- Robo Bug patrol, alert, chase and cooldown-based attack AI; two-hit enemy health.
- Sunny Neighborhood level foundation: static platforms, low-poly scenery, coins, health pickup, Time Shard, patrolling Robo Bugs, checkpoint and portal.
- Keyboard and pointer-based touch controls with independent pointer IDs.
- HUD, menu, pause/resume, basic damage/respawn and level-completion flow.
- Versioned local checkpoint save with safe fallback if browser storage is unavailable or corrupt.
- Production service worker and PWA manifest stored in Vite's public directory.
- CI workflow for unit tests, production build and PWA output checks.

## Automated validation

At the last verified code commit, GitHub Actions reported:
- **PASS:** 8 of 8 Node unit tests at the previous verified code commit; the new combat and AI tests are included in the current CI run.
- **PASS:** Vite production build.
- **PASS:** service worker and manifest exist in the production output.

The production build emits a non-blocking chunk-size warning: approximately 558 KB minified and 141 KB gzip.

## Not yet tested

- Actual interactive WebGL play in desktop or mobile browsers.
- Touch controls on a physical phone and landscape behavior across devices.
- Offline restart after installing/loading the PWA.
- Mobile performance and draw-call/triangle budgets.
- Capacitor Android build, APK installation and physical-device testing.

## Remaining implementation

- Further combat polish and remaining enemy types/AI variations.
- Nobi and Benji, Benji transformations and character unlock progression.
- Levels 2–40, remaining world themes, level reachability validation and five bosses.
- Full save/progression, stars, achievements, settings, leaderboard and tutorial.
- Cinematics, dialogue, full audio and final victory sequence.
- Capacitor configuration and verified Android release.

The old runner files remain under `src/game/` as reference material. They are not used by the new browser entry point. No changes have been merged into `main`.
