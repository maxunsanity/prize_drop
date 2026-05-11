// Entry: load CSVs, init scene, resume or generate board
import { parseCSV, loadState, saveState, clearState } from './data.js';
import { initThree, startRenderLoop, setCameraFromBounds, getContainer } from './game.js';
import { generateBoard, renderBoard, getActiveBounds, getRaycasterTile, getItemEmoji, clearBoard } from './board.js';
import { initUI, resetSlots, updatePickaxe, updateGems, updateStageProgress, fillSlot, previewSlot } from './ui.js';
import { initMechanics, handleDig, addPickaxes } from './mechanics.js';

let stageCfg, itemCfg;
let state;

async function loadCSVs() {
  const [sText, iText] = await Promise.all([
    fetch('/ht_stage_config.csv').then(r => r.text()),
    fetch('/ht_item_config.csv').then(r => r.text()),
  ]);
  stageCfg = parseCSV(sText);
  itemCfg  = parseCSV(iText);
}

function makeDefaultState(stage) {
  const cfg     = stageCfg.find(s => s.stage_id === stage);
  const itemIds = String(cfg.item_ids).split(',').map(s => s.trim()).filter(Boolean);
  return {
    pickaxe_count:   50,
    stage,
    gems_collected:  0,
    total_gems:      cfg.gem_count,
    active_items:    itemIds.map((id, i) => ({ item_id: parseInt(id), instance_id: i, filled: false })),
    event_completed: false,
    board:           null,
  };
}

function startStage(stage) {
  const cfg     = stageCfg.find(s => s.stage_id === stage);
  const itemIds = String(cfg.item_ids).split(',').map(s => s.trim()).filter(Boolean);

  state.stage          = stage;
  state.gems_collected = 0;
  state.total_gems     = cfg.gem_count;
  state.active_items   = itemIds.map((id, i) => ({
    item_id:     parseInt(id),
    instance_id: i,
    filled:      false,
  }));

  const tiles  = generateBoard(stage, stageCfg, itemCfg);
  state.board  = tiles;
  saveState(state);

  renderBoard(tiles);

  const b = getActiveBounds();
  setCameraFromBounds(b.minCol, b.maxCol, b.minRow, b.maxRow);

  resetSlots();
  state.active_items.forEach((it, i) => previewSlot(i, getItemEmoji(it.item_id)));
  updatePickaxe(state.pickaxe_count);
  updateGems(0, state.total_gems);
  updateStageProgress(stage);

  initMechanics(state, itemCfg, nextStage => startStage(nextStage));
}

function resumeStage() {
  renderBoard(state.board);

  const b = getActiveBounds();
  setCameraFromBounds(b.minCol, b.maxCol, b.minRow, b.maxRow);

  resetSlots();
  state.active_items.forEach((it, i) => {
    if (it.filled) fillSlot(i, getItemEmoji(it.item_id), it.item_id);
    else previewSlot(i, getItemEmoji(it.item_id));
  });

  updatePickaxe(state.pickaxe_count);
  updateGems(state.gems_collected, state.total_gems);
  updateStageProgress(state.stage);

  initMechanics(state, itemCfg, nextStage => startStage(nextStage));
}

async function main() {
  console.log('[HT] main start');
  await loadCSVs();
  console.log('[HT] CSV loaded, stages:', stageCfg.length, 'items:', itemCfg.length);

  initThree();
  const c = document.getElementById('canvas-container');
  console.log('[HT] container size:', c.clientWidth, 'x', c.clientHeight);

  initUI();
  startRenderLoop();

  const saved = loadState();
  if (saved && Array.isArray(saved.board) && saved.board.length > 0) {
    state = saved;
    console.log('[HT] resuming stage', state.stage);
    resumeStage();
  } else {
    clearState();
    state = makeDefaultState(1);
    console.log('[HT] starting stage 1');
    startStage(1);
  }
  console.log('[HT] activeBounds:', JSON.stringify(getActiveBounds()));

  // Canvas interaction
  const container = getContainer();
  container.addEventListener('click', e => {
    const tile = getRaycasterTile(e);
    if (tile) handleDig(tile);
  });
  container.addEventListener('touchstart', e => {
    e.preventDefault();
    const tile = getRaycasterTile(e);
    if (tile) handleDig(tile);
  }, { passive: false });

  // Buttons
  document.getElementById('cheat-btn').addEventListener('click', () => addPickaxes(100));
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('게임을 초기화하시겠습니까?')) { clearState(); location.reload(); }
  });

  // Resize
  window.addEventListener('ht-board-resize', () => {
    const b = getActiveBounds();
    setCameraFromBounds(b.minCol, b.maxCol, b.minRow, b.maxRow);
  });
}

document.addEventListener('DOMContentLoaded', () => main().catch(console.error));
