import { MainMenu } from './MainMenu.js';
import { HUD } from './HUD.js';
import { PauseMenu } from './PauseMenu.js';
import { SettingsMenu } from './SettingsMenu.js';
import { GameOverScreen } from './GameOverScreen.js';
import { LoadingScreen } from './LoadingScreen.js';

export class UIManager {
  constructor() {
    this.menu = new MainMenu(); this.hud = new HUD(); this.pause = new PauseMenu();
    this.settings = new SettingsMenu(); this.gameover = new GameOverScreen(); this.loading = new LoadingScreen();
    this.loadingTimer = setTimeout(() => this.loading.hide(), 450);
    this.callbacks = {};
  }
  bind(callbacks) {
    this.callbacks = callbacks;
    document.querySelector('#start-button').addEventListener('click', () => callbacks.start?.());
    document.querySelector('#pause-button').addEventListener('click', () => callbacks.pause?.());
    document.querySelector('#resume-button').addEventListener('click', () => callbacks.resume?.());
    document.querySelector('#continue-button').addEventListener('click', () => callbacks.resume?.());
    document.querySelector('#restart-button').addEventListener('click', () => callbacks.restart?.());
    document.querySelector('#pause-restart-button').addEventListener('click', () => callbacks.restart?.());
    document.querySelector('#again-button').addEventListener('click', () => callbacks.restart?.());
    document.querySelector('#home-button').addEventListener('click', () => callbacks.home?.());
    document.querySelector('#settings-button').addEventListener('click', () => this.showSettings());
    document.querySelector('#settings-close').addEventListener('click', () => this.hideSettings());
    document.querySelector('#sound-button').addEventListener('click', () => { const el=this.settings.sound; el.checked=!el.checked; callbacks.sound?.(el.checked); });
    document.querySelector('#fullscreen-button').addEventListener('click', () => callbacks.fullscreen?.());
    this.settings.sound.addEventListener('change', () => callbacks.sound?.(this.settings.sound.checked));
    this.settings.music.addEventListener('change', () => callbacks.music?.(this.settings.music.checked));
    this.settings.quality.addEventListener('change', () => callbacks.quality?.(this.settings.quality.checked));
    document.querySelectorAll('[data-hero]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-hero]').forEach((other) => other.classList.toggle('selected', other === button));
      callbacks.hero?.(button.dataset.hero);
    }));
  }
  showMenu(best) { this.closeOverlays(); this.menu.show(best); this.hud.hide(); }
  showHUD() { this.closeOverlays(); this.menu.hide(); this.hud.show(); }
  showPause() { this.pause.show(); }
  hidePause() { this.pause.hide(); }
  showSettings() { this.settings.show(); }
  hideSettings() { this.settings.hide(); }
  showGameOver(stats, best) { this.closeOverlays(); this.hud.hide(); this.gameover.show(stats, best); }
  update(player, score, elapsed) { this.hud.update(player, score, elapsed); }
  toast(message) { this.hud.toast(message); }
  setAvatar(emoji) { this.hud.avatar.textContent = emoji; }
  closeOverlays() { this.menu.hide(); this.pause.hide(); this.settings.hide(); this.gameover.hide(); }
}