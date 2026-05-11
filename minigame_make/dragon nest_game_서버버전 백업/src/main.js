import { loadAllData, loadPlayerState, savePlayerState, loadDragonState, clearAllStorage, startBotTimer } from './data.js';
import { initPhysics, physicsStep, getBallPos, getBallState, BUMPER_POSITIONS } from './physics.js';
import { drawFrame } from './board.js';
import {
  initMechanics, setActiveDragon, selectMultiplier, launch, canLaunch,
  onBumperHit, onSlotLanded, onBotContribute,
  getBumperHitMap, getRoundState, addBalls,
} from './mechanics.js';
import {
  showScreen, renderLobby, updatePinballUI, addFloatText,
  initSpring, showStageRewardModal, showGrandPrizeModal,
} from './ui.js';

let allData, dragonStates, playerState;
let canvas, ctx;
let highlightSlotIdx = null;
let highlightTimeout = null;
let pendingLanded = false;

async function main() {
  allData = await loadAllData();
  const { eventConfig, dragonConfig, slotConfig } = allData;

  const defaultBalls = eventConfig['ball_debug_start'] ?? 6;
  playerState = loadPlayerState(defaultBalls);
  // Auto-fix stale state: balls exhausted or event completed from old session
  if (playerState.ball_count <= 0 || playerState.event_completed) {
    playerState.ball_count = defaultBalls;
    playerState.event_completed = false;
    playerState.selected_multiplier = 1;
    savePlayerState(playerState);
  }
  dragonStates = {};
  for (let id = 1; id <= 4; id++) dragonStates[id] = loadDragonState(id);

  initMechanics(playerState, dragonStates, dragonConfig, slotConfig, onStageAdvance, onGrandPrize);
  initPhysics(handleBumperHit);

  canvas = document.getElementById('canvas-pinball');
  ctx = canvas.getContext('2d');
  initCanvas();

  // Lobby
  showScreen('lobby');
  renderLobby(dragonConfig, (dragonId) => {
    setActiveDragon(dragonId);
    showScreen('pinball');
    updatePinballUI(dragonConfig);
    resetRoundUI();
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    showScreen('lobby');
    renderLobby(dragonConfig, (id) => {
      setActiveDragon(id);
      showScreen('pinball');
      updatePinballUI(dragonConfig);
      resetRoundUI();
    });
  });

  // Reset
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('초기화할까요?')) { clearAllStorage(); location.reload(); }
  });

  // Multiplier buttons
  document.querySelectorAll('.mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectMultiplier(Number(btn.dataset.mult));
      updatePinballUI(dragonConfig);
    });
  });

  // Debug: +10 balls
  document.getElementById('debug-add-balls').addEventListener('click', () => {
    addBalls(10);
    updatePinballUI(dragonConfig);
  });

  // Spring launcher
  initSpring((chargeRatio) => {
    if (!canLaunch()) return;
    const ok = launch(chargeRatio);
    if (ok) {
      pendingLanded = false;
      updatePinballUI(dragonConfig);
    }
  });

  // Grand prize modal close
  document.getElementById('gp-ok-btn').addEventListener('click', () => {
    document.getElementById('grand-prize-modal').style.display = 'none';
  });

  // Bot
  startBotTimer(dragonStates, eventConfig, (dragonId, amount) => {
    const result = onBotContribute(dragonId, amount);
    if (document.getElementById('pinball-screen').style.display !== 'none') {
      updatePinballUI(dragonConfig);
      addFloatText(`+${amount} 🔵`, canvas, 195, 350, 'float-token');
    } else {
      renderLobby(dragonConfig, () => {});
    }
  });

  requestAnimationFrame(gameLoop);
}

let lastTime = 0;
function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min(now - lastTime, 32);
  lastTime = now;

  if (document.getElementById('pinball-screen').style.display === 'none') return;

  const event = physicsStep(delta);

  if (event === 'landed' && !pendingLanded) {
    pendingLanded = true;
    const { finalTokens, slotMultiplier, slotIdx } = onSlotLanded();
    highlightSlotIdx = slotIdx;
    addFloatText(`+${finalTokens}`, canvas, 195, 300, 'float-bonus');
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => {
      highlightSlotIdx = null;
      pendingLanded = false;
    }, 800);
    updatePinballUI(allData.dragonConfig);
  }

  // Draw
  const ballPos = getBallPos();
  const ballState = getBallState();
  const { bumperHits } = getRoundState();
  const bumperHitMap = getBumperHitMap();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawFrame(ctx, {
    bumperHitMap,
    bumperHitCount: bumperHits,
    ballPos,
    ballState,
    highlightSlot: highlightSlotIdx,
  });
}

function handleBumperHit(bumperId) {
  const result = onBumperHit(bumperId);
  if (!result) return;
  const bp = BUMPER_POSITIONS.find(b => b.id === bumperId);
  addFloatText('+10', canvas, bp?.x ?? 195, bp?.y ?? 200);
  if (result.isMax) addFloatText('MAX BONUS! +10', canvas, 195, 160, 'float-bonus');
}

function onStageAdvance(dragonId, newStage, isCompleted) {
  showStageRewardModal(allData.dragonConfig, dragonId, newStage, isCompleted, () => {
    updatePinballUI(allData.dragonConfig);
    renderLobby(allData.dragonConfig, () => {});
  });
}

function onGrandPrize() {
  setTimeout(() => showGrandPrizeModal(), 500);
}

function initCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 390 * dpr;
  canvas.height = 420 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetRoundUI() {
  highlightSlotIdx = null;
  pendingLanded = false;
}

main().catch(console.error);
