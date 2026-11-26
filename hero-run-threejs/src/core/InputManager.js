const KEYS = new Map([
  ['ArrowLeft','left'],['KeyA','left'],['ArrowRight','right'],['KeyD','right'],
  ['Space','jump'],['ArrowUp','jump'],['KeyW','jump'],['ArrowDown','slide'],['KeyS','slide'],
  ['KeyJ','attack'],['KeyK','special'],['Escape','pause'],
]);
export class InputManager {
  constructor() {
    this.down = new Set(); this.pressed = new Set(); this.touch = new Set(); this.cleanups = [];
    this.onDown = (event) => {
      const action = KEYS.get(event.code); if (!action) return; event.preventDefault();
      if (!this.down.has(action)) this.pressed.add(action); this.down.add(action);
    };
    this.onUp = (event) => { const action = KEYS.get(event.code); if (action) this.down.delete(action); };
    this.onBlur = () => this.clear();
    window.addEventListener('keydown', this.onDown, { passive: false });
    window.addEventListener('keyup', this.onUp); window.addEventListener('blur', this.onBlur);
    document.querySelectorAll('[data-action]').forEach((button) => this.bind(button));
    if (matchMedia('(pointer: coarse)').matches) document.querySelector('#touch-controls')?.classList.remove('hidden');
  }
  bind(button) {
    const action = button.dataset.action;
    const down = (event) => {
      event.preventDefault(); button.setPointerCapture?.(event.pointerId);
      if (!this.touch.has(action)) this.pressed.add(action);
      this.touch.add(action); button.classList.add('pressed');
    };
    const up = (event) => { event.preventDefault(); this.touch.delete(action); button.classList.remove('pressed'); };
    button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
    this.cleanups.push(() => {
      button.removeEventListener('pointerdown', down); button.removeEventListener('pointerup', up);
      button.removeEventListener('pointercancel', up); button.removeEventListener('lostpointercapture', up);
    });
  }
  isDown(action) { return this.down.has(action) || this.touch.has(action); }
  consume(action) { const found = this.pressed.has(action); this.pressed.delete(action); return found; }
  endFrame() { this.pressed.clear(); }
  clear() {
    this.down.clear(); this.pressed.clear(); this.touch.clear();
    document.querySelectorAll('[data-action]').forEach((button) => button.classList.remove('pressed'));
  }
  dispose() {
    window.removeEventListener('keydown', this.onDown); window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur); this.cleanups.forEach((fn) => fn()); this.clear();
  }
}