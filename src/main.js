import '../styles.css';

const mount = document.querySelector('#game-canvas');
const updateStatus = document.querySelector('#update-status');
const checkUpdatesButton = document.querySelector('#check-updates');
const applyUpdateButton = document.querySelector('#apply-update');
const appVersion = document.querySelector('#app-version');

if (appVersion) appVersion.textContent = `HERO RUN v${__HERO_RUN_VERSION__}`;

let updateManager = null;
checkUpdatesButton?.addEventListener('click', () => updateManager?.checkForUpdates());
applyUpdateButton?.addEventListener('click', () => updateManager?.applyUpdate());

import('./adventure/AdventureGame.js')
  .then(({ AdventureGame }) => {
    new AdventureGame({ mount });
  })
  .catch(error => {
    console.error('Hero Run failed to initialize:', error);
    document.querySelector('#overlay-title').textContent = 'UNABLE TO START';
    document.querySelector('#overlay-message').textContent = error instanceof Error
      ? error.message
      : 'The 3D game could not initialize on this browser.';
    document.querySelector('#start-button').disabled = true;
    document.querySelector('#overlay').classList.remove('hidden');
    document.querySelector('#hud').classList.add('hidden');
  });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      const { UpdateManager } = await import('./update/UpdateManager.js');
      updateManager = new UpdateManager({
        serviceWorker: navigator.serviceWorker,
        onStateChange: state => {
          if (updateStatus) updateStatus.textContent = state.message;
          if (checkUpdatesButton) {
            checkUpdatesButton.disabled = state.checking || state.state === 'unsupported';
            checkUpdatesButton.textContent = state.checking ? 'CHECKING…' : 'CHECK FOR UPDATES';
          }
          if (applyUpdateButton) {
            applyUpdateButton.classList.toggle('hidden', !state.updateAvailable);
          }
        },
      });
      await updateManager.init(registration);
      await updateManager.checkForUpdates();
    } catch (error) {
      console.warn('Hero Run update checker could not start:', error);
      if (updateStatus) updateStatus.textContent =
        'Update checking is unavailable. Reload the game while online to receive app updates.';
      if (checkUpdatesButton) checkUpdatesButton.disabled = true;
    }
  }, { once: true });
} else if (updateStatus) {
  updateStatus.textContent = 'Automatic updates are available in the installed or hosted game.';
  if (checkUpdatesButton) checkUpdatesButton.disabled = true;
}
