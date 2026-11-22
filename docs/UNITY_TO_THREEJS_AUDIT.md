# Unity → Three.js audit (HeroRun_Unity1.zip)

## Inspected source archive
The uploaded ZIP contains a Unity source folder with 11 C# scripts and two README/setup documents. It is **not a complete Unity project**.

## Findings supported by the uploaded files
- **Unity version:** Unknown. The README suggests Unity 2022 LTS or Unity 6 for a new setup; no ProjectSettings or editor version file was included.
- **Render pipeline:** Unknown. No ProjectSettings, URP/HDRP assets or Graphics settings were included.
- **Scenes:** No scene files were included. `HeroRunBootstrap` can auto-create its objects after scene load.
- **Scripts:** `HeroRunWorld`, `MobileControls`, `Collectible`, `HeroRunOnline`, `ClientNetworkTransform`, `CharacterSelector`, `EnemyHealth`, `HeroPlayerController`, `HeroRunUI`, `HeroRunBootstrap`, `HeroInput`.
- **Player movement:** CharacterController movement on X/Y with Z fixed; horizontal speed 6, jump height 2.5, gravity -20, one extra air jump, fall reset.
- **Camera:** Bootstrap follows the local player with a smoothed offset. No separate camera script was supplied.
- **Level:** Bootstrap builds a small test level with ground, three platforms, five coin pickups, a time shard and a health pickup. No procedural endless-level generator is supplied in the Unity source.
- **Collectibles:** Coin, TimeShard and Health. Coin and shard totals persist using PlayerPrefs.
- **Combat:** Player has 100 default health, normal and special attacks; EnemyHealth has 100 default health and server-routed damage.
- **UI:** Runtime OnGUI menu/HUD, online room code, leave action and touch controls.
- **Online services:** Netcode for GameObjects, Authentication, Lobby, Relay and Unity Transport are referenced in code/setup documentation. These Unity services are not automatically reused by the browser game.
- **Audio/animation/VFX/materials/assets:** No original audio, animation clips, particle systems, materials, textures, models or shaders were included in the ZIP.
- **Prefabs:** Player prefab is required; Enemy prefab is optional. Neither prefab is included, only a README explaining the required components.
- **Third-party packages:** README names NGO, Authentication, Lobby and Relay packages. Exact installed versions cannot be determined.
- **Build targets:** README gives Android landscape/API 26 setup instructions. No build profiles were included.
- **Ads/analytics/IAP/leaderboards:** No evidence in the supplied archive.

## Browser conversion status
The GitHub project `sivabalan37-dev/hero-run-2` already contains a Three.js + Vite browser game. Its existing gameplay is a three-lane forward endless runner with jump, double jump, slide, attack, special attack, enemies, obstacles, pickups, score, distance, touch controls and local best-score saving.

The uploaded Unity scripts instead describe a side-view X/Y platform game. Therefore the current browser project is a related playable adaptation, **not yet exact gameplay parity** with the Unity source. The latest graphics update adds a blue daytime sky, grassy floating islands, waterfalls, trees, distant fantasy castle scenery and a red cape detail to the hero while preserving the current browser runner controls and mechanics.

## Missing items needed for exact parity
1. Complete Unity project including ProjectSettings, Packages/manifest.json, scenes, prefabs and all original assets.
2. Original character/enemy models, animations, textures and audio exported as GLB/GLTF, PNG/JPEG and OGG/MP3.
3. A decision on a browser multiplayer backend to replace or bridge Unity Lobby/Relay.
4. Confirmation whether the final browser game should retain the existing three-lane runner or switch to the Unity source's side-view platform movement.
