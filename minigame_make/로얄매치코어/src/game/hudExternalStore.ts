/**
 * hudExternalStore — flat path key-value store
 * BoardCore → React HUD 단방향 상태 동기화
 * SRC.md §$state paths 참조
 */

type Listener = (snapshot: Record<string, unknown>) => void;

const _state: Record<string, unknown> = {
  // HUD Top
  'moves.current': 25,
  'moves.warning': false,
  'target.icon': '♥',
  'target.label': 'COLLECT',
  'target.value': '20',
  // HUD Bottom
  'stars.count': 0,
  'stars.pct1': 0,
  'stars.pct2': 0,
  'stars.pct3': 0,
  'score.current': 0,
  // Items
  'item.hammer.count': 3,
  'item.hand.count': 3,
  'item.claw.count': 3,
  'item.hammer.active': false,
  'item.hand.active': false,
  'item.claw.active': false,
  // Stage
  'stage.id': 1,
  'stage.phase': 'IDLE',
};

const _listeners = new Set<Listener>();

export const hudExternalStore = {
  set(path: string, value: unknown): void {
    if (_state[path] === value) return; // 동일값 무시
    _state[path] = value;
    const snap = { ..._state };
    _listeners.forEach(l => l(snap));
  },

  setMany(entries: Record<string, unknown>): void {
    let changed = false;
    for (const [k, v] of Object.entries(entries)) {
      if (_state[k] !== v) { _state[k] = v; changed = true; }
    }
    if (changed) {
      const snap = { ..._state };
      _listeners.forEach(l => l(snap));
    }
  },

  get(path: string): unknown {
    return _state[path];
  },

  getAll(): Record<string, unknown> {
    return { ..._state };
  },

  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    // 즉시 현재 스냅샷 전달
    listener({ ..._state });
    return () => { _listeners.delete(listener); };
  },
};
