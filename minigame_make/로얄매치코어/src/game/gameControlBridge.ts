/**
 * gameControlBridge.ts — HUD 액션 → BoardCore 브릿지
 * json-render action handler → boardCore 메서드 연결
 */

import { boardCore } from './BoardCore.js';
import { hudExternalStore } from './hudExternalStore.js';

// 활성 아이템 상태
let _activeItem: 'HAMMER' | 'HAND' | 'CLAW' | null = null;

export function getActiveItem(): typeof _activeItem { return _activeItem; }

export function activateItem(item: 'HAMMER' | 'HAND' | 'CLAW'): void {
  if (_activeItem === item) {
    // 토글 해제
    _activeItem = null;
    hudExternalStore.set(`item.${item.toLowerCase()}.active`, false);
  } else {
    if (_activeItem) {
      hudExternalStore.set(`item.${_activeItem.toLowerCase()}.active`, false);
    }
    _activeItem = item;
    hudExternalStore.set(`item.${item.toLowerCase()}.active`, true);
  }
}

export function cancelActiveItem(): void {
  if (_activeItem) {
    hudExternalStore.set(`item.${_activeItem.toLowerCase()}.active`, false);
    _activeItem = null;
  }
}

// json-render actions (GameJsonHud에서 onAction으로 연결)
export const gameActions: Record<string, (payload?: unknown) => void> = {
  'item.use.HAMMER': () => { activateItem('HAMMER'); },
  'item.use.HAND':   () => { activateItem('HAND'); },
  'item.use.CLAW':   () => { activateItem('CLAW'); },

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
