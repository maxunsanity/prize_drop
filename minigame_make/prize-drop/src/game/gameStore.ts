import { hudStore } from './hudExternalStore';

export const gameStore = {
  getSnapshot() {
    const s = hudStore.getSnapshot();
    return {
      ballCount: s['/hud/ball_count'] as number,
      multiplier: s['/hud/multiplier'] as number,
    };
  },
  subscribe(listener: () => void): () => void {
    return hudStore.subscribe(listener);
  },
  useBall(): boolean {
    const current = hudStore.getSnapshot()['/hud/ball_count'] as number;
    if (current <= 0) return false;
    hudStore.update({ '/hud/ball_count': current - 1 });
    return true;
  },
  addBalls(n: number) {
    const current = hudStore.getSnapshot()['/hud/ball_count'] as number;
    hudStore.update({ '/hud/ball_count': current + n });
  },
  setMultiplier(v: number) {
    hudStore.update({ '/hud/multiplier': v });
  },
};
