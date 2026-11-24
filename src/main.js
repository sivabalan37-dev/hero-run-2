import '../styles.css';

const mount = document.querySelector('#game-canvas');

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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('Offline cache could not be registered:', error);
    });
  }, { once: true });
}
