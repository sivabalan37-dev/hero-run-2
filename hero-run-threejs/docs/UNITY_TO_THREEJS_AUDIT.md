# Unity to Three.js conversion audit

Audit basis: \`HeroRun_Unity1.zip\` supplied in this conversation. The archive was inspected without editing or deleting it.

## Archive inventory

The ZIP contains 13 files in total: 11 C# scripts, one Unity resource-folder README and one project README. The source files are under \`Assets/HeroRun/Scripts/\`.

| Area | What the uploaded source shows |
|---|---|
| Unity version | README says create a project with Unity 2022 LTS or Unity 6. No \`ProjectSettings/ProjectVersion.txt\` is included, so the exact version is unknown. |
| Render pipeline | Unknown. No Unity project settings, renderer assets or graphics settings are included. |
| Scenes | None included. |
| Prefabs | None included. README instructs the developer to create Player and optional Enemy prefabs. |
| Gameplay scripts | HeroRunBootstrap, HeroRunWorld, HeroPlayerController, HeroInput, MobileControls, HeroRunUI, Collectible, EnemyHealth, CharacterSelector, ClientNetworkTransform and HeroRunOnline. |
| Player movement | Speed 6, jump height 2.5, gravity -20, one air-jump, horizontal movement and fall reset. |
| Combat | Normal attack damage 25; special attack damage 50; enemy health defaults to 100. This conversion expresses combat as stylized magic pulses. |
| Health | Player health is 100 in the Unity controller; health pickups heal by a configurable amount (default 25). |
| Pickups | Coin, TimeShard and Health. Coins and shards are saved with PlayerPrefs. |
| Camera | Bootstrap creates a following camera for its generated test level. No standalone camera controller source was included. |
| Level generation | Bootstrap can create a small test level and spawn up to the configured number of enemies. No production level/scene content was included. |
| UI | HeroRunUI draws a menu, HUD, room-code field and touch controls with Unity OnGUI. |
| Audio | No audio scripts, audio clips or music assets are in the archive. |
| Animation | Player model animation assets/controllers are not included. The code moves/turns the player but does not show an Animator setup. |
| Particles | No particle-system assets or particle scripts are included. |
| Materials/shaders/textures | None included. Render pipeline and shader compatibility cannot be determined. |
| 3D models | None included. CharacterSelector references Shin, Nobi and Benji GameObjects but their model assets are absent. |
| Third-party packages | README names Netcode for GameObjects, Authentication, Lobby and Relay. Exact package versions are not specified. |
| Online/backend | HeroRunOnline implements Unity Authentication, Lobby and Relay room creation/join/leave and heartbeat. Browser conversion does not reuse these Unity services. |
| Ads/analytics/IAP/leaderboards | Not found in the supplied scripts; absence from the full Unity project cannot be established because only source scripts and READMEs were provided. |
| Target platforms | README gives Android setup (landscape, minimum API 26, Internet Access required for online rooms) and Editor testing. No build profiles are included. |
| Broken references | Cannot be checked because scenes, prefabs, assets, metadata and project settings are absent. |

## Source-to-web mapping

| Unity source | Web implementation |
|---|---|
| HeroPlayerController + HeroInput | PlayerController + InputManager |
| HeroRunBootstrap + generated test area | Engine + LevelGenerator |
| HeroRunWorld PlayerPrefs values | SaveManager (localStorage) |
| Collectible | CoinManager / PowerUpManager / Coin entity |
| EnemyHealth | Enemy entity and CollisionSystem |
| HeroRunUI + MobileControls | MainMenu, HUD, PauseMenu, SettingsMenu and touch buttons |
| Follow camera in bootstrap | CameraController |
| Unity movement/combat | JavaScript frame loop, lane movement, jump/double-jump, slide and stylized magic attacks |

## Missing source material and limitations

This archive is not a complete Unity project. It does not establish exact Unity version, pipeline, scenes, prefab wiring, package versions, art assets, audio, animation, particle systems, build profiles or service dashboard settings. The visual web scene therefore uses generated Three.js geometry/materials. No original Unity asset is overwritten or copied as if it were present.

The web conversion is single-player. The Unity Lobby/Relay integration is documented as source behavior but is not treated as browser multiplayer. Online play needs its own server-authoritative backend and security review.