export class SettingsMenu {
  constructor() {
    this.root = document.querySelector('#settings-overlay');
    this.sound = document.querySelector('#sound-toggle'); this.music = document.querySelector('#music-toggle'); this.quality = document.querySelector('#quality-toggle');
  }
  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }
}