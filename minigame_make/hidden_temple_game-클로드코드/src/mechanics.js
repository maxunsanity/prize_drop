import { saveBoardState, savePlayerState } from './data.js';
import { revealTile, getItemPlaneWorldPos, removeItemPlane } from './board.js';
import { triggerShake, spawnParticles, getScene } from './game.js';
import { updateUI, showFloatText, showItemPopup, flyItemToSlot, playStageClearAnim, showStageClearModal } from './ui.js';

let playerState = null;
let boardTiles = [];
let itemConfig = {};
let stageConfig = {};
let boardLocked = false;
let onStageAdvance = null;

export function initMechanics(ps, tiles, ic, sc, advanceCb) {
  playerState = ps;
  boardTiles = tiles;
  itemConfig = ic;
  stageConfig = sc;
  onStageAdvance = advanceCb;
  boardLocked = false;
}

export function isBoardLocked() { return boardLocked; }

export function dig(tileObj) {
  if (boardLocked) return;
  const tile = tileObj.tile;
  if (tile.final_type !== 'BOX') return;
  if (tile.state === 'revealed') return;
  if (playerState.pickaxe_count <= 0) return;

  playerState.pickaxe_count -= 1;
  tile.state = 'revealed';

  revealTile(tile.index, tile.content === 'ITEM' ? tile.item_instance_id : null);
  triggerShake(0.04, 6);
  spawnParticles(getScene(), tileObj.wx, tileObj.wz);
  saveBoardState(playerState.stage, boardTiles);
  savePlayerState(playerState);

  if (tile.content === 'GEM') {
    playerState.gems_collected += 1;
    savePlayerState(playerState);
    showFloatText('+1 💎', tileObj.wx, tileObj.wz);
  } else if (tile.content === 'EMPTY_REWARD') {
    showFloatText('🪙', tileObj.wx, tileObj.wz);
  } else if (tile.content === 'ITEM') {
    checkItemComplete(tile.item_instance_id);
  }

  if (playerState.pickaxe_count === 0) {
    console.log('곡괭이 소진! 진행 상태는 유지됩니다.');
  }

  updateUI(playerState, stageConfig[playerState.stage]);
}

function checkItemComplete(instanceId) {
  const itemTiles = boardTiles.filter(t => t.item_instance_id === instanceId);
  const allRevealed = itemTiles.every(t => t.state === 'revealed');
  if (!allRevealed) return;

  const itemId = itemTiles[0].item_id;
  const cfg = itemConfig[itemId];
  const worldPos = getItemPlaneWorldPos(instanceId);

  boardLocked = true;

  showItemPopup(worldPos, getItemEmoji(itemId), () => {
    const slotIdx = playerState.active_items.findIndex(a => a.instance_id === instanceId);
    flyItemToSlot(getItemEmoji(itemId), worldPos, slotIdx, () => {
      playerState.active_items[slotIdx].filled = true;
      if (cfg && cfg.reward_type === 'pickaxe') {
        playerState.pickaxe_count += cfg.reward_amount;
      }
      removeItemPlane(instanceId);
      savePlayerState(playerState);
      updateUI(playerState, stageConfig[playerState.stage]);
      boardLocked = false;
      checkStageClear();
    });
  });
}

function checkStageClear() {
  if (playerState.active_items.every(a => a.filled)) {
    stageClear();
  }
}

function stageClear() {
  boardLocked = true;
  const stage = playerState.stage;
  const doorEmojis = ['🚪','🏛️','⛩️','🏰','🗿','🌌'];

  playStageClearAnim(playerState.active_items, stage, () => {
    const nextStage = stage + 1;
    const isLast = nextStage > 5;
    showStageClearModal(
      stage,
      isLast,
      () => {
        playerState.stage = isLast ? stage : nextStage;
        playerState.gems_collected = 0;
        playerState.active_items = [];
        if (isLast) playerState.event_completed = true;
        savePlayerState(playerState);
        boardLocked = false;
        if (!isLast && onStageAdvance) onStageAdvance(nextStage);
      }
    );
  });
}

export function addPickaxes(n) {
  playerState.pickaxe_count += n;
  savePlayerState(playerState);
  updateUI(playerState, stageConfig[playerState.stage]);
}

function getItemEmoji(itemId) {
  const map = { 1001: '🏺', 1002: '🗝️', 1003: '⚔️', 1004: '🪖', 1005: '👑', 1006: '🛠️' };
  return map[itemId] || '💎';
}
