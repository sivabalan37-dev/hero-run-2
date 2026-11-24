# Remaining Work — Hero Run: Time-Travel Adventure

**Reviewed:** 2026-11-24  
**Development branch:** `feature/time-travel-adventure-threejs`  
**Current automated baseline:** 198/198 Node tests pass; production build and build checks pass.

This is a delivery checklist, not a promise that the game is release-ready. A feature is only complete when its implementation and the appropriate test evidence both exist.

## Overall count

There are **7 major remaining work areas**. Some involve code; others require real browser or Android-device testing that cannot be replaced by unit tests.

## 1. Close gameplay-spec gaps and finish content polish

- [x] Add hold-to-sprint movement using Shift and a touch control; speed remains bounded by the physics cap.
- [x] Implement and test wall jump and controlled wall slide; 3 physics regression tests cover launch direction, slide speed and open-air behavior.
- [ ] Implement crouch/ground slide, including safe stand-up clearance checks and mobile controls.
- [ ] Confirm whether double-jump should be available to every hero or remain a Nobi-specific aerial ability; the current implementation gives Nobi the extra mid-air jump.
- [ ] Decide whether to add the six enemy families named in the product specification. The current campaign uses five different archetypes: Robo Bug, Clockwork Charger, Vine Sweeper, Drone Scout and Time Sentinel.
- [ ] Decide whether star fragments, chests, best-time records and a local leaderboard are release requirements; they appear in the product specification but are not part of the current implemented feature list.
- [ ] Finish remaining dialogue/cinematics, ambient music and character/boss animation polish.
- [ ] Play-balance Benji's forms and Nobi's aerial kit.

## 2. Add real browser acceptance tests

- [ ] Add browser-driven tests for menu navigation, settings, hero switching, pause/resume and level progression.
- [ ] Test touch input against the actual rendered page, not only DOM/CSS structure and the input module.
- [ ] Verify one complete level in a browser, including collectibles, checkpoint, boss gate where applicable, completion and saved progress.
- [ ] Verify WebGL 2 startup and a clear error path when WebGL 2 is unavailable.

Current automated coverage is primarily Node unit/integration tests and a production build. It is not a full Playwright/browser acceptance suite.

## 3. Manually playtest the campaign

- [ ] Play all 40 levels and check jumps, enemy placement, collectible reachability, checkpoints and exit triggers.
- [ ] Play all five boss encounters and assess warning readability, difficulty and damage fairness.
- [ ] Test Shin, Nobi and Benji; test all four Benji forms.
- [ ] Check level unlocks, saved stars, replay behavior, achievements and reward titles.
- [ ] Record defects and re-test fixes.

Automated stage construction and route-shape checks do not prove that a human can comfortably complete every stage.

## 4. Strengthen saved-data reliability

- [ ] Add IndexedDB as a fallback/backup path for campaign data.
- [ ] Implement validated backup and restore.
- [ ] Test older save versions, malformed records, storage quota errors and private/restricted browsing modes.
- [ ] Confirm save recovery on a real Android browser.

The current campaign/checkpoint/settings storage uses local browser storage with validation and safe fallbacks; IndexedDB backup/restore is still pending.

## 5. Measure and optimize performance

- [ ] Profile Low, Medium and High quality on actual target phones.
- [ ] Measure frame rate, frame-time spikes, draw calls, visible triangles and memory over a sustained play session.
- [ ] Confirm scene transitions and repeated restarts do not cause memory growth.
- [ ] Tune shadow-map, renderer and effects budgets from measurements.
- [ ] Review the remaining non-blocking Three.js vendor-chunk size advisory.

Distance-aware enemy visual culling and pooled effects have automated coverage, but the real-world performance gain has not yet been measured on a phone.

## 6. Build the native Android release

- [ ] Add and configure Capacitor for the specified application ID `com.herorun.timetravel`.
- [ ] Configure landscape orientation, minimum Android SDK and supported CPU architectures.
- [ ] Generate the Android project and make a release build.
- [ ] Configure signing securely; do not commit signing keys or passwords.
- [ ] Install the APK on a physical Android phone and test launch, touch, pause/resume, audio, offline use and app lifecycle.
- [ ] Record the build version and installation/test evidence.

**Important:** the current repository builds a browser PWA. It does not currently produce an APK.

## 7. Final release and handover

- [ ] Resolve all release-blocking defects and re-run the complete automated suite.
- [ ] Complete browser, offline-PWA and physical-Android acceptance checks.
- [ ] Review app permissions, offline behavior, privacy and release configuration.
- [ ] Review and merge the feature branch into `main` only after acceptance is complete.
- [ ] Produce release notes and verified distribution artifacts.

## Completed foundation (not counted as pending)

- Hold-to-sprint movement with keyboard and touch input, covered by physics and input tests.
- Wall jump and controlled wall slide, covered by physics regression tests.

- 40 campaign levels with five boss stages.
- Three playable heroes and Benji's four forms.
- Five enemy archetypes, combat, pickups, checkpoints and progression.
- PWA manifest, service-worker caching and code splitting.
- Responsive touch controls and input cleanup.
- Fixed-capacity projectile/impact pools and Web Audio teardown.
- Distance-aware enemy animation culling.
- 198 passing automated tests and a passing production build.

## Latest validation evidence

- [191-test and performance-culling validation](https://github.com/sivabalan37-dev/hero-run-2/actions/runs/45421300313)
- [Physical Android testing guide](../ANDROID_TESTING_GUIDE.md)
- [Implementation status](IMPLEMENTATION_STATUS.md)
- [Release checklist](../RELEASE_CHECKLIST.md)

Do not mark physical-device, offline-installed-PWA, APK or full-campaign playtesting items complete based only on CI.
