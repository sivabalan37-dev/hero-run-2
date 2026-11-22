const KEY_ACTIONS = new Map([
  ['ArrowLeft', 'left'], ['KeyA', 'left'],
  ['ArrowRight', 'right'], ['KeyD', 'right'],
  ['Space', 'jump'], ['ArrowUp', 'jump'], ['KeyW', 'jump'],
  ['KeyJ', 'attack'], ['KeyK', 'special'],
]);

export class AdventureInput {
  constructor(root = document) {
    this.root = root;
    this.keys = new Set();
    this.pointers = new Map();
    this.pressed = new Set();
    this.onKeyDown = (event) => {
      const action = KEY_ACTIONS.get(event.code);
      if (!action) return;
      if (action === 'jump' || action === 'left' || action === 'right') event.preventDefault();
      if (!this.keys.has(event.code)) this.pressed.add(action);
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onPointerDown = (event) => {
      const button = event.target.closest?.('[data-action]');
      if (!button || !root.contains(button)) return;
      const action = button.dataset.action;
      if (!action) return;
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      this.pointers.set(event.pointerId, { action, button });
      if (!this.isDown(action)) this.pressed.add(action);
      button.classList.add('pressed');
    };
    this.onPointerEnd = (event) => {
      const pointer = this.pointers.get(event.pointerId);
      if (!pointer) return;
      this.pointers.delete(event.pointerId);
      const stillHeld = [...this.pointers.values()].some(item => item.action === pointer.action);
      if (!stillHeld) pointer.button.classList.remove('pressed');
    };
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    root.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    root.addEventListener('pointerup', this.onPointerEnd);
    root.addEventListener('pointercancel', this.onPointerEnd);
    root.addEventListener('lostpointercapture', this.onPointerEnd);
    window.addEventListener('blur', this.clear);
  }

  isDown(action) {
    if ([...this.keys].some(code => KEY_ACTIONS.get(code) === action)) return true;
    return [...this.pointers.values()].some(pointer => pointer.action === action);
  }

  wasPressed(action) { return this.pressed.has(action); }
  consumePressed(action) {
    const value = this.pressed.has(action);
    this.pressed.delete(action);
    return value;
  }
  movement() { return Number(this.isDown('right')) - Number(this.isDown('left')); }
  endStep() { this.pressed.clear(); }
  clear = () => {
    this.keys.clear();
    for (const pointer of this.pointers.values()) pointer.button.classList.remove('pressed');
    this.pointers.clear();
    this.pressed.clear();
  };

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.root.removeEventListener('pointerdown', this.onPointerDown);
    this.root.removeEventListener('pointerup', this.onPointerEnd);
    this.root.removeEventListener('pointercancel', this.onPointerEnd);
    this.root.removeEventListener('lostpointercapture', this.onPointerEnd);
    window.removeEventListener('blur', this.clear);
    this.clear();
  }
}
