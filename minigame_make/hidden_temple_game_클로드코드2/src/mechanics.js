// Dig logic, item collection, stage clear (items-only, isStageClearing flag)
import * as THREE from 'three';
import { revealTile, getItemEmoji } from './board.js';
import { saveState } from './data.js';
import { getCamera, getContainer } from './game.js';
import {
  updatePickaxe, updateGems, fillSlot,
  flyEmojiToSlot, flySlotsToDooor, pulseDoor,
  showModal, showPopup,
} from './ui.js';

let state       = null;
let itemCfg     = [];
let onStageCb   = null;
let isStageClearing = false; // Advanced Spec #6: prevents duplicate trigger

export function initMechanics(gameState, itemConfigs, stageCallback) {
  state           = gameState;
  itemCfg         = itemConfigs;
  onStageCb       = stageCallback;
  isStageClearing = false;
}

export function handleDig(tile) {
  if (!tile || !state) return;
  if (tile.final_type !== 'BOX')      return;
  if (tile.state === 'revealed')      return;
  if (state.event_completed)          return;
  if (isStageClearing)                return;

  if (state.pickaxe_count <= 0) {
    showModal('⛏️ 곡괭이 부족', '더 이상 채굴할 수 없습니다.\n곡괭이를 보충하세요.', '확인', () => {});
    return;
  }

  state.pickaxe_count -= 1;
  updatePickaxe(state.pickaxe_count);

  const result   = revealTile(tile.col, tile.row);
  if (!result) return;

  const screenPos = tileToScreen(tile.col, tile.row);

  if (result.type === 'GEM') {
    state.gems_collected++;
    updateGems(state.gems_collected, state.total_gems);
    showPopup('+1 💎', screenPos.x, screenPos.y);
  } else if (result.type === 'EMPTY_REWARD') {
    showPopup('✨', screenPos.x, screenPos.y);
  } else if (result.type === 'item_complete') {
    handleItemCollect(result.item_id, result.instance_id, screenPos);
  }
  // 'ITEM' (partial) and 'EMPTY' → no special popup

  saveState(state);

  if (state.pickaxe_count === 0 && !isStageClearing) {
    // Pickaxes depleted — freeze without resetting board (Advanced Spec: no defeat)
    showModal('⛏️ 곡괭이 소진', '더 이상 채굴할 수 없습니다. (+100 ⛏️ 버튼으로 추가)', '확인', () => {});
  }
}

function handleItemCollect(itemId, instanceId, screenPos) {
  const idx = state.active_items.findIndex(
    it => it.item_id === itemId && it.instance_id === instanceId,
  );
  if (idx === -1) return;
  if (state.active_items[idx].filled) return;

  state.active_items[idx].filled = true;
  const emoji = getItemEmoji(itemId);
  showPopup(emoji, screenPos.x, screenPos.y);
  fillSlot(idx, emoji, itemId);

  flyEmojiToSlot(emoji, screenPos.x, screenPos.y, idx).then(() => {
    checkStageComplete();
  });
}

async function checkStageComplete() {
  if (isStageClearing) return;
  if (!state.active_items.every(it => it.filled)) return;

  isStageClearing = true;

  await flySlotsToDooor();
  pulseDoor();

  await delay(300);

  if (state.stage >= 5) {
    state.event_completed = true;
    saveState(state);
    showModal('🏛️ 사원 정복!', '모든 관문을 열었습니다!\n이벤트 완료!', '완료', () => {});
    return;
  }

  const nextStage = state.stage + 1;
  showModal(
    `관문 ${state.stage} 클리어! 🎉`,
    `다음 관문 ${nextStage}으로 진행합니다.`,
    '계속하기',
    () => {
      isStageClearing = false;
      onStageCb(nextStage);
    },
  );
}

export function addPickaxes(n) {
  if (!state) return;
  state.pickaxe_count += n;
  updatePickaxe(state.pickaxe_count);
  saveState(state);
}

// Project tile world position → screen position for popup
function tileToScreen(col, row) {
  const camera    = getCamera();
  const container = getContainer();
  const vec = new THREE.Vector3(col - 1, -(row - 1), 0);
  vec.project(camera);
  const rect = container.getBoundingClientRect();
  return {
    x: (vec.x + 1) / 2 * rect.width  + rect.left,
    y: (-vec.y + 1) / 2 * rect.height + rect.top,
  };
}

const delay = ms => new Promise(r => setTimeout(r, ms));
