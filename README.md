# Hero Run 2

A browser-based 3D endless runner built with HTML, CSS, JavaScript, Three.js and Vite. It is not a Unity project and does not require Unity or C# to run.

## Features

- Three-lane auto-running gameplay with keyboard and touch controls.
- Animated hero movement: run, jump, double-jump, slide, attack and special attack.
- Enemies, coins, time shards, health pickups, shields and temporary boosts.
- Crate and spike obstacles, score, distance, health and saved best distance.
- Procedural 3D environment, lighting, scenery, particle effects and synthesized sound.
- GitHub Pages deployment workflow.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

For tests and a production build:

```bash
npm test
npm run build
npm run preview
```

## Deploy

The included GitHub Actions workflow builds the Vite project and deploys the `dist/` folder to GitHub Pages. In repository Settings → Pages, choose **GitHub Actions** as the build and deployment source.

## Important limitations

This is a local single-player browser game. The supplied Unity Lobby/Relay multiplayer implementation is not included in the browser conversion, so online rooms, cloud saves and server leaderboards are not provided.

## Source bundle

The complete prepared project bundle is stored in this repository as `Hero_Run_2_Web.zip`. Download and extract it to work with the modular source files.
