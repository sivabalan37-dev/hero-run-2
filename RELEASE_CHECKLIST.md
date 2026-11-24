# Release checklist

## Automated checks

- [ ] Run `npm install` and confirm dependency installation completes.
- [ ] Run `npm test` and confirm every test passes.
- [ ] Run `npm run build` and confirm the production `dist/` output is generated.
- [ ] Confirm `dist/manifest.webmanifest` and `dist/service-worker.js` are present.
- [ ] Run `npm run verify:build` and confirm the initial entry, deferred application chunk and separate Three.js vendor chunk meet their size/layout checks.

## Adventure gameplay

- [ ] Test left/right movement, hold-to-sprint, crouch, ground slide, normal jump, wall jump, wall slide, coyote time and jump buffering.
- [ ] Automated input tests cover keyboard aliases, simultaneous touch pointers, pointer cancellation, blur cleanup and listener teardown.
- [ ] Automated touch UI tests cover all actions, responsive minimum target sizes and coarse/fine pointer visibility.
- [ ] Test Shin attack and special ability.
- [ ] Test Nobi's extra mid-air jump, glide, air dash and Gadget Vision.
- [ ] Test wall jump launch direction and wall-slide fall speed against solid-sided level geometry.
- [ ] Test crouch height, standing clearance under low ceilings and ground-slide speed/duration.
- [ ] Test Benji's Normal, Blaze, Shock and Titan forms and each special.
- [ ] Test all five enemy archetypes, damage, knockback and respawn.
- [ ] Test coins, hearts, hidden collectibles, Time Shards and checkpoints.
- [ ] Complete a level, verify its star rating and confirm progress persists after reload.
- [ ] Verify locked/unlocked character and level-selection rules.
- [ ] Test all five boss encounters, phase changes, attack warnings and exit gates.
- [ ] Test pause/resume and automatic pause when the page becomes hidden.

## Android device guide

Use [ANDROID_TESTING_GUIDE.md](ANDROID_TESTING_GUIDE.md) to record the phone/browser build and follow the complete manual test sequence. The items below must remain unchecked until completed on a real device.

## Performance regression coverage

- [ ] Confirm distant-enemy animation culling preserves nearby telegraphs and gameplay AI; automated tests cover the culling boundary and stage integration.
- [ ] Measure sustained frame rate, draw calls, triangles and memory on target Android devices; automated checks are not a substitute for device profiling.

## Browser and device verification

- [ ] Test gameplay in a current desktop browser.
- [ ] Test landscape layout and simultaneous touch controls on a physical Android device.
- [ ] Check sustained frame rate and memory use on a lower-powered phone.
- [ ] Install the PWA, then verify it can relaunch offline after one successful online load.
- [ ] Confirm the hosted build is served over HTTPS.
- [ ] Verify Android packaging and APK installation if a native Android release is planned. The current project workflow builds a PWA only; no APK is available yet.

## Release claims

- [ ] Do not advertise online multiplayer unless a real networking/backend implementation has been added and tested.
- [ ] Mark each test above only after it has been run; automated CI does not count as physical-device playtesting.
