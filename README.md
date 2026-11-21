# Hero Run 2

Hero Run 2 is a browser-based 3D endless runner built with HTML, CSS, JavaScript, Three.js and Vite. It is designed to run in a browser and does not require Unity or C#.

## Game features

- Three-lane auto-running gameplay with keyboard and mobile touch controls.
- Animated hero movement: run, jump, double-jump, slide, attack and special attack.
- Enemies, coins, time shards, health pickups, shields and temporary boosts.
- Crate and spike obstacles, score, distance, health and saved best distance.
- 3D environment, scenery, particle effects and synthesized sound.

## Add the game source

The prepared source bundle is attached separately in the ChatGPT conversation as **Hero_Run_2_WebOnly.zip**. Extract the ZIP, then upload the files and folders inside its `hero-run-2` directory to the root of this repository. The ZIP itself is not currently committed here.

After the source files are uploaded, the project can be run locally.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Run the checks and production build with:

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

The project includes a GitHub Actions workflow under `.github/workflows/deploy.yml`. After the source files are extracted into the repository root, open **Settings → Pages** and select **GitHub Actions** as the deployment source.

## Scope

This is a local single-player browser game. The Unity Lobby/Relay multiplayer implementation from the original project is not part of this browser conversion, so online rooms, cloud saves and server leaderboards are not included.
