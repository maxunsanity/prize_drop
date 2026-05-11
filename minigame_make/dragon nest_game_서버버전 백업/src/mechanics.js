import { weightedRandom, savePlayerState, saveDragonState } from './data.js';
import { launchBall, removeBall } from './physics.js';

let _playerState, _dragonStates, _dragonConfig, _slotConfig;
let _activeDragonId = 1;
let _roundState = { bumperHits: 0, roundTokens: 0, targetSlotIdx: 0, slotMultiplier: 1, ball_in_play: false };
let _bumperHitMap = {};
let _onStageAdvance = null;
let _onGrandPrize = null;

export function initMechanics(playerState, dragonStates, dragonConfig, slotConfig, onStageAdvance, onGrandPrize) {
  _playerState = playerState;
  _dragonStates = dragonStates;
  _dragonConfig = dragonConfig;
  _slotConfig = slotConfig;
  _onStageAdvance = onStageAdvance;
  _onGrandPrize = onGrandPrize;
}

export function setActiveDragon(id) { _activeDragonId = id; }
export function getActiveDragonId() { return _activeDragonId; }
export function getActiveDragon() { return _dragonStates[_activeDragonId]; }
export function getPlayerState() { return _playerState; }
export function getDragonStates() { return _dragonStates; }
export function getRoundState() { return _roundState; }
export function getBumperHitMap() { return _bumperHitMap; }

export function selectMultiplier(mult) {
  _playerState.selected_multiplier = mult;
  savePlayerState(_playerState);
}

export function canLaunch() {
  return !_playerState.event_completed &&
    _playerState.ball_count >= _playerState.selected_multiplier &&
    !_roundState.ball_in_play;
}

export function launch(chargeRatio) {
  if (!canLaunch()) return false;

  // Step 1: pre-determine result before physics
  const targetSlotId = weightedRandom(_slotConfig);
  const slot = _slotConfig.find(s => s.slot_id === targetSlotId);
  const angleDeg = slot.angle_min + Math.random() * (slot.angle_max - slot.angle_min);
  const angleRad = angleDeg * (Math.PI / 180);
  // lerp(22, 30) — tuned so ball reaches bumpers in 390×420 world with gravity 1.5
  const speed = 22 + chargeRatio * 8;

  // Step 2: compute velocity — vy MUST be negative (upward in Matter.js)
  const vx = Math.sin(angleRad) * speed;
  const vy = -Math.cos(angleRad) * speed;

  _playerState.ball_count -= _playerState.selected_multiplier;
  _roundState = {
    bumperHits: 0,
    roundTokens: 0,
    targetSlotIdx: targetSlotId - 1, // 0-indexed
    slotMultiplier: slot.multiplier,
    ball_in_play: true,
  };
  _bumperHitMap = {};
  savePlayerState(_playerState);

  launchBall(vx, vy, targetSlotId - 1);
  return true;
}

export function onBumperHit(bumperId) {
  if (!_roundState.ball_in_play) return null;
  if (_roundState.bumperHits >= 7) return null;
  _roundState.bumperHits += 1;
  _roundState.roundTokens += 10;
  _bumperHitMap[bumperId] = performance.now();

  const isMax = _roundState.bumperHits === 7;
  if (isMax) _roundState.roundTokens += 10; // bumper bonus
  return { tokens: 10, isMax };
}

export function onSlotLanded() {
  const { targetSlotIdx, slotMultiplier, roundTokens } = _roundState;
  let finalTokens = roundTokens * slotMultiplier * _playerState.selected_multiplier;
  finalTokens = Math.max(finalTokens, 10); // minimum 10 tokens

  const dragon = _dragonStates[_activeDragonId];
  dragon.my_token += finalTokens;

  checkStageAdvance(_activeDragonId);
  saveDragonState(_activeDragonId, dragon);
  removeBall();

  _roundState.ball_in_play = false;

  return { finalTokens, slotMultiplier, slotIdx: targetSlotIdx };
}

export function onBotContribute(dragonId, amount) {
  const dragon = _dragonStates[dragonId];
  if (!dragon || dragon.completed) return;
  dragon.partner_token += amount;
  checkStageAdvance(dragonId);
  saveDragonState(dragonId, dragon);
  return amount;
}

function checkStageAdvance(dragonId) {
  const dragon = _dragonStates[dragonId];
  if (dragon.completed) return;
  const stageCfg = _dragonConfig[dragonId]?.stages.find(s => s.stage === dragon.stage);
  if (!stageCfg) return;
  const total = dragon.my_token + dragon.partner_token;
  if (total < stageCfg.target) return;

  if (dragon.stage >= 3) {
    dragon.completed = true;
    saveDragonState(dragonId, dragon);
    checkGrandPrize();
    _onStageAdvance?.(dragonId, dragon.stage, true);
  } else {
    dragon.stage += 1;
    dragon.my_token = 0;
    dragon.partner_token = 0;
    saveDragonState(dragonId, dragon);
    _onStageAdvance?.(dragonId, dragon.stage, false);
  }
}

function checkGrandPrize() {
  if (Object.values(_dragonStates).every(d => d.completed)) {
    _playerState.event_completed = true;
    savePlayerState(_playerState);
    _onGrandPrize?.();
  }
}

export function addBalls(amount) {
  _playerState.ball_count += amount;
  savePlayerState(_playerState);
}

export function getStageTarget(dragonId) {
  const dragon = _dragonStates[dragonId];
  const stageCfg = _dragonConfig[dragonId]?.stages.find(s => s.stage === dragon.stage);
  return stageCfg?.target ?? 500;
}
