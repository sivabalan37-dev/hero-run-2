export class LoadingScreen {
  constructor() { this.root = document.querySelector('#loading'); }
  hide() { this.root.classList.add('gone'); }
}