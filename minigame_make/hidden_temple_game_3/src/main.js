import { Data, StateManager } from './data.js';
import { setupUI, updateUI } from './ui.js';
import { initGame, renderLoop, resizeCanvas, centerCamera, camera, boardGroup } from './game.js';
import { generateBoard, buildBoardMeshes } from './board.js';
import { tryDig, nextStage, resetGame, cheatPickaxe } from './mechanics.js';
import * as THREE from 'three';

export let GameState = {
  pickaxe_count: 50,
  stage: 1,
  gems_collected: 0,
  active_items: [],
  event_completed: false,
  board: []
};

async function init() {
  const debugStart = Data.getEventConfig('pickaxe_debug_start') || 50;
  
  const saved = StateManager.load();
  if (saved) {
    GameState = saved;
  } else {
    GameState.pickaxe_count = debugStart;
    GameState.stage = 1;
    GameState.board = generateBoard(GameState.stage, GameState);
    StateManager.save(GameState);
  }

  setupUI();
  initGame('canvas-container');
  
  window.addEventListener('resize', resizeCanvas);
  
  centerCamera(GameState.board);
  buildBoardMeshes(GameState.board, boardGroup, GameState.active_items);
  
  renderLoop();
  updateUI(GameState);

  const container = document.getElementById('canvas-container');
  container.addEventListener('mousedown', (e) => {
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(boardGroup.children, true);
    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      if (obj.userData && obj.userData.isTile) {
        tryDig(obj.userData.c, obj.userData.r, e.clientX, e.clientY);
        break;
      }
    }
  });

  document.getElementById('modal-btn').addEventListener('click', nextStage);
  document.getElementById('reset-btn').addEventListener('click', resetGame);
  document.getElementById('cheat-btn').addEventListener('click', cheatPickaxe);
}

init();
