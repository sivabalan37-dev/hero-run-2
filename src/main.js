import '../styles.css';
import { Game } from './game/Game.js';
import { HUD } from './ui/HUD.js';

const hud = new HUD();
const game = new Game({ mount: document.querySelector('#game-canvas'), hud });

hud.el.start.addEventListener('click', async () => {
  if (game.state === 'paused') game.resume();
  else await game.start();
});
hud.el.pause.addEventListener('click', () => game.state === 'paused' ? game.resume() : game.pause());
window.addEventListener('beforeunload', () => game.destroy(), { once: true });
