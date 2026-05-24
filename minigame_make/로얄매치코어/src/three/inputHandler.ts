/**
 * inputHandler.ts — Royal Match 스타일 드래그 입력
 *
 * 흐름:
 *   pointerdown  → 블록 히트 → Z-lift + scale-up, 드래그 시작
 *   pointermove  → 블록이 손가락을 실시간으로 따라옴 (1셀 범위 클램프)
 *                  15px 이상 이동 & 방향 결정 → swap 커밋 → 애니메이션 전환
 *   pointerup    → swap 미커밋 시 원위치 스냅백
 */

import * as THREE from 'three';
import { boardCore, GRID_ROWS, GRID_COLS } from '../game/BoardCore.js';
import { board3d, gridToWorld } from './board3d.js';
import { getActiveItem, cancelActiveItem } from '../game/gameControlBridge.js';

/* ── 상수 ── */
const DRAG_THRESHOLD = 14;   // px — 이 거리 넘으면 방향 결정 & swap 커밋
const LIFT_Z         = 0.28; // 드래그 중 블록 Z 들림
const LIFT_SCALE     = 1.09; // 드래그 중 블록 확대
const SPECIAL_KINDS  = new Set(['STRIPED_H','STRIPED_V','PROPELLER','TNT','COLOR_BOMB']);

/* ── 드래그 상태 ── */
interface DragState {
  active:    boolean;
  committed: boolean;          // 방향 결정 & swap 호출됨
  startX:    number;
  startY:    number;
  startRow:  number;
  startCol:  number;
  mesh:      THREE.Mesh | null;
  origX:     number;           // 블록 원래 월드 X
  origY:     number;           // 블록 원래 월드 Y
}

const drag: DragState = {
  active: false, committed: false,
  startX: 0, startY: 0,
  startRow: 0, startCol: 0,
  mesh: null, origX: 0, origY: 0,
};

/* ── 드래그 상태 초기화 ── */
function resetDrag(snapBack = false): void {
  if (drag.mesh) {
    if (snapBack) {
      // 원위치 스냅백 (스왑 안 된 경우)
      drag.mesh.scale.set(1, 1, 1);
      drag.mesh.position.set(drag.origX, drag.origY, 0.05);
    }
    drag.mesh = null;
  }
  drag.active    = false;
  drag.committed = false;
}

/* ── pointerdown ── */
function onPointerDown(e: PointerEvent): void {
  e.preventDefault();

  const hit = board3d.hitTestBlock(e.clientX, e.clientY);
  if (!hit) return;

  // 아이템 활성 상태 → 아이템 사용 (HAMMER: 탭한 블록 파괴)
  const activeItem = getActiveItem();
  if (activeItem) {
    boardCore.useItem(activeItem, hit.row, hit.col);
    cancelActiveItem();
    return;
  }

  if (boardCore.isLocked) return;

  const block = boardCore.getBlock(hit.row, hit.col);
  if (!block) return;

  // 특수 블록도 일반 블록과 동일하게 드래그 추적 시작
  // → 드래그 없이 손가락을 떼면 pointerup에서 단독 발동
  // → 다른 특수 블록으로 드래그하면 swap → 시너지 발동
  const mesh = board3d.blockMeshes.get(block.id) ?? null;
  const [wx, wy] = gridToWorld(hit.row, hit.col);

  drag.active    = true;
  drag.committed = false;
  drag.startX    = e.clientX;
  drag.startY    = e.clientY;
  drag.startRow  = hit.row;
  drag.startCol  = hit.col;
  drag.mesh      = mesh;
  drag.origX     = wx;
  drag.origY     = wy;

  // 블록 들기 (Z-lift + scale)
  if (mesh) {
    mesh.position.z = LIFT_Z;
    mesh.scale.set(LIFT_SCALE, LIFT_SCALE, 1);
    mesh.renderOrder = 6; // 다른 블록 위에 표시
  }
}

/* ── pointermove ── */
function onPointerMove(e: PointerEvent): void {
  if (!drag.active || drag.committed) return;
  if (boardCore.isLocked) { resetDrag(true); return; }

  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;

  // 블록이 손가락을 따라 실시간 이동 (1셀 = 1유닛 범위 클램프)
  if (drag.mesh) {
    const [wx, wy] = board3d.screenToWorld(e.clientX, e.clientY);
    const clampedX = drag.origX + Math.max(-1, Math.min(1, wx - drag.origX));
    const clampedY = drag.origY + Math.max(-1, Math.min(1, wy - drag.origY));
    drag.mesh.position.set(clampedX, clampedY, LIFT_Z);
  }

  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < DRAG_THRESHOLD) return;

  // 방향 결정
  let dr = 0, dc = 0;
  if (Math.abs(dx) > Math.abs(dy)) {
    dc = dx > 0 ? 1 : -1;
  } else {
    dr = dy > 0 ? 1 : -1;
  }

  const r2 = drag.startRow + dr;
  const c2 = drag.startCol + dc;

  if (r2 < 0 || r2 >= GRID_ROWS || c2 < 0 || c2 >= GRID_COLS) {
    // 범위 벗어남 → 스냅백
    resetDrag(true);
    return;
  }

  // swap 커밋 — 블록 scale/position 완전 리셋 (swapAnim이 원래 위치에서 시작해야 함)
  drag.committed = true;
  if (drag.mesh) {
    drag.mesh.scale.set(1, 1, 1);
    drag.mesh.position.set(drag.origX, drag.origY, 0.05); // x/y/z 모두 리셋
    drag.mesh.renderOrder = 2;
    drag.mesh = null;
  }

  drag.active = false;
  boardCore.swap(drag.startRow, drag.startCol, r2, c2);
}

/* ── pointerup ── */
function onPointerUp(_e: PointerEvent): void {
  if (drag.active && !drag.committed) {
    // 드래그 없이 손가락을 뗀 경우
    const block = boardCore.getBlock(drag.startRow, drag.startCol);
    if (block && SPECIAL_KINDS.has(block.kind)) {
      // 특수 블록 단독 탭 → 발동
      resetDrag(false);
      boardCore.tapSpecial(drag.startRow, drag.startCol);
    } else {
      // 일반 블록 탭 → 스냅백
      resetDrag(true);
    }
  } else {
    resetDrag(false);
  }
}

/* ── pointercancel ── */
function onPointerCancel(_e: PointerEvent): void {
  resetDrag(true);
}

/* ── attach / detach ── */
export function attachInputHandlers(canvas: HTMLElement): () => void {
  canvas.addEventListener('pointerdown',   onPointerDown,   { passive: false });
  canvas.addEventListener('pointermove',   onPointerMove,   { passive: true  });
  canvas.addEventListener('pointerup',     onPointerUp,     { passive: true  });
  canvas.addEventListener('pointercancel', onPointerCancel, { passive: true  });

  return (): void => {
    canvas.removeEventListener('pointerdown',   onPointerDown);
    canvas.removeEventListener('pointermove',   onPointerMove);
    canvas.removeEventListener('pointerup',     onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
  };
}

/** HAND 아이템 제거됨 — 호환성을 위해 stub 유지 */
export function clearHandSelectState(): void {
  // no-op: HAND 아이템 제거됨
}
