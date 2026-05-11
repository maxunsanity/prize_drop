import { initPhysics, launchBall, removeBall, stepPhysics, getBallPos, getBumperHitTimes, setBallStateDone } from './physics.js';
import { drawFrame } from './renderer.js';
import { initInput, getChargeRatio } from './input.js';
import { updateHeader, updateMultiplierBtns, showSlotResult, addFloatText } from './ui.js';
import { loadSlotConfig, loadPlayerState, savePlayerState, clearStorage, initRoundLog, logRound, getRoundCount } from './data.js';
import * as L from './layout.js';

// ─── State ────────────────────────────────────────────────────────────────────

let slotConfig;
let playerState;
let roundState = resetRound();
let highlightSlot = null;
let highlightTimer = null;
let lastTime = 0;

function resetRound() {
  return {
    chargeRatio:    0,
    launchSpeed:    0,
    bumperHits:     0,
    bumperSequence: [],
    roundTokens:    0,
    ball_in_play:   false,
    landed:         false,
  };
}

// ─── Canvas setup ─────────────────────────────────────────────────────────────

let canvas, ctx;

function initCanvas() {
  canvas = document.getElementById('canvas-pinball');
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = L.CANVAS_W * dpr;
  canvas.height = L.CANVAS_H * dpr;
  canvas.style.width  = L.CANVAS_W + 'px';
  canvas.style.height = L.CANVAS_H + 'px';
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ─── Game logic ───────────────────────────────────────────────────────────────

function canLaunch() {
  return playerState.ball_count >= playerState.selected_multiplier
      && !roundState.ball_in_play;
}

function onLaunch(chargeRatio) {
  if (!canLaunch()) return;

  playerState.ball_count -= playerState.selected_multiplier;
  savePlayerState(playerState);

  roundState = resetRound();
  roundState.chargeRatio  = chargeRatio;
  roundState.ball_in_play = true;

  roundState.launchSpeed = launchBall(chargeRatio);
  updateHeader({ ballCount: playerState.ball_count, totalScore: playerState.total_score, roundCount: getRoundCount() });
  updateMultiplierBtns(playerState.selected_multiplier, playerState.ball_count);
}

function onBumperHit(id) {
  if (!roundState.ball_in_play || roundState.landed) return;
  roundState.bumperHits++;
  roundState.roundTokens += 5; // bumper_token_value = 5
  roundState.bumperSequence.push(id);

  const bumper = L.BUMPERS.find(b => b.id === id);
  if (bumper) addFloatText('+5', bumper.x, bumper.y - 20, 'float-token');
}

function onSlotLand(slotId) {
  if (roundState.landed) return;
  roundState.landed = true;
  setBallStateDone();

  const mult       = L.SLOT_MULTIPLIERS[slotId - 1];
  const label      = L.SLOT_LABELS[slotId - 1];
  const finalTokens = roundState.roundTokens * mult * playerState.selected_multiplier;

  playerState.total_score += finalTokens;
  savePlayerState(playerState);

  logRound({
    launchSpeed:    roundState.launchSpeed,
    chargeRatio:    roundState.chargeRatio,
    bumperHits:     roundState.bumperHits,
    bumperSequence: roundState.bumperSequence,
    landedSlot:     slotId,
    slotLabel:      label,
    roundTokens:    roundState.roundTokens,
    finalTokens,
  });

  highlightSlot = slotId;
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightSlot = null;
    removeBall();
    roundState = resetRound();
    updateHeader({ ballCount: playerState.ball_count, totalScore: playerState.total_score, roundCount: getRoundCount() });
  }, 1200);

  showSlotResult(label, finalTokens);
  addFloatText(`+${finalTokens}`, L.SLOT_CENTERS[slotId - 1], L.SLOT_ZONE_Y - 20, 'float-bonus');
  updateHeader({ ballCount: playerState.ball_count, totalScore: playerState.total_score, roundCount: getRoundCount() });
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min(now - lastTime, 32);
  lastTime = now;

  stepPhysics(delta);

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawFrame(ctx, {
    ballPos:       getBallPos(),
    bumperHitTimes:getBumperHitTimes(),
    chargeRatio:   getChargeRatio(),
    highlightSlot,
    roundTokens:   roundState.roundTokens,
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function main() {
  slotConfig  = await loadSlotConfig();
  playerState = loadPlayerState(10); // debug_start = 10
  initRoundLog();

  initCanvas();
  initPhysics(onBumperHit, onSlotLand);
  initInput(canvas, onLaunch, canLaunch);

  // Multiplier buttons
  document.querySelectorAll('.mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = Number(btn.dataset.mult);
      if (playerState.ball_count < m) return;
      playerState.selected_multiplier = m;
      savePlayerState(playerState);
      updateMultiplierBtns(m, playerState.ball_count);
    });
  });

  // Debug: +10 balls
  document.getElementById('debug-add-balls').addEventListener('click', () => {
    playerState.ball_count += 10;
    savePlayerState(playerState);
    updateHeader({ ballCount: playerState.ball_count, totalScore: playerState.total_score, roundCount: getRoundCount() });
    updateMultiplierBtns(playerState.selected_multiplier, playerState.ball_count);
  });

  // Reset
  document.getElementById('debug-reset').addEventListener('click', () => {
    if (confirm('초기화?')) { clearStorage(); location.reload(); }
  });

  updateHeader({ ballCount: playerState.ball_count, totalScore: playerState.total_score, roundCount: getRoundCount() });
  updateMultiplierBtns(playerState.selected_multiplier, playerState.ball_count);

  requestAnimationFrame(gameLoop);
}

main().catch(console.error);
