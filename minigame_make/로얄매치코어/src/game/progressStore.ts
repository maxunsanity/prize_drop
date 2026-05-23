/**
 * progressStore.ts — 스테이지 진행 상태 localStorage 관리
 * PHASE 5: localStorage 세션 저장/복원
 */

const KEY = 'dd_progress';

export interface StageProgress {
  stars:     number;   // 0~3
  bestScore: number;
  completed: boolean;
}

export interface ProgressData {
  stages:       Record<number, StageProgress>;
  coins:        number;
  currentStage: number;
}

const DEFAULT_PROGRESS: ProgressData = {
  stages:       {},
  coins:        500,
  currentStage: 1,
};

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...(JSON.parse(raw) as Partial<ProgressData>) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function save(data: ProgressData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const progressStore = {
  get():       ProgressData { return load(); },
  getCoins():  number       { return load().coins; },
  getStage():  number       { return load().currentStage; },

  addCoins(delta: number): void {
    const d = load(); d.coins += delta; save(d);
  },

  setCurrentStage(id: number): void {
    const d = load(); d.currentStage = id; save(d);
  },

  completeStage(id: number, stars: number, score: number): void {
    const d = load();
    const prev = d.stages[id];
    d.stages[id] = {
      stars:     Math.max(stars, prev?.stars ?? 0),
      bestScore: Math.max(score, prev?.bestScore ?? 0),
      completed: true,
    };
    // 다음 스테이지 해금 (currentStage 자동 진행)
    if (id >= (d.currentStage)) {
      d.currentStage = id + 1;
    }
    d.coins += stars * 50 + 100;  // 클리어 보상
    save(d);
  },

  getStageProgress(id: number): StageProgress {
    return load().stages[id] ?? { stars: 0, bestScore: 0, completed: false };
  },

  /** 스테이지가 플레이 가능한지 (1스테이지 또는 이전 스테이지 완료) */
  isUnlocked(id: number, totalStages: number): boolean {
    if (id === 1) return true;
    if (id > totalStages) return false;
    return load().stages[id - 1]?.completed === true;
  },

  reset(): void {
    localStorage.removeItem(KEY);
  },
};
