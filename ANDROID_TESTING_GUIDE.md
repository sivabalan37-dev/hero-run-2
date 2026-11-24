# Android Device Testing Guide

**Project:** Hero Run: Time-Travel Adventure  
**Build type:** Browser-based Three.js PWA  
**Native APK:** Not currently produced by this repository

This guide is for hands-on testing of a production HTTPS build on a physical Android phone. Automated Node tests do not replace these checks. Do not mark an item complete until it has been tested on a device.

## 1. Record the test device

Record the following before testing:

- Phone model:
- Android version:
- Browser name and version:
- Build URL:
- Test date:
- Display refresh rate, if known:
- Available storage before installation:

Use a current Android browser that supports WebGL 2. The game intentionally displays an initialization error when WebGL 2 is unavailable.

## 2. First online launch

- [ ] Open the production or preview build over HTTPS.
- [ ] Confirm the title screen loads without a blank canvas or initialization error.
- [ ] Press **START LEVEL** and confirm the 3D scene renders.
- [ ] Confirm the game uses landscape orientation and remains inside display cutouts / system-bar safe areas.
- [ ] Rotate the phone once and confirm the canvas resizes without stretching or freezing.
- [ ] Open **SETTINGS** and test Low, Medium and High graphics quality.
- [ ] Confirm sound can be muted and re-enabled after the first user interaction.

Record any console errors, black screens, missing textures or sound problems.

## 3. Touch controls

- [ ] Hold LEFT and JUMP at the same time; confirm both actions register.
- [ ] Hold RIGHT and SPRINT at the same time; confirm sprint increases movement speed and releasing SPRINT returns to normal speed.
- [ ] Hold RIGHT and STAR at the same time.
- [ ] Hold LEFT and RIGHT together; confirm movement cancels rather than sticking.
- [ ] Press and release each action button; confirm its pressed visual state clears.
- [ ] Start two touch pointers on the same action, then release one; confirm the remaining pointer still holds the action.
- [ ] Cancel a pointer (for example, by interrupting the touch gesture); confirm the action does not remain stuck.
- [ ] Switch between heroes and confirm HERO / FORM controls remain usable.
- [ ] Check that the on-screen controls do not cover the boss HUD or important level paths.

## 4. Core gameplay

- [ ] Move, jump, land on raised platforms, and test jump buffering / coyote time.
- [ ] Attack with STAR and use the hero special ability.
- [ ] Activate a checkpoint, restart the level and confirm the checkpoint is respected.
- [ ] Collect a coin, heart and Time Shard.
- [ ] Complete a level and confirm its star rating is saved.
- [ ] Reload the page and confirm campaign progress and selected hero are retained.
- [ ] Complete three distinct levels and check that Nobi unlocks.
- [ ] Complete six distinct levels and check that Benji unlocks.
- [ ] Test all five boss encounters at levels 8, 16, 24, 32 and 40.

## 5. Performance and memory

Use the same level and graphics setting for comparisons.

- [ ] Play for at least 10 minutes at Low quality.
- [ ] Repeat at Medium quality, then High quality if the device remains stable.
- [ ] Restart a level several times and switch heroes repeatedly.
- [ ] Fight enemies and bosses to exercise projectiles and pooled impact effects.
- [ ] Watch for steadily worsening frame rate, delayed touch response, missing effects, audio interruption or browser tab reloads.
- [ ] Repeat after changing orientation and returning to the game.
- [ ] Confirm backgrounding the browser pauses the game; returning should not cause a large simulation jump.

Record approximate frame-rate observations and the exact step that reproduces any problem. Do not treat a single visual impression as a measured FPS result.

## 6. Install and test offline PWA launch

- [ ] While online, open the build and wait for the page and game to finish loading.
- [ ] Wait for the service worker to install and activate.
- [ ] Use the browser's **Install app** / **Add to Home screen** option if available.
- [ ] Close the installed app completely and launch it again while online.
- [ ] Confirm the title screen and game assets load.
- [ ] Turn off Wi-Fi and mobile data, then launch the installed app again.
- [ ] Confirm the app shell, adventure engine and Three.js vendor assets load offline.
- [ ] Re-enable connectivity and confirm the app still starts.

The service worker pre-caches the generated production JavaScript, CSS and static assets during installation. A successful automated cache test does not prove that a particular hosted device installation works offline.

## 7. Results and defect report

For every failed check, record:

- Test section and checklist item:
- Expected result:
- Actual result:
- Reproduction steps:
- Screenshot or short screen recording:
- Phone model / Android version / browser version:
- Graphics quality setting:
- Whether the problem repeats after a reload:

## Release boundary

This repository currently builds a web PWA, not a signed Android APK. APK generation, installation, signing and native Android lifecycle testing remain separate work and must not be marked complete until a native wrapper/build pipeline is added and tested.


## Native Android build workflow

The repository now includes a Capacitor Android wrapper configuration and a GitHub Actions workflow that produces a **debug APK**. Open the repository's **Actions** tab, select **Build Hero Run Android debug APK**, and run the workflow manually, or use the artifact produced by a feature-branch push. Download the artifact named `hero-run-android-debug-apk`; it contains `app-debug.apk`.

The debug APK uses Android's standard debug signing key and is intended for installation/testing. It does not count as a privately signed production release. A release APK/AAB still needs a private keystore and protected CI secrets. Do not upload a debug APK to the Play Store.
