# HERO RUN: TIME-TRAVEL ADVENTURE

**Engine:** Three.js 0.187.0 · JavaScript ES modules · Vite  
**Runtime:** Browser-based WebGL 2 · Unity is not used.  
**App version:** 1.0.1

The active entry point runs a side-scrolling action platformer from `src/adventure/`. The older endless-runner modules in `src/game/` are retained as reference code and are not loaded by the adventure entry point.

## Game features

- 40 authored campaign levels across five themed worlds.
- Five boss encounters at levels 8, 16, 24, 32 and 40, each with a multi-phase fight and a distinct attack pattern.
- Three playable heroes: Shin, Nobi and Benji. Nobi unlocks after three distinct level completions; Benji unlocks after six.
- Shin's Toy Star projectile and Star Burst; Nobi's extra mid-air jump, glide, air dash and Gadget Vision; Benji's Normal, Blaze, Shock and Titan forms.
- Five enemy archetypes with different movement and attack behaviours.
- Coins, hearts, hidden collectibles, Time Shards, checkpoints, portals and three-star level ratings.
- Campaign level selection, saved progress, achievements, rewards, settings, pause/resume and HUD.
- Fixed-step platform physics with sprint, crouch, ground slide, wall jump and controlled wall slide; pooled projectiles and impact particles, combat feedback and boss health indicators.
- Responsive Three.js WebGL 2 renderer, PWA manifest and service-worker precaching of every built JavaScript, CSS and static asset listed in Vite's asset manifest; additional same-origin GET assets are cached at runtime.
- In-game release update center: check for a newer PWA build, review the update-ready status and choose UPDATE NOW to install/reload.

## Controls

| Action | Keyboard |
|---|---|
| Move left/right | `A/D` or `←/→` |
| Sprint | Hold `Shift` or the on-screen SPRINT button |
| Crouch / slide | Hold `S`, `↓` or the on-screen CROUCH button; crouching while running starts a short slide |
| Jump | `Space`, `W` or `↑` |
| Attack | `J` |
| Special ability | `K` |
| Switch hero | `C` |
| Change Benji form | `T` |
| Pause/resume | On-screen pause button |

Touch controls are provided for supported touch devices. Nobi can glide by holding jump while falling; use the special action for the air dash when airborne.

## Updating the game

The current development version is **1.0.1**. In the hosted game, open the main menu and use **CHECK FOR UPDATES**. When a newer release has downloaded, choose **UPDATE NOW**; the game then activates the new service worker and reloads. The current release stays active while the update downloads. This updates the whole web app/PWA, not separate downloadable level packs.

For each future release, increment `package.json` and the `CACHE_NAME` in `public/service-worker.js`. Deploy the complete production build over HTTPS so installed PWAs can discover it.

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
npm run verify:build
npm run dev
```

## Validation and release status

The latest completed validation passed 210 unit tests, the Vite production build, PWA asset-manifest checks and the JavaScript chunk-budget guard. The initial entry is about 3.33 KB (1.55 KB gzip); the deferred adventure code is about 100.93 KB (29.31 KB gzip); and the separate Three.js vendor file is about 562.65 KB (140.75 KB gzip). The vendor file still triggers Vite's non-blocking 500 KB advisory. See [the successful validation](https://github.com/sivabalan37-dev/hero-run-2/actions/runs/45424687621) and [GitHub Actions](https://github.com/sivabalan37-dev/hero-run-2/actions). The chunk guard can be run locally with `npm run verify:build` after `npm run build`.

Automated checks are not a substitute for hands-on playtesting. Physical-device touch controls, sustained mobile performance, offline relaunch after PWA installation, and Android packaging/installation still require device verification.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [roadmap](docs/IMPLEMENTATION_ROADMAP.md), [time-travel adventure specification](docs/TIME_TRAVEL_ADVENTURE_SPEC.md), [Android device testing guide](ANDROID_TESTING_GUIDE.md), [remaining work plan](docs/REMAINING_WORK.md), and [release checklist](RELEASE_CHECKLIST.md).

The development branch is `feature/time-travel-adventure-threejs`. These changes are not represented as merged into `main`.
