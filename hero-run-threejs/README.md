# Hero Run — Three.js Floating Kingdom

A browser-based 3D endless runner converted from the uploaded Unity Hero Run source. It uses Three.js, JavaScript ES modules and Vite. The original Unity files are not changed by this conversion.

## Run it

Requires Node.js 22.13+.

\`\`\`bash
cd hero-run-threejs
npm install
npm run dev
\`\`\`

Open the local URL printed by Vite. Production checks:

\`\`\`bash
npm test
npm run lint
npm run build
npm run preview
\`\`\`

## Controls

- Desktop: A/D or Left/Right to change lanes, Space/W/Up to jump, S/Down to slide, J for magic attack, K for special.
- Mobile: use the on-screen direction, jump, slide and magic buttons. Multi-touch is supported.
- The hero runs automatically. Difficulty and speed increase gradually.

## Gameplay

The conversion preserves the original source mechanics where they were present: three selectable hero slots, horizontal movement, jump and one air-jump, attacks, special ability, health, enemies, coin/time-shard/health pickups and locally saved progress. It adds an endless-runner loop, sliding, lane hazards, temporary shield/magnet/boost effects, distance scoring and mobile HUD controls.

The visual scene is rebuilt procedurally in Three.js. Floating grassy islands, rocky undersides, a fantasy castle, waterfall, trees, clouds, banners, bridges, animated coins, a small hero, enemies and obstacles are built from geometry and materials. The uploaded Unity ZIP contains no original models, textures, audio clips or prefabs, so this version uses original procedural placeholder art rather than claiming to reuse absent assets.

## Project layout

- \`src/core\`: renderer, scene, input, timing, resource and event services.
- \`src/game\`: game loop, player controller, camera, level, obstacles, collectibles, collision, score, difficulty and saves.
- \`src/entities\`: player, enemy, obstacle, coin and power-up models.
- \`src/ui\`: main menu, HUD, pause, settings, game-over and loading UI.
- \`docs/UNITY_TO_THREEJS_AUDIT.md\`: findings from the supplied Unity source ZIP.

## Deployment

The project builds to \`dist/\`. It can be deployed as a static Vite site to GitHub Pages, Cloudflare Pages, Vercel or Netlify. For GitHub Pages, set the Pages source to GitHub Actions and deploy the \`dist/\` output. For the existing Cloudflare Worker site, configure the build context to \`hero-run-threejs/\` and publish directory to \`dist\`.

## Important scope notes

The Unity README describes Unity 2022 LTS or Unity 6 and Unity Gaming Services Lobby/Relay multiplayer. The uploaded ZIP is script-only and has no scene, prefab, package manifest, project settings or service configuration. This web build is single-player/local-save; Unity Lobby/Relay networking is not silently represented as browser multiplayer. A browser multiplayer backend would need a separate server-authoritative networking design.

## Current dependencies

Three.js 0.187.0 and Vite 8.3.8 are pinned. The npm packages were current stable releases when this version was assembled (22 November 2026).