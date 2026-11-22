export class EventManager {
  constructor() { this.listeners = new Map(); }
  on(type, callback) {
    const set = this.listeners.get(type) ?? new Set(); set.add(callback); this.listeners.set(type, set);
    return () => set.delete(callback);
  }
  emit(type, detail) { for (const callback of this.listeners.get(type) ?? []) callback(detail); }
  clear() { this.listeners.clear(); }
}