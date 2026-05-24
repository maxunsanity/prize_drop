/**
 * gameControlBridge.ts — HUD 액션 → BoardCore 브릿지
 * json-render action handler → boardCore 메서드 연결
 */

import { boardCore } from './BoardCore.js';
import { hudExternalStore } from './hudExternalStore.js';
import { clearHandSelectState } from '../three/inputHandler.js';

// 활성 아이템 상태 (HAMMER만 보드 탭 필요, SHUFFLE은 즉시 실행)
let _activeItem: 'HAMMER' | null = null;

export function getActiveItem(): typeof _activeItem { return _activeItem; }

export function activateItem(item: 'HAMMER'): void {
  clearHandSelectState();
  if (_activeItem === item) {
    _activeItem = null;
    hudExternalStore.set('item.hammer.active', false);
  } else {
    if (_activeItem !== null) {
      hudExternalStore.set('item.hammer.active', false);
    }
    _activeItem = item;
    hudExternalStore.set('item.hammer.active', true);
  }
}

export function cancelActiveItem(): void {
  clearHandSelectState();
  if (_activeItem !== null) {
    hudExternalStore.set('item.hammer.active', false);
    _activeItem = null;
  }
}

// json-render actions (GameJsonHud에서 onAction으로 연결)
export const gameActions: Record<string, (payload?: unknown) => void> = {
  'item.use.HAMMER':  () => { activateItem('HAMMER'); },
  // SHUFFLE은 보드 탭 불필요 — 버튼 클릭 즉시 실행
  'item.use.SHUFFLE': () => { cancelActiveItem(); boardCore.useItem('SHUFFLE', 0, 0); },

  'game.pause': () => {
    // TODO: 일시정지 모달
    console.log('[bridge] pause');
  },

  'modal.start': () => {
    // 엔트리 모달 확인 → 게임 시작
    boardCore.syncHud();
  },

  'modal.retry': () => {
    import('./bootstrapGame.js').then(({ bootstrapGame }) => {
      bootstrapGame(boardCore.stageConfig.stageId).catch(console.error);
    });
  },

  'modal.next': () => {
    import('./bootstrapGame.js').then(({ bootstrapGame }) => {
      const nextId = boardCore.stageConfig.stageId + 1;
      import('./data.js').then(({ storage }) => {
        storage.setStage(nextId);
        bootstrapGame(nextId).catch(console.error);
      });
    });
  },
};
