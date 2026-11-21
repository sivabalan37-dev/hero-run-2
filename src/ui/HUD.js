export class HUD {
  constructor() {
    this.el = {
      root: document.querySelector('#hud'),
      overlay: document.querySelector('#overlay'),
      message: document.querySelector('#overlay-message'),
      best: document.querySelector('#best-value'),
      start: document.querySelector('#start-button'),
      health: document.querySelector('#health-value'),
      healthFill: document.querySelector('#health-fill'),
      coins: document.querySelector('#coins-value'),
      shards: document.querySelector('#shards-value'),
      distance: document.querySelector('#distance-value'),
      score: document.querySelector('#score-value'),
      pause: document.querySelector('#pause-button'),
      toast: document.querySelector('#toast'),
      status: document.querySelector('#status-note'),
      touch: document.querySelector('#touch-controls')
    };
    this.toastTimeout = null;
    if (matchMedia('(pointer: coarse)').matches) this.el.touch.classList.remove('hidden');
  }
  showMenu({ title = 'Run through the world, collect coins and shards, defeat enemies and keep your health up.', button = 'START RUN', best = 0, status = '' } = {}) {
    this.el.overlay.classList.remove('hidden'); this.el.root.classList.add('hidden');
    this.el.message.textContent = title; this.el.start.textContent = button;
    this.el.best.textContent = `${Math.floor(best)} m`; this.el.status.textContent = status;
  }
  hideMenu() { this.el.overlay.classList.add('hidden'); this.el.root.classList.remove('hidden'); }
  update(player, score) {
    this.el.health.textContent = String(player.health);
    this.el.healthFill.style.width = `${player.health}%`;
    this.el.healthFill.style.background = player.health < 30 ? 'linear-gradient(90deg,#ff4d66,#ffad51)' : 'linear-gradient(90deg,#42e49a,#f6d95a)';
    this.el.coins.textContent = String(score.coins);
    this.el.shards.textContent = String(score.shards);
    this.el.distance.textContent = `${score.distance} m`;
    this.el.score.textContent = `SCORE ${score.score}`;
  }
  toast(message) {
    this.el.toast.textContent = message; this.el.toast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.el.toast.classList.add('hidden'), 1150);
  }
  setPaused(paused) { this.el.pause.textContent = paused ? '▶' : 'Ⅱ'; }
}
