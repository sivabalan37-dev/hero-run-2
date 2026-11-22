# Implementation Roadmap

## Direction decision

The current approved specification is a Three.js side-scrolling action platformer, not the earlier endless runner. Keep Unity entirely out of the runtime and build pipeline.

## Phase gates

### Phase 1 — Runtime foundation
- Vite entry point and Three.js WebGLRenderer (WebGL 2).
- Landscape responsive canvas and safe-area UI.
- Fixed 60 Hz simulation with capped frame delta.
- Pointer Events input with independent pointer IDs for multitouch.
- Quality presets, resize handling, pause/resume, error reporting.
- PWA manifest and service worker caching only same-origin app assets.

**Exit criteria:** app boots on supported browser, renderer initializes, no console errors, offline shell works after first successful load.

### Phase 2 — Vertical-slice level
- Shin placeholder/procedural character model and animation state machine.
- Platform collision and fixed-step movement with jump buffer/coyote time.
- Camera follow and one Sunny Neighborhood level.
- One enemy, coin, heart, Time Shard, checkpoint, exit, HUD and save.

**Exit criteria:** level can be completed, player cannot pass through static platforms, checkpoint and save survive reload.

### Phase 3 — Full gameplay systems
Combat/projectiles, damage/invulnerability, enemy AI, object pools, VFX/audio, Nobi and Benji abilities and forms.

### Phase 4 — Campaign construction
Data-driven world and level definitions, modular level builder, reachability validation, 40 layouts and five distinct visual themes.

### Phase 5 — Bosses and polish
Five boss encounters, phase transitions, cinematics/dialogue, progression, achievements, settings, tutorial and final victory flow.

### Phase 6 — Release verification
Unit and Playwright tests, offline test, mobile performance profiling, Capacitor Android build and physical-device verification.

## Status policy

At the time this roadmap is added, this document records scope only. No feature is marked implemented or tested by virtue of appearing here. Record each test as PASS, FAIL, or NOT TESTED with date, environment, and evidence.
