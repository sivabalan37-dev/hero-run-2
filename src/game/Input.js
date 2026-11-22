const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
  KeyJ: 'attack',
  KeyK: 'special',
  ArrowDown: 'slide', KeyS: 'slide'
};

export class Input {
  constructor(root) {
    this.down = new Set();
    this.pressed = new Set();
    this.touchHeld = new Set();
    this.destroyed = false;
    this.onKeyDown = (event) => {
      const action = KEY_MAP[event.code];
      if (!action) return;
      event.preventDefault();
      if (!this.down.has(action)) this.pressed.add(action);
      this.down.add(action);
    };
    this.onKeyUp = (event) => {
      const action = KEY_MAP[event.code];
      if (action) this.down.delete(action);
    };
    this.onBlur = () => this.clear();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.buttons = [...root.querySelectorAll('[data-action]')];
    this.buttonHandlers = this.buttons.map((button) => {
      const action = button.dataset.action;
      const start = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.touchHeld.add(action);
        button.classList.add('pressed');
        if (action === 'left' || action === 'right' || action === 'jump' || action === 'attack' || action === 'special' || action === 'slide') this.pressed.add(action);
      };
      const end = (event) => {
        event.preventDefault();
        this.touchHeld.delete(action);
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('lostpointercapture', end);
      return () => {
        button.removeEventListener('pointerdown', start);
        button.removeEventListener('pointerup', end);
        button.removeEventListener('pointercancel', end);
        button.removeEventListener('lostpointercapture', end);
      };
    });
  }

  isDown(action) { return this.down.has(action) || this.touchHeld.has(action); }
  consume(action) { const value = this.pressed.has(action); this.pressed.delete(action); return value; }
  endFrame() { this.pressed.clear(); }
  clear() { this.down.clear(); this.pressed.clear(); this.touchHeld.clear(); this.buttons.forEach((b) => b.classList.remove('pressed')); }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.buttonHandlers.forEach((dispose) => dispose());
    this.clear();
  }
}
