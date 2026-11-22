import './styles.css';
import { GameManager } from './game/GameManager.js';
import { UIManager } from './ui/UIManager.js';

const ui = new UIManager();
const game = new GameManager({ mount: document.querySelector('#game-canvas'), ui });
ui.bind({
  start: () => game.start(),
  pause: () => game.pause(),
  resume: () => game.resume(),
  restart: () => game.restart(),
  home: () => game.home(),
  hero: (key) => game.chooseHero(key),
  sound: (enabled) => game.setSound(enabled),
  music: (enabled) => game.setMusic(enabled),
  quality: (enabled) => game.setQuality(enabled),
  fullscreen: () => game.fullscreen(),
});
window.addEventListener('beforeunload', () => game.dispose(), { once: true });