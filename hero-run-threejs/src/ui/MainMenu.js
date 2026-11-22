export class MainMenu {
  constructor() { this.root = document.querySelector('#menu-overlay'); this.best = document.querySelector('#best-value'); this.message = document.querySelector('#menu-description'); }
  show(best = 0) { this.root.classList.remove('hidden'); this.best.textContent = Math.floor(best) + ' m'; }
  hide() { this.root.classList.add('hidden'); }
}