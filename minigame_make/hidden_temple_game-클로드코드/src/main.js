import { loadAllData, loadPlayerState, loadBoardState, saveBoardState, savePlayerState, clearAllStorage } from './data.js';
import { initThree, getCamera, getRenderer } from './game.js';
import { renderBoard, getTileAtPointer } from './board.js';
import { initMechanics, dig, isBoardLocked, addPickaxes } from './mechanics.js';
import { initCursor, swingCursor, updateUI, initItemSlots, updateStageProgress } from './ui.js';

let allData = null;
let playerState = null;

async function main() {
  allData = await loadAllData();
  const { eventConfig, itemConfig, stageConfig } = allData;

  playerState = loadPlayerState(eventConfig.pickaxe_debug_start ?? 50);

  const container = document.getElementById('canvas-wrap');
  initThree(container);
  initCursor();

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('정말 리셋할까요?')) { clearAllStorage(); location.reload(); }
  });
  document.getElementById('cheat-btn').addEventListener('click', () => addPickaxes(100));

  await loadOrGenerateBoard(playerState.stage);

  container.addEventListener('pointerdown', e => {
    if (isBoardLocked()) return;
    swingCursor();
    const tileObj = getTileAtPointer(e, getRenderer(), getCamera());
    if (tileObj && tileObj.tile.state === 'hidden' && tileObj.tile.final_type === 'BOX') {
      dig(tileObj);
    }
  });
}

async function loadOrGenerateBoard(stageId) {
  const { itemConfig, stageConfig } = allData;
  const sc = stageConfig[stageId];
  if (!sc) { console.error('스테이지 없음:', stageId); return; }

  let tiles = loadBoardState(stageId);
  if (!tiles) {
    tiles = generateBoard(stageId, sc, itemConfig);
    saveBoardState(stageId, tiles);
  }

  // active_items 재구성 (저장된 상태 없으면 새로 만들기)
  if (!playerState.active_items || playerState.active_items.length === 0) {
    playerState.active_items = buildActiveItems(sc, itemConfig, tiles);
    savePlayerState(playerState);
  }

  renderBoard(tiles, stageId, itemConfig);
  initMechanics(playerState, tiles, itemConfig, stageConfig, onStageAdvance);
  initItemSlots(playerState.active_items);
  updateUI(playerState, sc);
}

function buildActiveItems(sc, itemConfig, tiles) {
  const result = [];
  const seen = new Set();
  tiles.forEach(t => {
    if (t.content === 'ITEM' && !seen.has(t.item_instance_id)) {
      seen.add(t.item_instance_id);
      const cfg = itemConfig[t.item_id];
      result.push({ item_id: t.item_id, instance_id: t.item_instance_id, filled: false, tile_count: cfg ? cfg.tile_count : 1 });
    }
  });
  return result;
}

function generateBoard(stageId, sc, itemConfig) {
  const COLS = 10, ROWS = 10;
  const tiles = [];
  let idx = 0;

  for (let r = 1; r <= ROWS; r++) {
    for (let c = 1; c <= COLS; c++) {
      const colT = sc.col_types[c - 1] || 'NULL';
      const rowT = sc.row_types[r - 1] || 'NULL';
      let finalType = 'NULL';
      if (colT === 'NULL' || rowT === 'NULL') finalType = 'NULL';
      else if (colT === 'BLOCK' || rowT === 'BLOCK') finalType = 'BLOCK';
      else finalType = 'BOX';
      tiles.push({ index: idx++, row: r, col: c, final_type: finalType, content: 'EMPTY', item_instance_id: 0, item_id: 0, state: 'hidden' });
    }
  }

  const boxTiles = tiles.filter(t => t.final_type === 'BOX');
  const available = [...boxTiles];
  let instanceId = 1;

  // 아이템 배치
  for (const itemId of sc.item_ids) {
    const cfg = itemConfig[itemId];
    if (!cfg) continue;
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const anchor = available[Math.floor(Math.random() * available.length)];
      if (!anchor) break;
      const tilePositions = cfg.tiles.map(t => ({ row: anchor.row + t.offset_row, col: anchor.col + t.offset_col }));
      const targets = tilePositions.map(p => available.find(t => t.row === p.row && t.col === p.col));
      if (targets.every(Boolean)) {
        targets.forEach(t => {
          t.content = 'ITEM';
          t.item_instance_id = instanceId;
          t.item_id = itemId;
          available.splice(available.indexOf(t), 1);
        });
        instanceId++;
        placed = true;
      }
    }
  }

  // GEM 배치
  for (let i = 0; i < sc.gem_count && available.length; i++) {
    const ri = Math.floor(Math.random() * available.length);
    available[ri].content = 'GEM';
    available.splice(ri, 1);
  }

  // EMPTY_REWARD 배치
  const rewardCount = Math.floor(available.length * sc.empty_reward_ratio);
  for (let i = 0; i < rewardCount && available.length; i++) {
    const ri = Math.floor(Math.random() * available.length);
    available[ri].content = 'EMPTY_REWARD';
    available.splice(ri, 1);
  }

  return tiles;
}

async function onStageAdvance(nextStage) {
  // 새 스테이지 보드 생성
  await loadOrGenerateBoard(nextStage);
}

main().catch(console.error);
