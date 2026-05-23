/**
 * data.ts — CSV 파싱 + localStorage 관리
 * CSV는 SSoT: dd_stage_config.csv, dd_block_config.csv
 */

/* ── 타입 정의 ── */
export type MissionType = 'BLOCK_COLLECTION' | 'SCORE_TARGET' | 'TILE_CLEAR';
export type BlockType = 'BLOCK_01' | 'BLOCK_02' | 'BLOCK_03' | 'BLOCK_04' | 'BLOCK_05';
export type IdleType = 'float' | 'shine' | 'pulse' | 'heartbeat' | 'spin';
export type BlockerKind = 'CHIP_RACK' | 'POKER_CARD' | 'DEALERS_SAFE' | 'ROULETTE_WHEEL';

export interface BlockerPlacement {
  blockerType: BlockerKind;
  row: number;
  col: number;
}

export interface StageConfig {
  stageId: number;
  missionType: MissionType;
  targetBlockType: BlockType | null;
  targetBlockCount: number;
  targetScore: number;
  targetTileCount: number;
  movesGiven: number;
  difficulty: 'easy' | 'normal' | 'hard';
  star1: number;
  star2: number;
  star3: number;
  blockerLayout: BlockerPlacement[];
}

export interface BlockConfig {
  blockType: BlockType;
  emoji: string;
  bgColor: number;       // 0xRRGGBB (Three.js hex)
  particleA: number;
  particleB: number;
  idleType: IdleType;
}

/* ── CSV 파서 (경량) ── */
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

/* ── 로딩 함수 ── */
export async function loadStageConfigs(): Promise<StageConfig[]> {
  const res = await fetch('/dd_stage_config.csv');
  const text = await res.text();
  return parseCSV(text).map(row => ({
    stageId:          parseInt(row['stage_id']) || 1,
    missionType:      (row['mission_type'] || 'SCORE_TARGET') as MissionType,
    targetBlockType:  row['target_block_type'] ? (row['target_block_type'] as BlockType) : null,
    targetBlockCount: parseInt(row['target_block_count']) || 0,
    targetScore:      parseInt(row['target_score']) || 0,
    targetTileCount:  parseInt(row['target_tile_count']) || 0,
    movesGiven:       parseInt(row['moves_given']) || 25,
    difficulty:       (row['difficulty'] || 'normal') as StageConfig['difficulty'],
    star1:            parseInt(row['star1']) || 500,
    star2:            parseInt(row['star2']) || 1000,
    star3:            parseInt(row['star3']) || 1500,
    blockerLayout:    row['blocker_layout'] ? (JSON.parse(row['blocker_layout']) as BlockerPlacement[]) : [],
  }));
}

export async function loadBlockConfigs(): Promise<BlockConfig[]> {
  const res = await fetch('/dd_block_config.csv');
  const text = await res.text();
  return parseCSV(text).map(row => ({
    blockType: row['block_type'] as BlockType,
    emoji:     row['emoji'] || '?',
    bgColor:   parseInt(row['bg_color'], 16) || 0x1d4ed8,
    particleA: parseInt(row['particle_a'], 16) || 0x0055ff,
    particleB: parseInt(row['particle_b'], 16) || 0x00ffff,
    idleType:  (row['idle_type'] || 'float') as IdleType,
  }));
}

/* ── localStorage 키 ── */
const LS_KEYS = {
  COINS:    'dd_coins',
  STAGE:    'dd_current_stage',
  STARS:    'dd_total_stars',
  SETTINGS: 'dd_settings',
} as const;

export const storage = {
  getCoins():    number { return parseInt(localStorage.getItem(LS_KEYS.COINS)  ?? '500'); },
  setCoins(v: number):void { localStorage.setItem(LS_KEYS.COINS,  String(v)); },
  addCoins(d: number):void { storage.setCoins(storage.getCoins() + d); },

  getStage():    number { return parseInt(localStorage.getItem(LS_KEYS.STAGE)  ?? '1'); },
  setStage(v: number):void { localStorage.setItem(LS_KEYS.STAGE,  String(v)); },

  getStars():    number { return parseInt(localStorage.getItem(LS_KEYS.STARS)  ?? '0'); },
  addStars(d: number):void { localStorage.setItem(LS_KEYS.STARS, String(storage.getStars() + d)); },
};
