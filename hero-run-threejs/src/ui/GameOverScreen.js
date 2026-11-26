export class GameOverScreen {
  constructor() {
    this.root = document.querySelector('#gameover-overlay');
    this.summary = document.querySelector('#gameover-summary');
    this.distance = document.querySelector('#result-distance'); this.score = document.querySelector('#result-score'); this.coins = document.querySelector('#result-coins');
  }
  show(stats, best) {
    this.distance.textContent = stats.distance + ' m'; this.score.textContent = String(stats.score); this.coins.textContent = String(stats.coins);
    this.summary.textContent = 'Best journey: ' + Math.floor(best) + ' m. Ready for another run?';
    this.root.classList.remove('hidden');
  }
  hide() { this.root.classList.add('hidden'); }
}