export class PauseMenu {
  constructor() { this.root = document.querySelector('#pause-overlay'); }
  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }
}