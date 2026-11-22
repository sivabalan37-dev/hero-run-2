# HERO RUN: TIME-TRAVEL ADVENTURE

Version: 1.0.0 (product specification)  
Engine: Three.js >= 0.187.0  
Runtime: Browser / installable PWA  
Primary platform: Android mobile browser  
Unity dependency: **None**. Unity files, C#, Unity Editor, and Unity runtime are not part of the web game's build or runtime.

## Product direction

This specification changes the game direction from an endless runner to a **3D side-scrolling action platformer**. The player moves along the X/Y gameplay plane while the camera follows from an angled side view. The previous endless-runner design must not be mixed into this mode unless a separate endless-runner mode is explicitly added later.

Story: Shin, Nobi, and Benji recover Time Shards scattered across five worlds after a Time Machine breaks apart. The campaign contains 40 levels and five world bosses, ending with the Ultimate Time Guardian.

## Technical baseline

- JavaScript ES Modules, HTML5, CSS3, Vite, Three.js 0.187.0 or newer.
- WebGLRenderer as the required renderer, WebGL 2 target, sRGB output, ACES filmic tone mapping.
- Web Audio API, Pointer Events multitouch, custom fixed-step platformer physics, AABB/raycast collision, Three.js AnimationMixer.
- Browser PWA with service worker and offline-capable local assets.
- Capacitor Android packaging target: application ID `com.herorun.timetravel`, landscape, minimum SDK 26, arm64-v8a.
- Save data in versioned localStorage with IndexedDB fallback and validated backup/restore.
- Low/medium/high mobile graphics presets; pooled entities/effects; avoid per-frame allocations.

## Campaign content

| World | Levels | Boss |
|---|---:|---|
| Sunny Neighborhood | 1–8 | Neighborhood Guardian |
| School Playground | 9–16 | Mechanical Headmaster |
| Forest of Forgotten Toys | 17–24 | Toy Forest Guardian |
| Alien Tech City | 25–32 | Supreme Machine |
| Time-Travel Castle | 33–40 | Ultimate Time Guardian |

Every level is data-driven and must define spawn, boundaries, platforms, hazards, enemies, collectibles, checkpoint, objective, exit/boss completion trigger, lighting, sky, and background scenery. A level validator must check that a traversable path exists from spawn to exit. Boss levels complete only when the boss is defeated.

## Playable characters

- **Shin**: balanced fighter; toy-star projectile and Star Burst.
- **Nobi**: aerial explorer; glide, propeller flight, and Gadget Vision.
- **Benji**: transformation fighter; normal, Blaze, Shock, and Titan forms.

Unlocks: Shin from start; Nobi after level 3; Benji after level 6. Implement only original, project-owned or properly licensed character art/audio. The character descriptions in this document are design targets, not supplied asset files.

## Controls and gameplay

Keyboard and multitouch controls must support simultaneous movement, jump, and attack. Required movement includes acceleration, sprint, jump, double jump, wall jump/slide, crouch/slide, coyote time, jump buffering, knockback, invulnerability, checkpoints, death, and respawn. Inputs must be ignored while paused, dead, or in cinematics.

Touch UI includes left/right, jump, attack, special, character switch, Benji transformation, pause, restart, and settings. Support safe areas, configurable scale/opacity/sensitivity, pointer cancellation, and multi-pointer tracking.

## Enemies and bosses

Six standard enemy families: Robo Bug, Flying Drone, Bouncy Slime, Shadow Creature, Mechanical Guard, and Time Ghost. Five bosses have phase-based encounters and world-specific attack patterns. Enemy AI states: idle, patrol, alert, chase, attack, hurt, stunned, dead.

## Progression and saves

- Coins, hearts, Time Shards, star fragments, chests, and Nobi-revealed hidden collectibles.
- Three-star level rating: completion; at least 70% collectibles; all required items plus target time.
- Achievements, local leaderboard metrics, first-time tutorial, checkpoints, unlocks, best times, and settings.
- Save schema version 1; never replace a valid save with invalid data.

## Visual direction and budgets

Original colorful cartoon low-poly art. Five distinct world palettes and sky environments. Directional sun, ambient fill, accent lights, optional soft shadows, VFX and screen shake. Budgets: target <=80 draw calls, <=120,000 visible triangles, texture size <=1024, max pixel ratio 2, max 12 active enemies, max 40 projectiles, max 12 audio voices. Particle caps: 150 low, 400 medium, 900 high. Low preset disables shadows.

## Acceptance and honest validation

Required automated coverage: player movement, combat, save validation, level progression, enemy AI; browser tests for menus, touch controls, level completion, and save persistence. Manual checks include all characters/forms, all levels/bosses, multitouch, offline mode, and Android device performance.

Every result must be labelled PASS, FAIL, or NOT TESTED. Physical Android device testing is NOT TESTED until a real device is available. An APK is not considered produced until a Capacitor build is completed and verified.

## Scope and delivery strategy

This is a large campaign game, not a one-file graphics patch. Implement in vertical slices and keep the main branch stable:
1. Runtime foundation, renderer, responsive landscape shell, input, fixed-step loop, quality settings, PWA shell.
2. One fully playable test level with Shin, platform physics, collisions, camera, HUD, save/checkpoint.
3. Combat, projectiles, enemy AI, pickups, effects, audio, and Nobi/Benji abilities.
4. Data-driven level builder and world themes; validate all 40 level layouts.
5. Five boss encounters, cinematics/dialogue, achievements, menus, progression.
6. Offline/browser tests, performance profiling, Capacitor Android packaging and device validation.

Do not claim all 40 levels, all animations, offline behavior, or Android packaging are complete until each has been implemented and tested.
