export class HUD {
  constructor() {
    this.root = document.querySelector('#hud'); this.scoreChip = document.querySelector('#score-chip');
    this.hearts = [...document.querySelectorAll('#health-hearts span')];
    this.coins = document.querySelector('#coins-value'); this.time = document.querySelector('#time-value');
    this.distance = document.querySelector('#distance-value'); this.score = document.querySelector('#score-value');
    this.avatar = document.querySelector('#hero-avatar'); this.toastRoot = document.querySelector('#toast'); this.toastTimer = null;
  }
  show() { this.root.classList.remove('hidden'); this.scoreChip.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); this.scoreChip.classList.add('hidden'); }
  update(player, score, elapsed) {
    this.hearts.forEach((heart, index) => heart.classList.toggle('empty', index >= player.health));
    this.coins.textContent = String(score.coins); this.time.textContent = String(Math.floor(elapsed));
    this.distance.textContent = Math.floor(score.distance) + ' m'; this.score.textContent = 'SCORE ' + score.score;
  }
  toast(message) {
    this.toastRoot.textContent = message; this.toastRoot.classList.remove('hidden');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastRoot.classList.add('hidden'), 1000);
  }
}