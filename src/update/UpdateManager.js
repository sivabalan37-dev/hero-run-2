/**
 * Coordinates user-approved service-worker releases for the Hero Run PWA.
 * A new worker is downloaded and cached in isolation, then waits until the
 * player chooses Update Now. The active worker keeps serving its own cache
 * until activation, preventing mixed-version assets.
 */
export class UpdateManager {
  constructor({
    serviceWorker = globalThis.navigator?.serviceWorker,
    onStateChange = () => {},
    reload = () => globalThis.location?.reload(),
  } = {}) {
    this.serviceWorker = serviceWorker;
    this.onStateChange = onStateChange;
    this.reload = reload;
    this.registration = null;
    this.checking = false;
    this.shouldReload = false;
    this.observedWorker = null;
    this.state = 'idle';
    this.message = 'Updates are checked when you open the game.';
  }

  publish(state, message) {
    this.state = state;
    this.message = message;
    this.onStateChange({
      state,
      message,
      updateAvailable: state === 'available',
      checking: state === 'checking' || state === 'downloading',
    });
  }

  async init(registration) {
    if (!this.serviceWorker || !registration) {
      this.publish('unsupported', 'Automatic updates are unavailable in this browser.');
      return false;
    }

    this.registration = registration;
    this.serviceWorker.addEventListener('controllerchange', this.onControllerChange);
    this.registration.addEventListener('updatefound', this.onUpdateFound);
    this.watchInstallingWorker();
    this.syncRegistrationState();
    return true;
  }

  onControllerChange = () => {
    if (this.shouldReload) this.reload();
  };

  onUpdateFound = () => {
    this.watchInstallingWorker();
    this.syncRegistrationState();
  };

  onInstallingStateChange = () => {
    this.syncRegistrationState();
  };

  watchInstallingWorker() {
    const worker = this.registration?.installing;
    if (!worker || worker === this.observedWorker) return;
    this.observedWorker = worker;
    worker.addEventListener('statechange', this.onInstallingStateChange);
  }

  syncRegistrationState() {
    if (!this.registration) return;

    if (this.registration.waiting) {
      this.publish('available', 'A new Hero Run version is ready. Choose UPDATE NOW to install it.');
      return;
    }

    if (this.registration.installing) {
      this.publish('downloading', 'A new Hero Run version is downloading safely in the background.');
      return;
    }

    this.publish('current', 'Hero Run is up to date.');
  }

  async checkForUpdates() {
    if (!this.registration || this.checking) return false;

    this.checking = true;
    this.publish('checking', 'Checking for a newer Hero Run version…');
    try {
      await this.registration.update();
      this.watchInstallingWorker();
      this.syncRegistrationState();
      return true;
    } catch (error) {
      this.publish('error', 'Could not check for updates. Check your internet connection and try again.');
      return false;
    } finally {
      this.checking = false;
    }
  }

  applyUpdate() {
    const waitingWorker = this.registration?.waiting;
    if (!waitingWorker) {
      this.syncRegistrationState();
      return false;
    }

    this.shouldReload = true;
    this.publish('applying', 'Installing the update. The game will reload automatically.');
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  destroy() {
    this.serviceWorker?.removeEventListener('controllerchange', this.onControllerChange);
    this.registration?.removeEventListener('updatefound', this.onUpdateFound);
    this.observedWorker?.removeEventListener('statechange', this.onInstallingStateChange);
  }
}
