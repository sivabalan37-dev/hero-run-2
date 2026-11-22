# Hero Run 2

**Play the game:** https://hero-run-2.sivabalan37.workers.dev/

Hero Run 2 is a browser-based 3D endless runner built with HTML, CSS, JavaScript, Three.js and Vite. It runs in a browser and does not require Unity or C#.

## Latest graphics update\n\nThe fantasy-kingdom visual pass adds a bright blue daytime sky, floating grassy islands, waterfall ribbons, lush trees, distant castle towers, and a red cape detail on the hero. Existing Three.js gameplay and touch/keyboard controls are preserved.\n\nUnity source findings and conversion gaps are documented in [`docs/UNITY_TO_THREEJS_AUDIT.md`](docs/UNITY_TO_THREEJS_AUDIT.md).\n\n## Game features

- Three-lane auto-running gameplay with keyboard and mobile touch controls.
- Animated hero movement: run, jump, double-jump, slide, attack and special attack.
- Enemies, coins, time shards, health pickups, shields and temporary boosts.
- Crate and spike obstacles, score, distance, health and saved best distance.
- 3D environment, scenery, particle effects and synthesized sound.

## Project files

The complete source is uploaded to this repository. The browser app entry point is `index.html`, with modular JavaScript under `src/`. The original Unity C# files are kept under `reference/unity-source/` for reference.

The production browser build is exported to the `build-dist` branch. Cloudflare Worker `hero-run-2` serves that build at the live game URL above.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Run the tests and production build with:

```bash
npm test
npm run build
npm run preview
```

## Deployment

The `.github/workflows/build-dist-export.yml` workflow runs tests, builds the site and updates the `build-dist` branch whenever source files change on `main`. The Cloudflare Worker serves the latest exported build.

## Scope

This is a single-player browser game. The Unity Lobby/Relay multiplayer implementation from the original project is not part of this browser conversion, so online rooms, cloud saves and server leaderboards are not included.
