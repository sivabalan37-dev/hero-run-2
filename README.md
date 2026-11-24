# HERO RUN: TIME-TRAVEL ADVENTURE

**Engine:** Three.js 0.187.0 · JavaScript ES modules · Vite  
**Runtime:** Browser-based WebGL 2 · Unity is not used.

The active entry point runs a side-scrolling action platformer from `src/adventure/`. The older endless-runner modules in `src/game/` are retained as reference code and are not loaded by the adventure entry point.

## Game features

- 40 authored campaign levels across five themed worlds.
- Five boss encounters at levels 8, 16, 24, 32 and 40, each with a multi-phase fight and a distinct attack pattern.
- Three playable heroes: Shin, Nobi and Benji. Nobi unlocks after three distinct level completions; Benji unlocks after six.
- Shin's Toy Star projectile and Star Burst; Nobi's extra mid-air jump, glide, air dash and Gadget Vision; Benji's Normal, Blaze, Shock and Titan forms.
- Five enemy archetypes with different movement and attack behaviours.
- Coins, hearts, hidden collectibles, Time Shards, checkpoints, portals and three-star level ratings.
- Campaign level selection, saved progress, achievements, rewards, settings, pause/resume and HUD.
- Fixed-step platform physics, pooled projectiles and impact particles, combat feedback and boss health indicators.
- Responsive Three.js WebGL 2 renderer, PWA manifest and same-origin service-worker app-shell caching.

## Controls

| Action | Keyboard |
|---|---|
| Move left/right | `A/D` or `←/→` |
| Jump | `Space`, `W` or `↑` |
| Attack | `J` |
| Special ability | `K` |
| Switch hero | `C` |
| Change Benji form | `T` |
| Pause/resume | On-screen pause button |

Touch controls are provided for supported touch devices. Nobi can glide by holding jump while falling; use the special action for the air dash when airborne.

## Worlds and bosses

1. Sunny Neighborhood — levels 1–8; Neighborhood Guardian.
2. School Playground — levels 9–16; Mechanical Headmaster.
3. Forest of Forgotten Toys — levels 17–24; Toy Forest Guardian.
4. Alien Tech City — levels 25–32; Supreme Machine.
5. Time-Travel Castle — levels 33–40; Ultimate Time Guardian.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm test
npm run build
npm run dev
```

## Validation and release status

The latest recorded GitHub Actions validation completed successfully, including dependency installation, unit tests, the Vite production build and PWA output checks. See [GitHub Actions](https://github.com/sivabalan37-dev/hero-run-2/actions).

Automated checks are not a substitute for hands-on playtesting. Physical-device touch controls, sustained mobile performance, offline relaunch after PWA installation, and Android packaging/installation still require device verification. The production bundle has previously emitted a non-blocking chunk-size advisory.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [roadmap](docs/IMPLEMENTATION_ROADMAP.md), [time-travel adventure specification](docs/TIME_TRAVEL_ADVENTURE_SPEC.md), and [release checklist](RELEASE_CHECKLIST.md).

The development branch is `feature/time-travel-adventure-threejs`. These changes are not represented as merged into `main`.
