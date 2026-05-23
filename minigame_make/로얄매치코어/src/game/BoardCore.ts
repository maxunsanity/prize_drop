/**
 * BoardCore.ts — 9x9 퍼즐 상태 머신 코어
 * 특수 블록 4종: COLOR_BOMB / STRIPED_H|V / PROPELLER / TNT
 */

import type { StageConfig, BlockConfig, BlockType, BlockerKind } from './data.js';
import { hudExternalStore } from './hudExternalStore.js';

/* ── 상수 ── */
export const GRID_ROWS = 9;
export const GRID_COLS = 9;
export const BLOCK_UNIT = 1.0;

/* ── 블록 종류 ── */
export type NormalBlock = BlockType;
export type SpecialBlock = 'STRIPED_H' | 'STRIPED_V' | 'PROPELLER' | 'COLOR_BOMB' | 'TNT';
export type BlockKind = NormalBlock | SpecialBlock;

export interface Block {
  id: number;
  kind: BlockKind;
  colorType: BlockType;
  row: number;
  col: number;
  hp: number;
  isNew: boolean;
}

/* ── 블로커 ── */
export { BlockerKind };
export interface Blocker {
  id: number;
  kind: BlockerKind;
  row: number;
  col: number;
  hp: number;
  faceRevealed: boolean;      // POKER_CARD 전용
  revealedType: BlockType | null; // POKER_CARD 전용
}

export type TileKind = 'PLAIN' | 'JELLY' | 'DOUBLE_JELLY';
export interface Tile { row: number; col: number; kind: TileKind; jellyHp: number; }

export type GamePhase =
  | 'INIT' | 'IDLE' | 'SWAP' | 'SWAP_BACK' | 'MATCH_CHECK'
  | 'EXPLODE' | 'DROP_SPAWN' | 'COMBO_CHECK' | 'BONUS_TIME'
  | 'RESULT_CHECK' | 'SUCCESS' | 'FAIL';

/* ── 이벤트 ── */
export type BoardEvent =
  | { type: 'SWAP_START'; r1: number; c1: number; r2: number; c2: number }
  | { type: 'SWAP_BACK'; r1: number; c1: number; r2: number; c2: number }
  | { type: 'MATCH_GROUP'; blocks: Block[]; specialCreated?: Block }
  | { type: 'EXPLODE'; blocks: Block[]; combo: number }
  | { type: 'BLOCK_SPAWN'; blocks: Block[] }
  | { type: 'BLOCK_DROP'; moves: { block: Block; toRow: number }[] }
  | { type: 'PHASE_CHANGE'; phase: GamePhase }
  | { type: 'SCORE_UPDATE'; score: number; delta: number }
  | { type: 'MOVES_UPDATE'; moves: number }
  | { type: 'TARGET_UPDATE'; collected: number; required: number }
  | { type: 'BONUS_TIME_START' }
  | { type: 'BONUS_TIME_END' }
  | { type: 'ITEM_USE'; item: 'HAMMER' | 'HAND' | 'CLAW'; targets: Block[] }
  | { type: 'SUCCESS'; stars: number; score: number }
  | { type: 'FAIL' }
  | { type: 'COLOR_BOMB_CHAIN'; targets: Block[]; comboIdx: number }
  | { type: 'STRIPED_FIRE'; row: number; col: number; dir: 'H' | 'V'; blocks: Block[] }
  | { type: 'TNT_FIRE'; row: number; col: number; blocks: Block[] }
  | { type: 'PROPELLER_FIRE'; row: number; col: number; targets: Block[]; phase: number }
  | { type: 'BOARD_RESET' }
  | { type: 'BLOCKER_SPAWN'; blockers: Blocker[] }
  | { type: 'BLOCKER_HIT';    blocker: Blocker; remainingHp: number }
  | { type: 'BLOCKER_REVEAL'; blocker: Blocker }
  | { type: 'BLOCKER_DESTROY'; blocker: Blocker };

type EventListener = (e: BoardEvent) => void;

/* ── 매치 그룹 ── */
interface MatchGroup {
  blocks: Block[];
  hint: 'NORMAL' | 'STRIPED_H' | 'STRIPED_V' | 'PROPELLER' | 'COLOR_BOMB' | 'TNT';
}

/* ── 유틸 ── */
let _idCounter = 1;
function newId(): number { return _idCounter++; }
function rand(n: number): number { return Math.floor(Math.random() * n); }

/* ── BoardCore ── */
export class BoardCore {
  grid: (Block | null)[][] = [];
  tiles: Tile[][] = [];
  blockerGrid: (Blocker | null)[][] = [];

  phase: GamePhase = 'INIT';
  score = 0;
  moves = 0;
  combo = 0;
  targetCollected = 0;
  bonusTimeActive = false;
  private _rouletteHitIds = new Set<number>(); // 이번 턴 타격된 룰렛휠 ID

  stageConfig!: StageConfig;
  blockConfigs!: BlockConfig[];
  blockTypes: BlockType[] = [];

  private _listeners = new Set<EventListener>();
  private _locked = false;

  get isLocked(): boolean { return this._locked; }

  /* ── 초기화 ── */
  init(stage: StageConfig, blocks: BlockConfig[]): void {
    this.stageConfig = stage;
    this.blockConfigs = blocks;
    this.blockTypes = blocks.map(b => b.blockType) as BlockType[];
    this.score = 0;
    this.moves = stage.movesGiven;
    this.combo = 0;
    this.targetCollected = 0;
    this.bonusTimeActive = false;
    _idCounter = 1;

    this._rouletteHitIds.clear();
    this.tiles = Array.from({ length: GRID_ROWS }, (_, r) =>
      Array.from({ length: GRID_COLS }, (_, c) => ({ row: r, col: c, kind: 'PLAIN' as TileKind, jellyHp: 0 }))
    );
    this.blockerGrid = Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => null));
    this.grid = Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => null));
    this._initBlockers();
    this._fillGrid();
    this._ensureNoInitialMatches();
    this._placeStartSpecials();

    this._emit({ type: 'BOARD_RESET' });
    this._setPhase('IDLE');
    this.syncHud();
  }

  on(listener: EventListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
  private _emit(e: BoardEvent): void { this._listeners.forEach(l => l(e)); }

  private _setPhase(p: GamePhase): void {
    this.phase = p;
    this._locked = p !== 'IDLE';
    this._emit({ type: 'PHASE_CHANGE', phase: p });
    hudExternalStore.set('stage.phase', p);
  }

  private _fillGrid(): void {
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (!this.grid[r][c] && !this._isCellBlockedByBlocker(r, c))
          this.grid[r][c] = this._newBlock(r, c);
  }

  /** 비-통과형 블로커가 해당 셀을 점유 중인지 */
  private _isCellBlockedByBlocker(r: number, c: number): boolean {
    const bl = this.blockerGrid[r]?.[c];
    return !!bl && bl.kind !== 'POKER_CARD';
  }

  private _newBlock(row: number, col: number, colorType?: BlockType): Block {
    const ct = colorType ?? this.blockTypes[rand(this.blockTypes.length)];
    return { id: newId(), kind: ct, colorType: ct, row, col, hp: 1, isNew: true };
  }

  private _ensureNoInitialMatches(): void {
    let changed = true; let safety = 0;
    while (changed && safety++ < 100) {
      changed = false;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const b = this.grid[r][c]; if (!b) continue;
          if (c >= 2 && this.grid[r][c-1]?.colorType === b.colorType && this.grid[r][c-2]?.colorType === b.colorType) {
            b.colorType = this._differentColor(b.colorType); (b as Block).kind = b.colorType; changed = true;
          }
          if (r >= 2 && this.grid[r-1][c]?.colorType === b.colorType && this.grid[r-2][c]?.colorType === b.colorType) {
            b.colorType = this._differentColor(b.colorType); (b as Block).kind = b.colorType; changed = true;
          }
        }
      }
    }
  }

  private _differentColor(except: BlockType): BlockType {
    const opts = this.blockTypes.filter(t => t !== except);
    return opts[rand(opts.length)];
  }

  /** 시작 보드에 4종 특수 블록 각 1개 배치 (테스트용) */
  private _placeStartSpecials(): void {
    // [row, col, kind] 목표 위치
    const placements: [number, number, SpecialBlock][] = [
      [4, 4, 'COLOR_BOMB'],   // 정중앙
      [1, 2, 'STRIPED_H'],    // 상단 좌측
      [1, 6, 'STRIPED_V'],    // 상단 우측
      [7, 2, 'PROPELLER'],    // 하단 좌측
      [7, 6, 'TNT'],          // 하단 우측
    ];
    for (const [row, col, kind] of placements) {
      const base = this.grid[row][col];
      if (base && !this._isSpecial(base)) {
        this.grid[row][col] = { ...base, id: newId(), kind, hp: 1, isNew: false };
      }
    }
  }

  /* ── 스왑 처리 ── */
  static readonly SWAP_ANIM_MS = 160;

  swap(r1: number, c1: number, r2: number, c2: number): void {
    if (this._locked) return;
    if (!this._isAdjacent(r1, c1, r2, c2)) return;
    const b1 = this.grid[r1][c1];
    const b2 = this.grid[r2][c2];
    if (!b1 || !b2) return;

    const b1Sp = this._isSpecial(b1);
    const b2Sp = this._isSpecial(b2);

    this._setPhase('SWAP');
    this._emit({ type: 'SWAP_START', r1, c1, r2, c2 });
    this._doSwap(r1, c1, r2, c2);

    const matches = this._findAllMatches();
    const specialSwap = b1Sp || b2Sp;

    if (matches.length > 0 || specialSwap) {
      this.moves--;
      this._emit({ type: 'MOVES_UPDATE', moves: this.moves });
      hudExternalStore.set('moves.current', this.moves);
      hudExternalStore.set('moves.warning', this.moves <= 5);
      this.combo = 0;

      setTimeout(() => {
        this._setPhase('MATCH_CHECK');
        // 특수 블록을 fake 그룹으로 추가 → _processMatches에서 발동
        const extraGroups: MatchGroup[] = [];
        if (b1Sp) extraGroups.push({ blocks: [b1], hint: 'NORMAL' });
        if (b2Sp) extraGroups.push({ blocks: [b2], hint: 'NORMAL' });
        this._processMatches([...matches, ...extraGroups]);
      }, BoardCore.SWAP_ANIM_MS);
    } else {
      this._doSwap(r1, c1, r2, c2);
      this._setPhase('SWAP_BACK');
      this._emit({ type: 'SWAP_BACK', r1, c1, r2, c2 });
      setTimeout(() => this._setPhase('IDLE'), 260);
    }
  }

  private _doSwap(r1: number, c1: number, r2: number, c2: number): void {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
    if (this.grid[r1][c1]) { this.grid[r1][c1]!.row = r1; this.grid[r1][c1]!.col = c1; }
    if (this.grid[r2][c2]) { this.grid[r2][c2]!.row = r2; this.grid[r2][c2]!.col = c2; }
  }

  private _isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
    return (Math.abs(r1-r2) === 1 && c1 === c2) || (Math.abs(c1-c2) === 1 && r1 === r2);
  }

  /* ── 매치 감지 ── */
  private _isSpecial(b: Block): boolean {
    return b.kind === 'STRIPED_H' || b.kind === 'STRIPED_V' ||
           b.kind === 'PROPELLER'  || b.kind === 'COLOR_BOMB' || b.kind === 'TNT';
  }

  private _findAllMatches(): MatchGroup[] {
    interface Run { blocks: Block[]; dir: 'H' | 'V'; used: boolean }
    const hRuns: Run[] = [];
    const vRuns: Run[] = [];

    // 가로 run 수집 (3+)
    for (let r = 0; r < GRID_ROWS; r++) {
      let run: Block[] = [];
      for (let c = 0; c <= GRID_COLS; c++) {
        const b = c < GRID_COLS ? this.grid[r][c] : null;
        const ok = b && !this._isSpecial(b);
        if (ok && run.length > 0 && b!.colorType === run[run.length-1].colorType) {
          run.push(b!);
        } else {
          if (run.length >= 3) hRuns.push({ blocks: [...run], dir: 'H', used: false });
          run = ok ? [b!] : [];
        }
      }
    }
    // 세로 run 수집 (3+)
    for (let c = 0; c < GRID_COLS; c++) {
      let run: Block[] = [];
      for (let r = 0; r <= GRID_ROWS; r++) {
        const b = r < GRID_ROWS ? this.grid[r][c] : null;
        const ok = b && !this._isSpecial(b);
        if (ok && run.length > 0 && b!.colorType === run[run.length-1].colorType) {
          run.push(b!);
        } else {
          if (run.length >= 3) vRuns.push({ blocks: [...run], dir: 'V', used: false });
          run = ok ? [b!] : [];
        }
      }
    }

    const groups: MatchGroup[] = [];
    const matched = new Set<number>();

    // 1. L/T 교차 감지 → TNT (가로 run + 세로 run 교차, 합산 5개 이상)
    for (const h of hRuns) {
      if (h.used) continue;
      for (const v of vRuns) {
        if (v.used) continue;
        if (h.blocks[0].colorType !== v.blocks[0].colorType) continue;
        const hRow = h.blocks[0].row;
        const vCol = v.blocks[0].col;
        if (!h.blocks.some(b => b.col === vCol) || !v.blocks.some(b => b.row === hRow)) continue;
        // 교차 확인됨
        const dedup = new Map<number, Block>();
        [...h.blocks, ...v.blocks].forEach(b => dedup.set(b.id, b));
        const all = [...dedup.values()];
        if (all.length >= 5 && !all.some(b => matched.has(b.id))) {
          all.forEach(b => matched.add(b.id));
          groups.push({ blocks: all, hint: 'TNT' });
          h.used = true; v.used = true; break;
        }
      }
    }

    // 2. 나머지 run 처리
    const processRun = (run: Run): void => {
      if (run.used || run.blocks.some(b => matched.has(b.id))) return;
      run.blocks.forEach(b => matched.add(b.id));
      const len = run.blocks.length;
      let hint: MatchGroup['hint'];
      if      (len >= 5)          hint = 'COLOR_BOMB';
      else if (len === 4)         hint = run.dir === 'H' ? 'STRIPED_H' : 'STRIPED_V';
      else                        hint = 'NORMAL';
      groups.push({ blocks: run.blocks, hint });
    };
    hRuns.forEach(processRun);
    vRuns.forEach(processRun);

    // 3. 2×2 같은 색 → PROPELLER
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const tl = this.grid[r][c];   const tr = this.grid[r][c+1];
        const bl = this.grid[r+1][c]; const br = this.grid[r+1][c+1];
        if (!tl || !tr || !bl || !br) continue;
        if ([tl,tr,bl,br].some(b => this._isSpecial(b))) continue;
        if (tl.colorType !== tr.colorType || tl.colorType !== bl.colorType || tl.colorType !== br.colorType) continue;
        if ([tl,tr,bl,br].some(b => matched.has(b.id))) continue;
        [tl,tr,bl,br].forEach(b => matched.add(b.id));
        groups.push({ blocks: [tl,tr,bl,br], hint: 'PROPELLER' });
      }
    }

    return groups;
  }

  /* ── 매치 처리 → 특수 생성 → 폭발 ── */
  private _processMatches(groups: MatchGroup[]): void {
    const allBlocks: Block[] = [];

    for (const group of groups) {
      const { blocks, hint } = group;

      // 특수 블록 생성 여부 결정
      let special: Block | null = null;

      if (hint === 'COLOR_BOMB' && !this._isSpecial(blocks[0])) {
        const pivot = blocks[Math.floor(blocks.length / 2)];
        special = { ...pivot, id: newId(), kind: 'COLOR_BOMB', hp: 1, isNew: false };
      } else if ((hint === 'STRIPED_H' || hint === 'STRIPED_V') && !this._isSpecial(blocks[0])) {
        const pivot = blocks[Math.floor(blocks.length / 2)];
        special = { ...pivot, id: newId(), kind: hint, hp: 1, isNew: false };
      } else if (hint === 'TNT' && !this._isSpecial(blocks[0])) {
        // 교차점 (중앙에 가장 가까운 블록) 피벗
        const cx = (GRID_ROWS - 1) / 2; const cy = (GRID_COLS - 1) / 2;
        const pivot = blocks.reduce((a, b) =>
          Math.abs(a.row-cx)+Math.abs(a.col-cy) < Math.abs(b.row-cx)+Math.abs(b.col-cy) ? a : b
        );
        special = { ...pivot, id: newId(), kind: 'TNT', hp: 1, isNew: false };
      } else if (hint === 'PROPELLER' && !this._isSpecial(blocks[0])) {
        const pivot = blocks[0]; // top-left
        special = { ...pivot, id: newId(), kind: 'PROPELLER', hp: 1, isNew: false };
      }

      if (special) {
        this.grid[special.row][special.col] = special;
        allBlocks.push(...blocks.filter(b => !(b.row === special!.row && b.col === special!.col)));
        this._emit({ type: 'MATCH_GROUP', blocks, specialCreated: special });
      } else {
        allBlocks.push(...blocks);
        this._emit({ type: 'MATCH_GROUP', blocks });
      }
    }

    const unique = [...new Map(allBlocks.map(b => [b.id, b])).values()];
    this._collectTargets(unique);

    const baseScore = unique.filter(b => !this._isSpecial(b)).length * 50 * (this.combo + 1);
    if (baseScore > 0) {
      this.score += baseScore;
      this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: baseScore });
      hudExternalStore.set('score.current', this.score);
    }

    this.combo++;
    this._setPhase('EXPLODE');
    unique.forEach(b => { this.grid[b.row][b.col] = null; });
    this._emit({ type: 'EXPLODE', blocks: unique, combo: this.combo });

    // 블로커 피해 (일반 매치 = 비특수)
    this._damageAdjacentBlockers(unique, false);
    this._triggerSpecialChains(unique);
    this._updateStarGauge();

    // 특수 종류에 따라 DROP_SPAWN 딜레이 조정
    const hasColorBomb  = unique.some(b => b.kind === 'COLOR_BOMB');
    const hasPropeller  = unique.some(b => b.kind === 'PROPELLER');
    const hasAnySpecial = unique.some(b => this._isSpecial(b));
    const delay = hasColorBomb ? 1100 : hasPropeller ? 700 : hasAnySpecial ? 380 : 380;
    setTimeout(() => this._dropAndSpawn(), delay);
  }

  private _collectTargets(exploded: Block[]): void {
    const { missionType, targetBlockType, targetBlockCount } = this.stageConfig;
    if (missionType === 'BLOCK_COLLECTION' && targetBlockType) {
      const cnt = exploded.filter(b => b.colorType === targetBlockType).length;
      this.targetCollected += cnt;
      const needed = targetBlockCount - this.targetCollected;
      this._emit({ type: 'TARGET_UPDATE', collected: this.targetCollected, required: Math.max(0, needed) });
      hudExternalStore.set('target.value', String(Math.max(0, targetBlockCount - this.targetCollected)));
    }
  }

  /* ── 특수 블록 연쇄 처리 ── */
  private _triggerSpecialChains(exploded: Block[]): void {
    const specials = exploded.filter(b => this._isSpecial(b));
    if (specials.length === 0) return;
    if (specials.length >= 2) { this._handleSynergy(specials); return; }
    setTimeout(() => this._activateSpecial(specials[0]), 120);
  }

  private _activateSpecial(b: Block): void {
    switch (b.kind) {
      case 'STRIPED_H':   this._explodeRow(b.row, b); break;
      case 'STRIPED_V':   this._explodeCol(b.col, b); break;
      case 'PROPELLER':   this._explodePropeller(b); break;
      case 'TNT':         this._explodeTNT(b); break;
      case 'COLOR_BOMB':  this._explodeColorBomb(b); break;
    }
  }

  /* ── 로켓 (STRIPED) — 행/열 전체 ── */
  private _explodeRow(row: number, source: Block): void {
    const normalTargets: Block[] = [];
    const chainSpecials: Block[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const b = this.grid[row][c];
      if (!b || b.id === source.id) continue;
      this.grid[row][c] = null;
      if (this._isSpecial(b)) chainSpecials.push(b);
      else normalTargets.push(b);
    }
    const allTargets = [...normalTargets, ...chainSpecials];
    if (allTargets.length === 0 && !this.blockerGrid[row]?.some(bl => bl)) return;
    this._collectTargets(normalTargets);
    const pts = normalTargets.length * 60;
    if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
    this._emit({ type: 'STRIPED_FIRE', row, col: source.col, dir: 'H', blocks: allTargets });
    if (allTargets.length > 0) this._emit({ type: 'EXPLODE', blocks: allTargets, combo: this.combo });
    if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
    // 행 전체 블로커 직접 타격
    for (let c = 0; c < GRID_COLS; c++) {
      const bl = this.blockerGrid[row]?.[c];
      if (bl) this._applyBlockerDamage(bl, true);
    }
    this._damageAdjacentBlockers(normalTargets, true);
    // 레이저가 관통한 특수 블록 연쇄 발동 (200ms 후, 150ms 간격)
    if (chainSpecials.length > 0) {
      chainSpecials.forEach((s, i) => {
        setTimeout(() => this._activateSpecial(s), 200 + i * 150);
      });
    }
  }

  private _explodeCol(col: number, source: Block): void {
    const normalTargets: Block[] = [];
    const chainSpecials: Block[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const b = this.grid[r][col];
      if (!b || b.id === source.id) continue;
      this.grid[r][col] = null;
      if (this._isSpecial(b)) chainSpecials.push(b);
      else normalTargets.push(b);
    }
    const allTargets = [...normalTargets, ...chainSpecials];
    if (allTargets.length === 0 && !this.blockerGrid.some(row => row[col])) return;
    this._collectTargets(normalTargets);
    const pts = normalTargets.length * 60;
    if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
    this._emit({ type: 'STRIPED_FIRE', row: source.row, col, dir: 'V', blocks: allTargets });
    if (allTargets.length > 0) this._emit({ type: 'EXPLODE', blocks: allTargets, combo: this.combo });
    if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
    // 열 전체 블로커 직접 타격
    for (let r = 0; r < GRID_ROWS; r++) {
      const bl = this.blockerGrid[r]?.[col];
      if (bl) this._applyBlockerDamage(bl, true);
    }
    this._damageAdjacentBlockers(normalTargets, true);
    // 레이저가 관통한 특수 블록 연쇄 발동 (200ms 후, 150ms 간격)
    if (chainSpecials.length > 0) {
      chainSpecials.forEach((s, i) => {
        setTimeout(() => this._activateSpecial(s), 200 + i * 150);
      });
    }
  }

  /* ── 프로펠러 — 발동위치 4방향 즉시 제거 → 날아가서 원거리 1개 제거 ── */
  private _explodePropeller(b: Block): void {
    // Phase 0: 발동 위치 상하좌우 4칸 제거 (특수 블록 포함 → 연쇄)
    const nearNormal: Block[] = [];
    const nearSpecials: Block[] = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = b.row + dr; const nc = b.col + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      const nb = this.grid[nr][nc];
      if (!nb) continue;
      this.grid[nr][nc] = null;
      if (this._isSpecial(nb)) nearSpecials.push(nb);
      else nearNormal.push(nb);
    }
    const nearAll = [...nearNormal, ...nearSpecials];
    if (nearAll.length > 0) {
      this._collectTargets(nearNormal);
      const pts = nearNormal.length * 80;
      if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
      this._emit({ type: 'PROPELLER_FIRE', row: b.row, col: b.col, targets: nearAll, phase: 0 });
      this._emit({ type: 'EXPLODE', blocks: nearAll, combo: this.combo });
      if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
      // 인접 특수 블록 연쇄 발동 (250ms 후)
      nearSpecials.forEach((s, i) => {
        setTimeout(() => this._activateSpecial(s), 250 + i * 150);
      });
    }

    // Phase 1: 400ms 후 원거리 타겟 1개로 날아가서 제거 (특수 블록도 타겟 가능 → 연쇄)
    setTimeout(() => {
      const candidates: Block[] = [];
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++) {
          const nb = this.grid[r][c];
          if (nb) candidates.push(nb); // 특수 블록 포함
        }
      if (candidates.length === 0) return;

      const target = this._propellerSelectTarget(candidates);
      this.grid[target.row][target.col] = null;
      const isSpecialTarget = this._isSpecial(target);

      if (!isSpecialTarget) this._collectTargets([target]);
      const pts = isSpecialTarget ? 0 : 80;
      if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
      this._emit({ type: 'PROPELLER_FIRE', row: b.row, col: b.col, targets: [target], phase: 1 });
      this._emit({ type: 'EXPLODE', blocks: [target], combo: this.combo });
      if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });

      // 날아가서 특수 블록을 맞췄으면 연쇄 발동 (비행 280ms 완료 후)
      if (isSpecialTarget) {
        setTimeout(() => this._activateSpecial(target), 300);
      }
    }, 400);
  }

  /**
   * 프로펠러 타겟팅 AI
   * 우선순위: 미션 목표 블록 > 코너/엣지 > 고립 블록 > 랜덤
   */
  private _propellerSelectTarget(candidates: Block[]): Block {
    const { missionType, targetBlockType } = this.stageConfig;

    // 1순위: 미션 목표 블록 타입 우선
    if (missionType === 'BLOCK_COLLECTION' && targetBlockType) {
      const missionBlocks = candidates.filter(b => b.colorType === targetBlockType);
      if (missionBlocks.length > 0) return missionBlocks[rand(missionBlocks.length)];
    }

    // 2순위: 위치 기반 점수 (접근 어려운 위치 우선)
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const b of candidates) {
      let score = 0;
      const atRow0orEnd = b.row === 0 || b.row === GRID_ROWS - 1;
      const atCol0orEnd = b.col === 0 || b.col === GRID_COLS - 1;
      if (atRow0orEnd && atCol0orEnd) score += 4;   // 코너
      else if (atRow0orEnd || atCol0orEnd) score += 2; // 엣지

      // 같은 색 이웃 적을수록 고립 → 매치 어렵 → 점수 +
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nb = this.grid[b.row + dr]?.[b.col + dc];
        if (nb?.colorType === b.colorType) score -= 0.6;
      }
      score += Math.random() * 1.5; // 약간의 랜덤성
      if (score > bestScore) { bestScore = score; best = b; }
    }
    return best;
  }

  /* ── TNT — 5×5 폭발 + 범위 내 특수 블록 연쇄 ── */
  private _explodeTNT(b: Block): void {
    const RADIUS = 2; // 5×5
    const normalTargets: Block[] = [];
    const chainSpecials: Block[] = [];

    for (let dr = -RADIUS; dr <= RADIUS; dr++) {
      for (let dc = -RADIUS; dc <= RADIUS; dc++) {
        const r = b.row + dr; const c = b.col + dc;
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
        const nb = this.grid[r][c];
        if (!nb || nb.id === b.id) continue;
        this.grid[r][c] = null;
        if (this._isSpecial(nb)) chainSpecials.push(nb); // 연쇄 대상
        else normalTargets.push(nb);
      }
    }

    // 5×5 범위 블로커 직접 타격
    for (let dr = -RADIUS; dr <= RADIUS; dr++)
      for (let dc = -RADIUS; dc <= RADIUS; dc++) {
        const r = b.row + dr, c = b.col + dc;
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
        const bl = this.blockerGrid[r]?.[c];
        if (bl) this._applyBlockerDamage(bl, true);
      }

    const allTargets = [...normalTargets, ...chainSpecials];
    if (allTargets.length === 0) return;

    this._collectTargets(normalTargets);
    const pts = normalTargets.length * 80;
    if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
    this._emit({ type: 'TNT_FIRE', row: b.row, col: b.col, blocks: allTargets });
    this._emit({ type: 'EXPLODE', blocks: allTargets, combo: this.combo });
    if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
    this._damageAdjacentBlockers(normalTargets, true);

    // 범위 내 특수 블록 연쇄 발동 (폭발 후 300ms, 각 150ms 간격)
    if (chainSpecials.length > 0) {
      chainSpecials.forEach((s, i) => {
        setTimeout(() => this._activateSpecial(s), 300 + i * 150);
      });
    }
  }

  /* ── COLOR_BOMB — 같은 색 전체 ── */
  private _explodeColorBomb(bomb: Block): void {
    const targetColor = bomb.colorType;
    const targets: Block[] = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b && b.colorType === targetColor && b.id !== bomb.id) targets.push(b);
      }

    targets.sort((a, b) => {
      const da = Math.abs(a.row-bomb.row)+Math.abs(a.col-bomb.col);
      const db = Math.abs(b.row-bomb.row)+Math.abs(b.col-bomb.col);
      return da - db;
    });

    targets.forEach((t, i) => {
      setTimeout(() => {
        const cur = this.grid[t.row]?.[t.col];
        if (!cur || cur.id !== t.id) return; // 이미 제거됐거나 다른 블록으로 교체됨
        this.grid[t.row][t.col] = null;
        this._collectTargets([t]);
        const pts = 100;
        this.score += pts; hudExternalStore.set('score.current', this.score);
        this._emit({ type: 'COLOR_BOMB_CHAIN', targets: [t], comboIdx: i });
        this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
      }, i * 18);
    });
  }

  /* ── 시너지 (두 특수 동시 발동) ── */
  private _handleSynergy(specials: Block[]): void {
    const a = specials[0]; const b = specials[1];
    const kA = a.kind; const kB = b.kind;

    const isBomb  = (k: BlockKind) => k === 'COLOR_BOMB';
    const isStrip = (k: BlockKind) => k === 'STRIPED_H' || k === 'STRIPED_V';
    const isProp  = (k: BlockKind) => k === 'PROPELLER';
    const isTNT   = (k: BlockKind) => k === 'TNT';

    setTimeout(() => {
      if (isBomb(kA) && isBomb(kB)) {
        this._explodeAll();
      } else if (isBomb(kA) || isBomb(kB)) {
        const bomb = isBomb(kA) ? a : b;
        const other = isBomb(kA) ? b : a;
        if (isStrip(other.kind)) {
          // 같은 색 전체를 STRIPED로 변환 후 발동
          this._colorBombStriped(bomb.colorType, other.kind as 'STRIPED_H' | 'STRIPED_V');
        } else if (isTNT(other.kind)) {
          // 같은 색 전체 TNT
          this._colorBombTNT(bomb.colorType);
        } else if (isProp(other.kind)) {
          // 같은 색 전체를 PROPELLER로 변환 후 순차 발동
          this._colorBombPropeller(bomb.colorType);
        } else {
          this._explodeColorBomb(bomb);
        }
      } else if (isStrip(kA) && isStrip(kB)) {
        this._explodeRow(a.row, a); this._explodeCol(b.col, b);
      } else if ((isStrip(kA) && isProp(kB)) || (isProp(kA) && isStrip(kB))) {
        // 3행 + 3열
        const str = isStrip(kA) ? a : b;
        const prop = isProp(kA) ? a : b;
        for (let d = -1; d <= 1; d++) {
          this._explodeRow(prop.row + d, str);
          this._explodeCol(prop.col + d, str);
        }
      } else if (isTNT(kA) && isTNT(kB)) {
        // 7×7
        this._explodeArea(a.row, a.col, 3);
      } else if ((isProp(kA) && isTNT(kB)) || (isTNT(kA) && isProp(kB))) {
        // 프로펠러+TNT: 3회 랜덤 위치 TNT 폭발
        for (let phase = 0; phase < 3; phase++) {
          setTimeout(() => {
            const cands: Block[] = [];
            for (let r = 0; r < GRID_ROWS; r++)
              for (let c = 0; c < GRID_COLS; c++) {
                const nb = this.grid[r][c]; if (nb) cands.push(nb);
              }
            if (cands.length === 0) return;
            const tgt = cands[rand(cands.length)];
            const fakeTNT: Block = { ...tgt, id: newId(), kind: 'TNT' };
            this._explodeTNT(fakeTNT);
          }, phase * 420 + 120);
        }
      } else {
        specials.forEach(s => this._activateSpecial(s));
      }
    }, 120);
  }

  private _explodeAll(): void {
    const targets: Block[] = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b) { targets.push(b); this.grid[r][c] = null; }
      }
    if (targets.length === 0) return;
    this._collectTargets(targets);
    this.score += targets.length * 150;
    hudExternalStore.set('score.current', this.score);
    this._emit({ type: 'EXPLODE', blocks: targets, combo: this.combo });
  }

  private _explodeArea(cr: number, cc: number, radius: number): void {
    const normalTargets: Block[] = [];
    const chainSpecials: Block[] = [];

    for (let dr = -radius; dr <= radius; dr++)
      for (let dc = -radius; dc <= radius; dc++) {
        const r = cr + dr; const c = cc + dc;
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
        const b = this.grid[r][c];
        if (!b) continue;
        this.grid[r][c] = null;
        if (this._isSpecial(b)) chainSpecials.push(b);
        else normalTargets.push(b);
      }

    const allTargets = [...normalTargets, ...chainSpecials];
    if (allTargets.length === 0) return;

    this._collectTargets(normalTargets);
    const pts = normalTargets.length * 80;
    if (pts > 0) { this.score += pts; hudExternalStore.set('score.current', this.score); }
    this._emit({ type: 'EXPLODE', blocks: allTargets, combo: this.combo });
    if (pts > 0) this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });

    // 범위 내 특수 블록 연쇄 발동
    if (chainSpecials.length > 0) {
      chainSpecials.forEach((s, i) => {
        setTimeout(() => this._activateSpecial(s), 400 + i * 150);
      });
    }
  }

  private _colorBombStriped(targetColor: BlockType, kind: 'STRIPED_H' | 'STRIPED_V'): void {
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b && b.colorType === targetColor && !this._isSpecial(b)) {
          b.kind = kind;
          setTimeout(() => {
            if (kind === 'STRIPED_H') this._explodeRow(b.row, b);
            else this._explodeCol(b.col, b);
            // 소스 블록 자체도 그리드에서 제거 (orphan 방지)
            if (this.grid[b.row]?.[b.col]?.id === b.id) {
              this.grid[b.row][b.col] = null;
              this._emit({ type: 'EXPLODE', blocks: [b], combo: this.combo });
            }
          }, Math.random() * 200);
        }
      }
  }

  private _colorBombTNT(targetColor: BlockType): void {
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b && b.colorType === targetColor && !this._isSpecial(b)) {
          b.kind = 'TNT';
          setTimeout(() => {
            this._explodeTNT(b);
            // 소스 블록 자체도 그리드에서 제거 (orphan 방지)
            if (this.grid[b.row]?.[b.col]?.id === b.id) {
              this.grid[b.row][b.col] = null;
              this._emit({ type: 'EXPLODE', blocks: [b], combo: this.combo });
            }
          }, Math.random() * 300);
        }
      }
  }

  private _colorBombPropeller(targetColor: BlockType): void {
    // 같은 색 블록 전체를 그리드에서 제거 → PROPELLER로 변환 → 순차 발동
    const propellers: Block[] = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b && b.colorType === targetColor && !this._isSpecial(b)) {
          this.grid[r][c] = null;
          b.kind = 'PROPELLER';
          propellers.push(b);
        }
      }
    if (propellers.length === 0) return;

    // 제거 이벤트 (메시 사라짐)
    this._emit({ type: 'EXPLODE', blocks: propellers, combo: this.combo });

    // 각 프로펠러 순차 발동 (200ms 간격)
    propellers.forEach((p, i) => {
      setTimeout(() => this._explodePropeller(p), i * 200);
    });
  }

  /* ══════════════════════════════════════════
     블로커 시스템
  ══════════════════════════════════════════ */

  /** 스테이지 설정 + 테스트 배치로 블로커 초기화 */
  private _initBlockers(): void {
    const placements = this.stageConfig.blockerLayout ?? [];
    // CSV blocker_layout 그대로 사용 (없으면 블로커 없음)
    const testLayout = placements;

    const maxHp: Record<BlockerKind, number> = {
      CHIP_RACK: 2, POKER_CARD: 2, DEALERS_SAFE: 3, ROULETTE_WHEEL: 4,
    };
    const spawned: Blocker[] = [];
    for (const p of testLayout) {
      const bl: Blocker = {
        id: newId(), kind: p.blockerType,
        row: p.row, col: p.col,
        hp: maxHp[p.blockerType],
        faceRevealed: false, revealedType: null,
      };
      this.blockerGrid[p.row][p.col] = bl;
      // 비-통과형 블로커는 그리드 셀을 비워둠 (블록 못 들어옴)
      if (p.blockerType !== 'POKER_CARD') this.grid[p.row][p.col] = null;
      spawned.push(bl);
    }
    if (spawned.length > 0) this._emit({ type: 'BLOCKER_SPAWN', blockers: spawned });
  }

  getBlocker(row: number, col: number): Blocker | null {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return this.blockerGrid[row][col];
  }

  /**
   * 폭발된 블록 목록을 기반으로 인접 블로커에 피해 적용
   * isSpecial: 특수 블록 효과 여부 (룰렛휠은 특수 효과만 유효)
   */
  private _damageAdjacentBlockers(clearedBlocks: Block[], isSpecial: boolean): void {
    const clearedSet = new Set(clearedBlocks.map(b => `${b.row},${b.col}`));
    const hitMap = new Map<number, { blocker: Blocker; isSpecial: boolean; matchedColor?: BlockType }>();

    for (const b of clearedBlocks) {
      // 직접 타격: 특수 효과가 블로커 위치를 지나갈 때
      const directBl = this.blockerGrid[b.row]?.[b.col];
      if (directBl) {
        hitMap.set(directBl.id, { blocker: directBl, isSpecial, matchedColor: b.colorType });
      }
      // 인접 타격 (4방향)
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const ar = b.row + dr, ac = b.col + dc;
        if (ar < 0 || ar >= GRID_ROWS || ac < 0 || ac >= GRID_COLS) continue;
        if (clearedSet.has(`${ar},${ac}`)) continue;
        const adjBl = this.blockerGrid[ar]?.[ac];
        if (!adjBl || hitMap.has(adjBl.id)) continue;
        hitMap.set(adjBl.id, { blocker: adjBl, isSpecial: false, matchedColor: b.colorType });
      }
    }

    for (const { blocker, isSpecial: sp, matchedColor } of hitMap.values()) {
      this._applyBlockerDamage(blocker, sp, matchedColor);
    }
  }

  private _applyBlockerDamage(blocker: Blocker, isSpecial: boolean, matchedColor?: BlockType): void {
    // 룰렛휠: 특수 효과만 유효
    if (blocker.kind === 'ROULETTE_WHEEL' && !isSpecial) return;

    // 포커 카드: 1타 → 앞면 공개, 2타 → 동일 색 또는 특수만 유효
    if (blocker.kind === 'POKER_CARD') {
      if (!blocker.faceRevealed) {
        blocker.faceRevealed = true;
        blocker.revealedType = this.blockTypes[rand(this.blockTypes.length)];
        this._emit({ type: 'BLOCKER_REVEAL', blocker });
        return;
      }
      if (!isSpecial && matchedColor !== blocker.revealedType) return;
    }

    // 룰렛휠 타격 기록 (이번 턴 확산 방지)
    if (blocker.kind === 'ROULETTE_WHEEL') this._rouletteHitIds.add(blocker.id);

    blocker.hp--;
    this._emit({ type: 'BLOCKER_HIT', blocker, remainingHp: blocker.hp });

    if (blocker.hp <= 0) this._destroyBlocker(blocker);
  }

  private _destroyBlocker(blocker: Blocker): void {
    this.blockerGrid[blocker.row][blocker.col] = null;
    this._emit({ type: 'BLOCKER_DESTROY', blocker });

    switch (blocker.kind) {
      case 'CHIP_RACK': {
        // 빈 공간 3곳에 STRIPED 스폰
        const empty: [number, number][] = [];
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (!this.grid[r][c] && !this.blockerGrid[r][c]) empty.push([r, c]);
        for (let i = 0; i < 3 && empty.length > 0; i++) {
          const idx = rand(empty.length);
          const [er, ec] = empty.splice(idx, 1)[0];
          const nb = this._newBlock(er, ec);
          nb.kind = Math.random() < 0.5 ? 'STRIPED_H' : 'STRIPED_V';
          this.grid[er][ec] = nb;
          this._emit({ type: 'BLOCK_SPAWN', blocks: [nb] });
        }
        break;
      }
      case 'DEALERS_SAFE': {
        // 주변 3×3 블록 파괴 + 블로커 HP -1
        const area: Block[] = [];
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = blocker.row + dr, nc = blocker.col + dc;
            if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
            const nb = this.grid[nr][nc];
            if (nb) { area.push(nb); this.grid[nr][nc] = null; }
            const adjBl = this.blockerGrid[nr]?.[nc];
            if (adjBl && adjBl.id !== blocker.id) this._applyBlockerDamage(adjBl, true);
          }
        if (area.length > 0) {
          this._collectTargets(area);
          const pts = area.length * 80;
          this.score += pts; hudExternalStore.set('score.current', this.score);
          this._emit({ type: 'EXPLODE', blocks: area, combo: this.combo });
          this._emit({ type: 'SCORE_UPDATE', score: this.score, delta: pts });
          this._damageAdjacentBlockers(area, true);
        }
        break;
      }
      case 'POKER_CARD':
      case 'ROULETTE_WHEEL':
        // 특별 파괴 효과 없음 — 그리드에서 제거만 됨
        break;
    }
  }

  /** 매 턴 종료 후 룰렛휠 확산 체크 */
  private _checkRouletteSpread(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const bl = this.blockerGrid[r][c];
        if (!bl || bl.kind !== 'ROULETTE_WHEEL') continue;
        if (this._rouletteHitIds.has(bl.id)) continue; // 이번 턴 타격됨 → 확산 없음
        // 인접 빈 슬롯에 CHIP_RACK (HP1) 확산
        const adjacent: [number, number][] = [];
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
          if (!this.grid[nr][nc] && !this.blockerGrid[nr][nc]) adjacent.push([nr, nc]);
        }
        if (adjacent.length === 0) continue;
        const [nr, nc] = adjacent[rand(adjacent.length)];
        const spread: Blocker = {
          id: newId(), kind: 'CHIP_RACK',
          row: nr, col: nc, hp: 1,
          faceRevealed: false, revealedType: null,
        };
        this.blockerGrid[nr][nc] = spread;
        this.grid[nr][nc] = null;
        this._emit({ type: 'BLOCKER_SPAWN', blockers: [spread] });
      }
    }
    this._rouletteHitIds.clear();
  }

  /* ── 드롭 & 스폰 ── */
  private _dropAndSpawn(): void {
    this._setPhase('DROP_SPAWN');
    const dropMoves: { block: Block; toRow: number }[] = [];

    for (let c = 0; c < GRID_COLS; c++) {
      // 블로커로 분할된 세그먼트별 독립 처리
      // 세그먼트: [fromRow, toRow] (비-통과형 블로커는 분리선)
      const segments: [number, number][] = [];
      let segStart = 0;
      for (let r = 0; r < GRID_ROWS; r++) {
        if (this._isCellBlockedByBlocker(r, c)) {
          if (segStart < r) segments.push([segStart, r - 1]);
          segStart = r + 1;
        }
      }
      if (segStart < GRID_ROWS) segments.push([segStart, GRID_ROWS - 1]);

      for (const [from, to] of segments) {
        let emptyRow = to;
        for (let r = to; r >= from; r--) {
          const b = this.grid[r][c];
          if (b) {
            if (r !== emptyRow) {
              dropMoves.push({ block: b, toRow: emptyRow });
              this.grid[emptyRow][c] = b; this.grid[r][c] = null; b.row = emptyRow;
            }
            emptyRow--;
          }
        }
        for (let r = emptyRow; r >= from; r--) {
          const nb = this._newBlock(r, c);
          this.grid[r][c] = nb;
        }
      }
    }

    this._emit({ type: 'BLOCK_DROP', moves: dropMoves });

    const spawned: Block[] = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = this.grid[r][c];
        if (b?.isNew) { spawned.push(b); b.isNew = false; }
      }
    this._emit({ type: 'BLOCK_SPAWN', blocks: spawned });

    setTimeout(() => this._comboCheck(), 350);
  }

  /* ── 콤보 체크 ── */
  private _comboCheck(): void {
    this._setPhase('COMBO_CHECK');
    const matches = this._findAllMatches();
    if (matches.length > 0) {
      setTimeout(() => { this._setPhase('MATCH_CHECK'); this._processMatches(matches); }, 50);
    } else {
      this.combo = 0;
      setTimeout(() => this._resultCheck(), 100);
    }
  }

  /* ── 결과 판정 ── */
  private _resultCheck(): void {
    this._checkRouletteSpread(); // 매 턴 룰렛휠 확산 체크
    this._setPhase('RESULT_CHECK');
    const { missionType, targetBlockType, targetBlockCount, targetScore, star1, star2, star3 } = this.stageConfig;
    let cleared = false;
    if (missionType === 'BLOCK_COLLECTION' && targetBlockType) cleared = this.targetCollected >= targetBlockCount;
    else if (missionType === 'SCORE_TARGET') cleared = this.score >= targetScore;

    if (cleared) {
      if (this.moves > 0) {
        this._setPhase('BONUS_TIME');
        this._emit({ type: 'BONUS_TIME_START' });
        this._runBonusTime(() => this._success(star1, star2, star3));
      } else {
        this._success(star1, star2, star3);
      }
    } else if (this.moves <= 0) {
      this._setPhase('FAIL'); this._emit({ type: 'FAIL' });
    } else {
      this._setPhase('IDLE');
    }
  }

  private _success(star1: number, star2: number, star3: number): void {
    const stars = this.score >= star3 ? 3 : this.score >= star2 ? 2 : this.score >= star1 ? 1 : 0;
    this._setPhase('SUCCESS');
    this._emit({ type: 'SUCCESS', stars, score: this.score });
  }

  private _runBonusTime(onEnd: () => void): void {
    let bonusMoves = this.moves;
    this.moves = 0;
    hudExternalStore.set('moves.current', 0);

    // 로얄 매치 방식: 남은 횟수만큼 랜덤 위치에서 STRIPED 로켓 발동
    const tick = (): void => {
      if (bonusMoves <= 0) { this._emit({ type: 'BONUS_TIME_END' }); onEnd(); return; }
      bonusMoves--;

      const candidates: Block[] = [];
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++) {
          const b = this.grid[r][c];
          if (b) candidates.push(b);
        }

      if (candidates.length > 0) {
        const pivot = candidates[rand(candidates.length)];
        const isHoriz = Math.random() < 0.5;
        // 가짜 STRIPED 소스 (그리드에 추가 안 함 → 피벗 포함 행/열 전체 제거)
        const fakeSource: Block = {
          ...pivot, id: newId(),
          kind: isHoriz ? 'STRIPED_H' : 'STRIPED_V',
        };
        if (isHoriz) this._explodeRow(pivot.row, fakeSource);
        else         this._explodeCol(pivot.col, fakeSource);
      }

      setTimeout(tick, 500);
    };
    setTimeout(tick, 300);
  }

  /* ── 특수 블록 탭 발동 ── */
  tapSpecial(row: number, col: number): void {
    if (this._locked) return;
    const block = this.grid[row][col];
    if (!block || !this._isSpecial(block)) return;

    this._setPhase('MATCH_CHECK');
    this.moves--;
    this._emit({ type: 'MOVES_UPDATE', moves: this.moves });
    hudExternalStore.set('moves.current', this.moves);
    hudExternalStore.set('moves.warning', this.moves <= 5);
    this.combo = 0;

    // 그리드에서 제거
    this.grid[row][col] = null;
    this._setPhase('EXPLODE');
    this._emit({ type: 'EXPLODE', blocks: [block], combo: 1 });

    // 효과 발동
    setTimeout(() => this._activateSpecial(block), 120);

    // 특수 종류별 refill 타이밍
    const delay = block.kind === 'COLOR_BOMB' ? 1100
                : block.kind === 'PROPELLER'  ? 700
                : 380;
    setTimeout(() => this._dropAndSpawn(), delay);
  }

  /* ── 아이템 사용 ── */
  useItem(item: 'HAMMER' | 'HAND' | 'CLAW', row: number, col: number): void {
    if (item !== 'CLAW' && this._locked) return;
    const block = this.grid[row][col];
    if (!block) return;
    if (item === 'HAMMER') {
      this.grid[row][col] = null;
      this._emit({ type: 'ITEM_USE', item, targets: [block] });
      this.moves--;
      hudExternalStore.set('moves.current', this.moves);
      this._emit({ type: 'MOVES_UPDATE', moves: this.moves });
      this._collectTargets([block]);
      setTimeout(() => this._dropAndSpawn(), 300);
    }
  }

  /* ── HUD 동기화 ── */
  syncHud(): void {
    const { missionType, targetBlockType, targetBlockCount, targetScore, movesGiven, star1, star2, star3 } = this.stageConfig;
    let icon = '⭐';
    if (missionType === 'BLOCK_COLLECTION' && targetBlockType)
      icon = this.blockConfigs.find(b => b.blockType === targetBlockType)?.emoji ?? '?';
    const needed = missionType === 'BLOCK_COLLECTION'
      ? Math.max(0, targetBlockCount - this.targetCollected)
      : Math.max(0, targetScore - this.score);
    const pct = Math.min(100, (this.score / star3) * 100);
    hudExternalStore.setMany({
      'moves.current': this.moves, 'moves.warning': this.moves <= 5,
      'target.icon': icon, 'target.label': missionType === 'BLOCK_COLLECTION' ? 'COLLECT' : 'SCORE',
      'target.value': String(needed), 'score.current': this.score, 'stage.id': this.stageConfig.stageId,
      'stars.pct1': Math.min(100, (star1/star3)*100), 'stars.pct2': Math.min(100, (star2/star3)*100),
      'stars.pct3': pct, 'moves.total': movesGiven,
    });
  }

  private _updateStarGauge(): void {
    const { star3 } = this.stageConfig;
    hudExternalStore.set('stars.pct3', Math.min(100, (this.score / star3) * 100));
  }

  getBlock(row: number, col: number): Block | null {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return this.grid[row][col];
  }
}

export const boardCore = new BoardCore();
