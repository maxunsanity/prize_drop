import { Data, StateManager } from './data.js';
import { GameState } from './main.js';
import { buildBoardMeshes, generateBoard, EMOJI_MAP } from './board.js';
import { updateUI, showPopup, animateItemFly, animateStageClear } from './ui.js';
import { shakeCamera, spawnParticles, centerCamera, boardGroup } from './game.js';

export let isStageClearing = false;

export function tryDig(c, r, clientX, clientY) {
  if (isStageClearing || GameState.event_completed) return;
  
  const cell = GameState.board[r][c];
  if (cell.final_type !== 'BOX' || cell.state === 'revealed') return;
  if (GameState.pickaxe_count <= 0) {
    showPopup('곡괭이가 부족합니다!', clientX, clientY);
    return;
  }

  GameState.pickaxe_count--;
  cell.state = 'revealed';
  shakeCamera();
  spawnParticles(c, r);

  if (cell.content === 'GEM') {
    GameState.gems_collected++;
    showPopup('+1 💎', clientX, clientY);
  } else if (cell.content === 'ITEM') {
    const item = GameState.active_items.find(i => i.instance_id === cell.item_instance_id);
    if (item) {
      const allRevealed = item.tiles.every(t => GameState.board[t.r][t.c].state === 'revealed');
      if (allRevealed) {
        item.filled = true;
        
        // Items like pickaxe pack give instant reward
        if(item.item_id === 1006) {
          GameState.pickaxe_count += 5;
          showPopup('+5 ⛏️', clientX, clientY);
        }

        const targetSlot = document.getElementById(`slot-${item.instance_id}`);
        if(targetSlot) {
          animateItemFly(item.item_id, clientX, clientY, targetSlot).then(() => {
            targetSlot.classList.add('filled');
            targetSlot.innerText = EMOJI_MAP[item.item_id] || '❓';
            checkStageClear();
          });
        } else {
          checkStageClear();
        }
      }
    }
  }

  buildBoardMeshes(GameState.board, boardGroup, GameState.active_items);
  updateUI(GameState);
  StateManager.save(GameState);
}

export function checkStageClear() {
  if (isStageClearing) return;
  
  const allItemsFound = GameState.active_items.every(i => i.filled);
  if (allItemsFound) {
    isStageClearing = true;
    animateStageClear(GameState.active_items).then(() => {
      document.getElementById('modal-layer').classList.remove('hidden');
    });
  }
}

export function nextStage() {
  document.getElementById('modal-layer').classList.add('hidden');
  GameState.stage++;
  const maxStage = Data.getEventConfig('max_stage') || 5;
  if (GameState.stage > maxStage) {
    GameState.event_completed = true;
    GameState.stage = maxStage;
    alert("이벤트 올클리어!");
  } else {
    GameState.board = generateBoard(GameState.stage, GameState);
    centerCamera(GameState.board);
    buildBoardMeshes(GameState.board, boardGroup, GameState.active_items);
  }
  isStageClearing = false;
  updateUI(GameState);
  StateManager.save(GameState);
}

export function resetGame() {
  StateManager.reset();
  location.reload();
}

export function cheatPickaxe() {
  GameState.pickaxe_count += 100;
  updateUI(GameState);
  StateManager.save(GameState);
}
