# Hero Run 2

Hero Run 2 is a browser-based 3D endless runner built with HTML, CSS, JavaScript, Three.js and Vite. It is designed to run in a browser and does not require Unity or C#.

## Game features

- Three-lane auto-running gameplay with keyboard and mobile touch controls.
- Animated hero movement: run, jump, double-jump, slide, attack and special attack.
- Enemies, coins, time shards, health pickups, shields and temporary boosts.
- Crate and spike obstacles, score, distance, health and saved best distance.
- 3D environment, scenery, particle effects and synthesized sound.

## Project files

The complete source is uploaded to this repository. The browser app entry point is `index.html`, with modular JavaScript under `src/`. The original Unity C# files are kept under `reference/unity-source/` for reference.

A copy of the source archive is also included as `Hero_Run_2_WebOnly.zip`.

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

## GitHub Pages

The deployment workflow is at `.github/workflows/deploy.yml`. It installs dependencies, runs the tests, builds the Vite app and deploys the `dist/` folder to GitHub Pages on pushes to `main`.

## Scope

This is a local single-player browser game. The Unity Lobby/Relay multiplayer implementation from the original project is not part of this browser conversion, so online rooms, cloud saves and server leaderboards are not included.
